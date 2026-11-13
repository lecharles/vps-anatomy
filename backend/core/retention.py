"""Retention: hourly rollups are the archive; raw scan rows are the hot path.

Every day (and once shortly after startup) the scanner folds its history
into `trend_hours` — one row per UTC hour, the same buckets /api/trends
answers with — then prunes raw scan snapshots older than RETENTION_DAYS
(default 60). The Changes event log is never pruned: it is small, it is
append-only history, and the Changes feed is its UI.

Order matters: roll up first, then prune, so an hour only loses its raw
rows once its archive row exists. If a chart window reaches past what raw
rows cover, /api/trends fills those hours from the archive — the history
survives the pruning it was born into.
"""
import os
from datetime import datetime, timedelta

from sqlalchemy import case, distinct, func
from sqlalchemy.orm import Session

from models import MachineState, ModuleState, ServiceState, TrendHour, LatencySample

# Hour buckets are stored as zero-padded ISO strings; lex order == time order.
HOUR_FMT = "%Y-%m-%dT%H:00:00Z"

RETENTION_DAYS = int(os.environ.get("RETENTION_DAYS", "60"))
RUN_EVERY_HOURS = int(os.environ.get("RETENTION_INTERVAL_HOURS", "24"))

_last_run: datetime | None = None


def rollup_hours(db: Session) -> int:
    """Refresh the archive from whatever raw rows still exist.

    Hours covered by raw data are upserted, so an hour that was archived
    while still open gets corrected once it closes; pruned hours are not
    in the raw scan at all and keep their last-known archive values. The
    current (still-open) hour is skipped — /api/trends computes it fresh
    from raw anyway. Returns the number of rows written.
    """
    open_hour = datetime.utcnow().strftime(HOUR_FMT)
    new: dict[str, dict] = {}

    def bucket(hour: str) -> dict:
        return new.setdefault(
            hour,
            {
                "scans": 0,
                "services_listening": None,
                "modules_live": None,
                "ram_gb_avg": None,
                "disk_used_gb_avg": None,
            },
        )

    hour = func.strftime(HOUR_FMT, MachineState.timestamp)
    for row in (
        db.query(
            hour.label("hour"),
            func.count(MachineState.id),
            func.avg(MachineState.ram_gb),
            func.avg(MachineState.disk_used_gb),
        )
        .group_by("hour")
        .all()
    ):
        b = bucket(row[0])
        b["scans"] = int(row[1] or 0)
        b["ram_gb_avg"] = round(float(row[2]), 2) if row[2] is not None else None
        b["disk_used_gb_avg"] = round(float(row[3]), 2) if row[3] is not None else None

    for h, ports in (
        db.query(
            func.strftime(HOUR_FMT, ServiceState.timestamp).label("hour"),
            func.count(distinct(ServiceState.port)),
        )
        .group_by("hour")
        .all()
    ):
        bucket(h)["services_listening"] = int(ports or 0)

    for h, mods in (
        db.query(
            func.strftime(HOUR_FMT, ModuleState.timestamp).label("hour"),
            func.count(
                distinct(
                    case((ModuleState.status == "live", ModuleState.module_id), else_=None)
                )
            ),
        )
        .group_by("hour")
        .all()
    ):
        bucket(h)["modules_live"] = int(mods or 0)

    added = 0
    for key, values in new.items():
        if key >= open_hour:
            continue  # still-open hour — raw serves it live; archive it next pass
        row = db.get(TrendHour, key)
        if row is None:
            db.add(TrendHour(hour=key, **values))
        else:
            for field, value in values.items():
                if getattr(row, field) != value:
                    setattr(row, field, value)
            row.computed_at = datetime.utcnow()
        added += 1
    db.commit()
    return added


def prune_raw(db: Session) -> dict:
    """Delete raw scan snapshots older than RETENTION_DAYS. Returns per-table
    delete counts. The Changes log and the trend_hours archive are kept."""
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    deleted = {}
    for model in (MachineState, ServiceState, ModuleState, LatencySample):
        n = db.query(model).filter(model.timestamp < cutoff).delete()
        deleted[model.__tablename__] = n
    db.commit()
    return deleted


def run_once(db: Session) -> None:
    added = rollup_hours(db)
    deleted = prune_raw(db)
    total = sum(deleted.values())
    print(
        f"[retention] +{added} archived hours · -{total} raw rows older than "
        f"{RETENTION_DAYS}d ({', '.join(f'{t}:{n}' for t, n in deleted.items())})",
        flush=True,
    )


def maybe_run(db: Session) -> None:
    """Called from the scan loop on every pass; does the work at most once
    per RUN_EVERY_HOURS. The first call after startup always runs, so a
    restarted app archives and prunes before serving stale-deep history."""
    global _last_run
    now = datetime.utcnow()
    if _last_run is not None and now - _last_run < timedelta(hours=RUN_EVERY_HOURS):
        return
    _last_run = now
    run_once(db)
