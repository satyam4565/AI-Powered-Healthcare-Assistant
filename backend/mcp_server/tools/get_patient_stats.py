from db.db import AsyncSessionLocal
from db.models import Appointment
from services.notification_service import mock_send_slack_message
from sqlalchemy import select
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload

async def get_patient_stats(
    user_id: int, 
    role: str, 
    report_type: str = "today",
    doctor_id: int = None,  # Accept injected context
    patient_id: int = None  # Accept injected context
) -> str:
    """Get stats scoped to the authenticated user."""
    async with AsyncSessionLocal() as session:
        role_norm = (role or "").strip().lower()
        base = select(Appointment).options(joinedload(Appointment.doctor), joinedload(Appointment.patient))
        
        if role_norm == "patient":
            base = base.where(Appointment.patient_id == int(user_id))
        elif role_norm == "doctor":
            base = base.where(Appointment.doctor_id == int(user_id))

        result = await session.execute(base)
        appointments = result.scalars().all()
        
        count = 0
        now = datetime.now()
        
        if report_type == "yesterday":
            target_date = (now - timedelta(days=1)).date()
            for a in appointments:
                if a.time.date() == target_date:
                    count += 1
            summary = f"There were {count} visits yesterday."
        elif report_type == "fever":
            for a in appointments:
                if a.symptoms and "fever" in a.symptoms.lower():
                    count += 1
            summary = f"A total of {count} patients have reported fever symptoms."
        elif report_type == "today":
            target_date = now.date()
            for a in appointments:
                if a.time.date() == target_date:
                    count += 1
            summary = f"There are {count} visits scheduled for today."
        else:
            summary = f"Total of {len(appointments)} appointments in scope."

        # Keep side-effect but do not fabricate data.
        await mock_send_slack_message("#doctors-alerts", f"Report Generated: {summary}")
        return summary