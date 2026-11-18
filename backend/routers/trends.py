import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import case, distinct, func
from sqlalchemy.orm import Session

from database import get_db
from models import MachineState, ModuleState, ServiceState, TrendHour
from schemas import HourlyTrend

router = APIRouter(prefix="/api/trends", tags=["trends"])

# SQLite hour bucket: timestamps are written by the scanner in UTC.
HOUR_FMT = "%Y-%m-%dT%H:00:00Z"

# Metrics the `metrics` param can select. Each maps to one rollup below.
# `scans` (rows behind each bucket) always rides along — it is provenance,
# not a series.
SELECTABLE = ("services", "modules", "ram", "disk")

# Canonical CSV column order: hour and scans always, then every selected
# metric in the order it appears in SELECTABLE — never in dict order, so
# the same query produces the same file on every run and every host.
COLUMNS_FOR = {
    "services": "services_listening",
    "modules": "modules_live",
    "ram": "ram_gb_avg",
    "disk": "disk_used_gb_avg",
}


def _hour_expr(ts):
    return func.strftime(HOUR_FMT, ts).label("hour")


def _parse_metrics(raw: str) -> set[str]:
    """Comma-separated metric names -> set; rejects anything unknown.

    Whitespace and case are forgiven ("RAM, disk " is fine); a name outside
    SELECTABLE is a client bug, so it answers 422 with the valid list
    instead of quietly charting nothing.
    """
    chosen = {part.strip().lower() for part in raw.split(",") if part.strip()}
    if not chosen:
        raise HTTPException(
            status_code=422,
            detail=f"metrics must name at least one of: {', '.join(SELECTABLE)}",
        )
    unknown = chosen - set(SELECTABLE)
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=(
                f"unknown metric(s): {', '.join(sorted(unknown))}. "
                f"Choose from: {', '.join(SELECTABLE)}"
            ),
        )
    return chosen


def _rollup(db: Session, hours: int, chosen: set[str]) -> list[dict]:
    """Collapse 30-second scan rows into one point per UTC hour.

    Each bucket reports what the scanner recorded during that hour:
    how many scans ran, how many distinct ports were listening at any
    point, how many residents were live at any point, and the mean RAM
    and disk-used totals. Hours with no recorded scans are simply
    absent from the list.

    Only metrics named in `chosen` are computed — one grouped query per
    metric, never all four for a single line. Unselected fields come
    back None (JSON answers null; CSV leaves the column out entirely).

    Raw snapshots are pruned past the retention window by the daily
    retention job; archived hours (trend_hours) fill any bucket the
    raw tables no longer cover, so history outlives the rows it came
    from. Fresh hours are always computed from raw, never from the
    archive.
    """
    since = datetime.utcnow() - timedelta(hours=hours)

    merged: dict[str, dict] = {}

    def bucket(hour: str) -> dict:
        return merged.setdefault(
            hour,
            {
                "hour": hour,
                "scans": 0,
                "services_listening": None,
                "modules_live": None,
                "ram_gb_avg": None,
                "disk_used_gb_avg": None,
            },
        )

    if "services" in chosen:
        for hour, services_listening in (
            db.query(
                _hour_expr(ServiceState.timestamp),
                func.count(distinct(ServiceState.port)).label("services_listening"),
            )
            .filter(ServiceState.timestamp >= since)
            .group_by("hour")
            .all()
        ):
            bucket(hour)["services_listening"] = int(services_listening or 0)

    if "modules" in chosen:
        for hour, modules_live in (
            db.query(
                _hour_expr(ModuleState.timestamp),
                func.count(
                    distinct(
                        case(
                            (ModuleState.status == "live", ModuleState.module_id),
                            else_=None,
                        )
                    )
                ).label("modules_live"),
            )
            .filter(ModuleState.timestamp >= since)
            .group_by("hour")
            .all()
        ):
            bucket(hour)["modules_live"] = int(modules_live or 0)

    if "ram" in chosen or "disk" in chosen:
        columns = [_hour_expr(MachineState.timestamp), func.count(MachineState.id)]
        if "ram" in chosen:
            columns.append(func.avg(MachineState.ram_gb))
        if "disk" in chosen:
            columns.append(func.avg(MachineState.disk_used_gb))
        rows = (
            db.query(*columns)
            .filter(MachineState.timestamp >= since)
            .group_by("hour")
            .all()
        )
        for row in rows:
            hour, scans = row[0], row[1]
            b = bucket(hour)
            b["scans"] = int(scans or 0)
            i = 2
            if "ram" in chosen:
                b["ram_gb_avg"] = round(float(row[i]), 2) if row[i] is not None else None
                i += 1
            if "disk" in chosen:
                b["disk_used_gb_avg"] = (
                    round(float(row[i]), 2) if row[i] is not None else None
                )
    else:
        # Machine rows are the scan counter; without ram/disk selected,
        # fetch just the counts so every bucket still shows its provenance.
        for hour, scans in (
            db.query(
                _hour_expr(MachineState.timestamp),
                func.count(MachineState.id).label("scans"),
            )
            .filter(MachineState.timestamp >= since)
            .group_by("hour")
            .all()
        ):
            bucket(hour)["scans"] = int(scans or 0)

    # Fill buckets the raw tables no longer cover from the archive. The
    # hour key is a zero-padded ISO string, so >= on the string is >= in
    # time. Fresh hours already in `merged` win — the archive only backs
    # what retention took away.
    since_key = since.strftime(HOUR_FMT)
    for row in (
        db.query(TrendHour)
        .filter(TrendHour.hour >= since_key)
        .order_by(TrendHour.hour)
        .all()
    ):
        if row.hour in merged:
            continue
        merged[row.hour] = {
            "hour": row.hour,
            "scans": row.scans,
            **{
                field: (getattr(row, field) if name in chosen else None)
                for name, field in COLUMNS_FOR.items()
            },
        }

    return [merged[h] for h in sorted(merged)]


@router.get(
    "/",
    response_model=list[HourlyTrend],
    summary="Hourly rollups of the scan history",
    responses={
        200: {
            "description": (
                "One point per UTC hour with recorded data, oldest first. "
                "Hours the scanner never ran are absent, not zero."
            ),
            "content": {
                "application/json": {
                    "example": [
                        {
                            "hour": "2026-01-05T09:00:00Z",
                            "scans": 119,
                            "services_listening": 12,
                            "modules_live": 5,
                            "ram_gb_avg": 7.4,
                            "disk_used_gb_avg": 21.3,
                        },
                        {
                            "hour": "2026-01-05T10:00:00Z",
                            "scans": 120,
                            "services_listening": 12,
                            "modules_live": 6,
                            "ram_gb_avg": 7.5,
                            "disk_used_gb_avg": 21.4,
                        },
                    ],
                }
            },
        },
        422: {
            "description": (
                "An unknown metric name, an empty metric list, or an "
                "out-of-range `hours`. The error body names the valid "
                "choices instead of quietly charting nothing."
            )
        },
    },
)
def get_trends(
    hours: int = Query(
        24,
        ge=1,
        le=720,
        description=(
            "Trailing hours to roll up. Dashboard convention: "
            "day = 24, week = 168, month = 720."
        ),
    ),
    metrics: str = Query(
        ",".join(SELECTABLE),
        description=(
            "Comma-separated series to compute: "
            "services (distinct listening ports), modules (live residents), "
            "ram (mean GB), disk (mean used GB). Unselected fields come "
            "back null; unknown names are rejected with 422."
        ),
    ),
    db: Session = Depends(get_db),
):
    """Serve the hourly rollup as JSON — see `_rollup` for the contract."""
    return _rollup(db, hours, _parse_metrics(metrics))


@router.get(
    "/export",
    summary="The same hourly rollup as a CSV file",
    description=(
        "One row per recorded UTC hour, oldest first — the identical "
        "buckets `/api/trends/` answers with, serialized for spreadsheets "
        "and notebooks. Columns: `hour`, `scans` (provenance, always), "
        "then the metrics named in `metrics=`, in canonical order. An "
        "hour the scanner never ran is an absent row, never a zero row; "
        "a selected metric with no recorded value in a row leaves that "
        "field empty. Same `hours` bounds and same 422-on-unknown-metric "
        "policy as the JSON endpoint."
    ),
    response_class=Response,
    responses={
        200: {
            "description": (
                "text/csv attachment. Header row plus one row per "
                "recorded hour; a window with no recorded data is a "
                "header-only file — an empty record, stated."
            ),
            "content": {
                "text/csv": {
                    "example": (
                        "hour,scans,services_listening,ram_gb_avg\r\n"
                        "2026-01-05T09:00:00Z,119,12,7.4\r\n"
                        "2026-01-05T10:00:00Z,120,12,7.5\r\n"
                    )
                }
            },
        },
        422: {
            "description": (
                "Same validation as `/api/trends/`: an unknown metric "
                "name, an empty metric list, or an out-of-range `hours` "
                "answers with a JSON error naming the valid choices — "
                "never a CSV that quietly omits a series."
            )
        },
    },
)
def export_trends_csv(
    hours: int = Query(
        24,
        ge=1,
        le=720,
        description="Trailing hours to export. day = 24, week = 168, month = 720.",
    ),
    metrics: str = Query(
        ",".join(SELECTABLE),
        description=(
            "Comma-separated columns to include beyond hour and scans: "
            "services, modules, ram, disk. Unselected metrics get no "
            "column at all; unknown names are rejected with 422."
        ),
    ),
    db: Session = Depends(get_db),
):
    """The `/api/trends/` rollup, serialized as CSV.

    Deliberately one computation, two serializations: this route calls
    the same `_rollup` the JSON endpoint answers from, so a chart and a
    downloaded file can never disagree about what an hour recorded.
    """
    chosen = _parse_metrics(metrics)
    points = _rollup(db, hours, chosen)

    columns = ["hour", "scans"] + [
        COLUMNS_FOR[name] for name in SELECTABLE if name in chosen
    ]

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for point in points:
        writer.writerow({k: ("" if point[k] is None else point[k]) for k in columns})

    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="trends-{hours}h.csv"'
        },
    )
