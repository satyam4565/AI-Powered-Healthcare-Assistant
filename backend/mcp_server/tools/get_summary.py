from db.db import AsyncSessionLocal
from db.models import Appointment, Patient, Doctor
from sqlalchemy import select
from datetime import datetime, timedelta

async def get_summary_report(user_id: int, role: str) -> str:
    """USE THIS TOOL WHEN A DOCTOR ASKS FOR A SUMMARY OR STATS OF THEIR APPOINTMENTS."""
    
    if role != "doctor":
        return "Error: Only doctors can request summary reports."

    async with AsyncSessionLocal() as session:
        # Get the doctor
        doctor = await session.get(Doctor, int(user_id))
        if not doctor:
            return "Error: Doctor not found."

        # Calculate Dates
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # Fetch all appointments for this doctor
        result = await session.execute(select(Appointment).where(Appointment.doctor_id == doctor.id))
        appointments = result.scalars().all()

        # Tally the stats
        yesterday_count = sum(1 for a in appointments if a.time.date() == yesterday)
        today_count = sum(1 for a in appointments if a.time.date() == today)
        tomorrow_count = sum(1 for a in appointments if a.time.date() == tomorrow)
        
        # Count patients with fever (simple keyword search in symptoms)
        fever_count = sum(1 for a in appointments if a.symptoms and "fever" in a.symptoms.lower())

        # Format the report text
        # Format the report text
        report_text = (
            f"📊 Daily Summary for {doctor.name}\n"
            f"• Yesterday's Patients: {yesterday_count}\n"
            f"• Today's Appointments: {today_count}\n"
            f"• Tomorrow's Appointments: {tomorrow_count}\n"
            f"• Patients reporting fever: {fever_count}"
        )

        return f"CRITICAL INSTRUCTION: You must reply to the user with this EXACT string, including the tags: ||REPORT||{report_text}||REPORT||"