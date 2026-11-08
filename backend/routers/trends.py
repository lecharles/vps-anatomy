from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, distinct, func
from sqlalchemy.orm import Session

from database import get_db
from models import MachineState, ModuleState, ServiceState
from schemas import HourlyTrend

router = APIRouter(prefix="/api/trends", tags=["trends"])

# SQLite hour bucket: timestamps are written by the scanner in UTC.
HOUR_FMT = "%Y-%m-%dT%H:00:00Z"


def _hour_expr(ts):
    return func.strftime(HOUR_FMT, ts).label("hour")


@router.get(
    "/",
    response_model=list[HourlyTrend],
    summary="Hourly rollups of the scan history",
)
def get_trends(
    hours: int = Query(
        24, ge=1, le=720, description="Trailing hours to roll up."
    ),
    db: Session = Depends(get_db),
):
    """Collapse 30-second scan rows into one point per UTC hour.

    Each bucket reports what the scanner recorded during that hour:
    how many scans ran, how many distinct ports were listening at any
    point, how many residents were live at any point, and the mean RAM
    and disk-used totals. Hours with no recorded scans are simply
    absent from the list.
    """
    since = datetime.utcnow() - timedelta(hours=hours)

    svc_rows = (
        db.query(
            _hour_expr(ServiceState.timestamp),
            func.count(distinct(ServiceState.port)).label("services_listening"),
        )
        .filter(ServiceState.timestamp >= since)
        .group_by("hour")
        .all()
    )

    mod_rows = (
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
    )

    mach_rows = (
        db.query(
            _hour_expr(MachineState.timestamp),
            func.count(MachineState.id).label("scans"),
            func.avg(MachineState.ram_gb).label("ram_gb_avg"),
            func.avg(MachineState.disk_used_gb).label("disk_used_gb_avg"),
        )
        .filter(MachineState.timestamp >= since)
        .group_by("hour")
        .all()
    )

    merged: dict[str, dict] = {}

    def bucket(hour: str) -> dict:
        return merged.setdefault(
            hour,
            {
                "hour": hour,
                "scans": 0,
                "services_listening": 0,
                "modules_live": 0,
                "ram_gb_avg": None,
                "disk_used_gb_avg": None,
            },
        )

    for hour, services_listening in svc_rows:
        bucket(hour)["services_listening"] = int(services_listening or 0)
    for hour, modules_live in mod_rows:
        bucket(hour)["modules_live"] = int(modules_live or 0)
    for hour, scans, ram_avg, disk_avg in mach_rows:
        b = bucket(hour)
        b["scans"] = int(scans or 0)
        b["ram_gb_avg"] = round(float(ram_avg), 2) if ram_avg is not None else None
        b["disk_used_gb_avg"] = (
            round(float(disk_avg), 2) if disk_avg is not None else None
        )

    return [merged[h] for h in sorted(merged)]
