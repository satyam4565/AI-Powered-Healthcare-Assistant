from services.calendar_service import mock_book_calendar_event
from services.email_service import mock_send_email
from db.db import AsyncSessionLocal
from db.models import Doctor, Patient, Appointment
from sqlalchemy import select
from datetime import datetime

async def book_appointment(
    user_id: int,
    role: str,
    doctor_name: str,
    date: str,
    time: str,
    patient_name: str = "",  # Made Optional!
    email: str = "",         # Made Optional!
    symptoms: str = ""
) -> str:
    """USE THIS TOOL ONLY TO FINALIZE A BOOKING. YOU MUST NEVER CALL THIS TOOL UNTIL YOU HAVE ALREADY CHECKED AVAILABILITY AND THE USER HAS PICKED A TIME."""
    async with AsyncSessionLocal() as session:
        role_norm = (role or "").strip().lower()
        date = (date or "").strip()
        time = (time or "").strip()

        if not date or not time:
            return "Error: date and time are required for booking"

        # 1. Resolve Doctor (With Fuzzy Search)
        if role_norm == "doctor":
            doctor = await session.get(Doctor, int(user_id))
            if not doctor:
                return "Booking failed: Doctor not found."
        else:
            if not doctor_name:
                return "Booking failed: doctor_name is required."
                
            # Fuzzy search fix
            clean_name = doctor_name.lower().replace("dr.", "").replace("dr ", "").strip()
            doc_result = await session.execute(select(Doctor).where(Doctor.name.ilike(f"%{clean_name}%")))
            doctor = doc_result.scalars().first()
            if not doctor:
                return f"Booking failed: Doctor '{doctor_name}' not found."
            
        # 2. Resolve Patient (SECURE CONTEXT ENFORCEMENT)
        if role_norm == "patient":
            patient = await session.get(Patient, int(user_id))
            if not patient:
                return "Booking failed: Authenticated patient not found."
            
            # Security Fix: We completely ignore the LLM's `patient_name` and `email`.
            # We force the booking to use the authenticated user's actual DB details.
            actual_email = patient.email
            actual_name = patient.name
        else:
            # If a doctor is booking for someone else, we use the provided details
            actual_email = (email or "").strip().lower()
            actual_name = (patient_name or "").strip()
            
            if not actual_email or not actual_name:
                return "Booking failed: Patient email and name are required."
                
            pat_result = await session.execute(select(Patient).where(Patient.email == actual_email))
            patient = pat_result.scalars().first()
            if not patient:
                patient = Patient(name=actual_name, email=actual_email)
                session.add(patient)
                await session.flush()
            
        # 3. Parse datetime
        try:
            # Handle standardizing times like "9:00 AM" vs "09:00 AM"
            dt_str = f"{date} {time}"
            dt_obj = datetime.strptime(dt_str, "%Y-%m-%d %I:%M %p")
        except Exception:
            return f"Booking failed: invalid date/time format ({date} {time}). Must be YYYY-MM-DD HH:MM AM/PM."

        # 4. Prevent double-booking with SMART RESCHEDULING
        existing = await session.execute(
            select(Appointment).where(Appointment.doctor_id == doctor.id, Appointment.time == dt_obj)
        )
        if existing.scalars().first():
            # --- START DYNAMIC SMART RESCHEDULING ---
            day_of_week = dt_obj.strftime("%A")
            
            # Fetch the doctor's actual hours for this day
            from db.models import DoctorAvailability
            avail_result = await session.execute(
                select(DoctorAvailability).where(
                    DoctorAvailability.doctor_id == doctor.id,
                    DoctorAvailability.day_of_week == day_of_week
                )
            )
            availability = avail_result.scalars().first()
            
            if not availability or not availability.is_working:
                 return f"Booking failed: {doctor.name} does not work on {day_of_week}s."

            # Generate all possible slots based on their shift
            from datetime import timedelta
            start_dt = datetime.combine(dt_obj.date(), availability.start_time)
            end_dt = datetime.combine(dt_obj.date(), availability.end_time)
            
            all_slots = []
            current_dt = start_dt
            while current_dt < end_dt:
                all_slots.append(current_dt.strftime("%I:%M %p"))
                current_dt += timedelta(hours=1)
            
            # Find what is already booked today
            day_start = dt_obj.replace(hour=0, minute=0, second=0)
            day_end = dt_obj.replace(hour=23, minute=59, second=59)
            day_appts = await session.execute(
                select(Appointment).where(
                    Appointment.doctor_id == doctor.id,
                    Appointment.time >= day_start,
                    Appointment.time <= day_end
                )
            )
            booked_times = [a.time.strftime("%I:%M %p") for a in day_appts.scalars().all()]
            
            # Filter and suggest
            available_slots = [slot for slot in all_slots if slot not in booked_times]
            
            if available_slots:
                suggestions = ", ".join(available_slots[:3])
                return f"Booking failed: {doctor.name} is already booked at {time}. However, their next open slots today are: {suggestions}. Ask the user if they want one of these."
            else:
                return f"Booking failed: {doctor.name} is completely booked for the rest of {date}. Ask the user to choose a different day."
            # --- END DYNAMIC SMART RESCHEDULING ---

        # 5. Create Appointment in DB
        appt = Appointment(doctor_id=doctor.id, patient_id=patient.id, time=dt_obj, status="SCHEDULED", symptoms=symptoms)
        session.add(appt)
        await session.commit()
        
        # 6. External Services
        cal_status = await mock_book_calendar_event(doctor.id, patient.id, date, time)
        
        await mock_send_email(
            to_email=actual_email,
            subject="Appointment Confirmation",
            body=f"Dear {actual_name}, your appointment with {doctor.name} is scheduled on {date} at {time}."
        )
        
        # Attach the Google Calendar status to the final output so the LLM shows it to us!
        return f"Successfully booked appointment with {doctor.name} on {date} at {time}. Calendar Sync Status: {cal_status}"