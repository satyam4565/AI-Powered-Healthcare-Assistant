from db.db import AsyncSessionLocal
from db.models import Doctor, Appointment, DoctorAvailability
from sqlalchemy import select
from datetime import datetime, timedelta

async def check_availability(
    user_id: int,
    role: str,
    doctor_name: str,
    date: str
) -> str:
    """ALWAYS CALL THIS TOOL FIRST WHEN A USER ASKS FOR TIMINGS, SCHEDULES, OR AVAILABILITY. It returns the exact open slots for a doctor on a specific day."""
    async with AsyncSessionLocal() as session:
        # Basic Validation
        if not doctor_name: return "Error: doctor_name is required"
        if not date: return "Error: date is required"

        role_norm = (role or "").strip().lower()
        
        # 1. Resolve Doctor (With Fuzzy Search)
        if role_norm == "doctor":
            doctor = await session.get(Doctor, int(user_id))
            if not doctor:
                return "Doctor not found."
        else:
            clean_name = doctor_name.lower().replace("dr.", "").replace("dr ", "").strip()
            result = await session.execute(select(Doctor).where(Doctor.name.ilike(f"%{clean_name}%")))
            doctor = result.scalars().first()
            if not doctor:
                return f"Doctor matching '{doctor_name}' not found in our directory."
            
        # 2. Parse Date & Get Day of Week
        try:
            day_obj = datetime.strptime(date, "%Y-%m-%d").date()
            day_of_week = day_obj.strftime("%A") # e.g., "Monday"
        except Exception:
            return "Invalid date format. Use YYYY-MM-DD."

        # 3. Check Doctor's Custom Availability for this Day
        avail_result = await session.execute(
            select(DoctorAvailability).where(
                DoctorAvailability.doctor_id == doctor.id,
                DoctorAvailability.day_of_week == day_of_week
            )
        )
        availability = avail_result.scalars().first()

        if not availability or not availability.is_working or not availability.start_time or not availability.end_time:
            return f"{doctor.name} does not work on {day_of_week}s. Please ask the user to pick another day."

        # 4. Generate the possible 1-hour slots for their shift
        start_dt = datetime.combine(day_obj, availability.start_time)
        end_dt = datetime.combine(day_obj, availability.end_time)
        
        all_slots = []
        current_dt = start_dt
        while current_dt < end_dt:
            all_slots.append(current_dt.strftime("%I:%M %p"))
            current_dt += timedelta(hours=1)

        # 5. Get Existing Appointments to find out what is taken
        a_result = await session.execute(
            select(Appointment).where(Appointment.doctor_id == doctor.id)
        )
        appts = [a for a in a_result.scalars().all() if a.time.date() == day_obj]
        booked_times = [a.time.strftime("%I:%M %p") for a in appts]

        # 6. Filter out booked slots
        open_slots = [slot for slot in all_slots if slot not in booked_times]

        if not open_slots:
            return f"{doctor.name} is completely booked on {date}. They have no open slots."

        # Hand the exact open slots to the LLM!
        return f"{doctor.name} is available on {date}. Their open slots are: {', '.join(open_slots)}."