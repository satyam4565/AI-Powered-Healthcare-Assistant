from db.db import AsyncSessionLocal
from db.models import Doctor, Appointment
from sqlalchemy import select
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload

async def get_doctor_schedule(
    user_id: int, 
    role: str, 
    doctor_name: str = "", 
    timeframe: str = "today",
    doctor_id: int = None,  # Accept injected context
    patient_id: int = None  # Accept injected context
) -> str:
    """Get the schedule (appointments) for a specific doctor."""
    async with AsyncSessionLocal() as session:
        role_norm = (role or "").strip().lower()
        if role_norm == "doctor":
            # Use secure user_id
            doctor = await session.get(Doctor, int(user_id))
            if not doctor:
                return "Doctor not found."
            doc_id = doctor.id
        else:
            if not doctor_name:
                return "Doctor name is required."
            # Fuzzy search fix
            clean_name = doctor_name.lower().replace("dr.", "").replace("dr ", "").strip()
            result = await session.execute(select(Doctor).where(Doctor.name.ilike(f"%{clean_name}%")))
            doctor = result.scalars().first()
            if not doctor:
                return f"Doctor matching '{doctor_name}' not found."
            doc_id = doctor.id
        
        now = datetime.now()
        if timeframe == "tomorrow":
            target_date = (now + timedelta(days=1)).date()
        elif timeframe == "yesterday":
            target_date = (now - timedelta(days=1)).date()
        else:
            target_date = now.date()

        a_result = await session.execute(
            select(Appointment)
            .options(joinedload(Appointment.patient))
            .where(Appointment.doctor_id == doc_id)
        )
        appts = a_result.scalars().all()
        day_appts = [a for a in appts if a.time.date() == target_date]
        
        if not day_appts:
            return f"{doctor.name} has no appointments scheduled for {timeframe}."
            
        lines = [f"Schedule for {doctor.name} ({timeframe}):"]
        for a in day_appts:
            patient_name = a.patient.name if a.patient else "Unknown Patient"
            lines.append(f"- {a.time.strftime('%I:%M %p')} with {patient_name} (Status: {a.status}, Symptoms: {a.symptoms})")
            
        return "\n".join(lines)