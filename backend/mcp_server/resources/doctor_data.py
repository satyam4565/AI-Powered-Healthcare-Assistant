from db.db import AsyncSessionLocal
from db.models import Doctor
from sqlalchemy import select

async def get_doctor_directory() -> str:
    """Read-only resource listing all doctors and their specializations."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Doctor))
        doctors = result.scalars().all()
        lines = ["# Doctor Directory"]
        for d in doctors:
            lines.append(f"- {d.name} ({d.specialization})")
        return "\n".join(lines)
