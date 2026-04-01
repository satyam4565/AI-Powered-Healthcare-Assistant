from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import time

from auth import get_current_user
from db.db import AsyncSessionLocal
from db.models import DoctorAvailability
from sqlalchemy import select, delete

router = APIRouter()

# --- Pydantic Models ---
class DailyAvailability(BaseModel):
    day_of_week: str  # e.g., "Monday"
    start_time: Optional[time] = None  # e.g., "09:00:00"
    end_time: Optional[time] = None    # e.g., "17:00:00"
    is_working: bool = True

class AvailabilityUpdateRequest(BaseModel):
    schedule: List[DailyAvailability]

# --- Routes ---
@router.post("/availability")
async def update_availability(request: AvailabilityUpdateRequest, user: dict = Depends(get_current_user)):
    """Allows a logged-in doctor to set their weekly schedule."""
    
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update availability.")

    doctor_id = user["user_id"]

    async with AsyncSessionLocal() as session:
        # 1. Delete the doctor's old schedule to make room for the new one
        await session.execute(
            delete(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor_id)
        )
        
        # 2. Insert the new schedule
        new_availabilities = []
        for day in request.schedule:
            new_availabilities.append(
                DoctorAvailability(
                    doctor_id=doctor_id,
                    day_of_week=day.day_of_week,
                    start_time=day.start_time,
                    end_time=day.end_time,
                    is_working=day.is_working
                )
            )
            
        session.add_all(new_availabilities)
        await session.commit()
        
    return {"message": "Schedule updated successfully!"}

@router.get("/availability")
async def get_my_availability(user: dict = Depends(get_current_user)):
    """Fetches the logged-in doctor's current schedule."""
    
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view this.")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(DoctorAvailability).where(DoctorAvailability.doctor_id == user["user_id"])
        )
        schedule = result.scalars().all()
        
    return {"schedule": schedule}