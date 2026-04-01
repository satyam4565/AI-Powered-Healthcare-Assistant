import sys
import os
from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

# DB + Models
from db.db import init_db, get_db
from db.models import Doctor, Patient, Appointment
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone

# Auth
from auth import create_access_token, get_current_user

# Agent System (optional; allow API to boot even if MCP client deps aren't available)
# try:
#     from agent.agent_orchestrator import process_chat
# except Exception as e:
#     process_chat = None
#     _agent_import_error = e

from agent.agent_orchestrator import process_chat

from agent.context_manager import context_manager


# -------------------------------
# Lifespan (DB Init)
# -------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"Error initializing DB: {e}")
    yield


# -------------------------------
# App Initialization
# -------------------------------
app = FastAPI(title="Smart Doctor Assistant", lifespan=lifespan)

from auth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

from doctor_routes import router as doctor_router
app.include_router(doctor_router, prefix="/api/doctor", tags=["Doctor Settings"])


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

# CORS (React Frontend Support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Request / Response Models
# -------------------------------
class ChatRequest(BaseModel):
    message: str
    role: str  # 'patient' or 'doctor'
    session_id: str = "default_session"


class ChatResponse(BaseModel):
    reply: str


class LoginRequest(BaseModel):
    email: str
    role: str  # 'doctor' or 'patient'


# -------------------------------
# Routes
# -------------------------------

# 🔹 Chat Endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Main Chat Endpoint - handles dynamic tool calling via Agent Orchestrator."""
    if process_chat is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Chat is unavailable because agent dependencies failed to load: {_agent_import_error}",
        )
    try:
        reply = await process_chat(
            session_id=req.session_id,
            message=req.message,
            user=current_user,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        print("❌ Chat Error:", str(e))
        return ChatResponse(reply="Sorry, something went wrong. Please try again.")


# 🔹 Clear Chat Context
@app.get("/api/clear_chat")
async def clear_chat(session_id: str, current_user: dict = Depends(get_current_user)):
    """Helper to wipe context."""
    await context_manager.clear_session(session_id)
    return {"status": "cleared"}


# 🔹 Get Chat History
@app.get("/api/chat/history")
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch persistent chat history from PostgreSQL."""
    history = await context_manager.get_session_history(session_id)
    
    # We filter out "system" and "tool" messages so the UI only displays User and Assistant chats
    display_history = [
        msg for msg in history 
        if msg.get("role") in ["user", "assistant"] and msg.get("content")
    ]
    return {"history": display_history}


# 🔹 Dashboard Endpoint
@app.get("/api/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    role = current_user["role"]
    user_id = int(current_user["user_id"])
    
    if role == "patient":
        result = await db.execute(
            select(Appointment).options(joinedload(Appointment.doctor)).where(Appointment.patient_id == user_id).order_by(Appointment.time)
        )
        appointments = result.scalars().all()
        data = {
            "appointments": [{
                "id": a.id, 
                "doctor_name": a.doctor.name if a.doctor else "Unknown", 
                "time": a.time.isoformat(), 
                "status": a.status
            } for a in appointments]
        }
    else:
        result = await db.execute(
            select(Appointment).options(joinedload(Appointment.patient)).where(Appointment.doctor_id == user_id).order_by(Appointment.time)
        )
        appointments = result.scalars().all()
        completed = sum(1 for a in appointments if a.status == "COMPLETED")
        total = len(appointments)
        success_rate = f"{round((completed / total) * 100)}%" if total else "0%"
        data = {
            "appointments": [{
                "id": a.id, 
                "patient_name": a.patient.name if a.patient else "Unknown", 
                "time": a.time.isoformat(), 
                "status": a.status
            } for a in appointments],
            "stats": {"today_patients": len(appointments), "success_rate": success_rate}
        }
    return data


# -------------------------------
# Clean Appointment APIs (DB is source of truth)
# -------------------------------
@app.get("/api/appointments/patient")
async def get_patient_appointments(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    print(f"📊 Fetching appointments for: {current_user}")
    patient_id = int(current_user["user_id"])
    result = await db.execute(
        select(Appointment)
        .options(joinedload(Appointment.doctor))
        .where(Appointment.patient_id == patient_id)
        .order_by(Appointment.time.desc())
    )
    appts = result.scalars().all()

    from datetime import timezone
    now = datetime.now(timezone.utc)
    upcoming, history = [], []
    for a in appts:
        appointment_time = _as_utc(a.time)
        item = {
            "id": a.id,
            "time": a.time.isoformat(),
            "status": a.status,
            "symptoms": a.symptoms,
            "doctor_name": a.doctor.name if a.doctor else "Unknown",
            "patient_name": current_user.get("name", "Unknown") if current_user else "Unknown",
            "doctor": {
                "id": a.doctor.id if a.doctor else None,
                "name": a.doctor.name if a.doctor else "Unknown",
                "email": a.doctor.email if a.doctor else None,
                "specialization": getattr(a.doctor, "specialization", None) if a.doctor else None,
            },
        }
        (upcoming if appointment_time >= now else history).append(item)

    return {"upcoming": list(reversed(upcoming)), "history": history}


@app.get("/api/appointments/doctor")
async def get_doctor_appointments(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    print(f"📊 Fetching appointments for: {current_user}")
    doctor_id = int(current_user["user_id"])
    result = await db.execute(
        select(Appointment)
        .options(joinedload(Appointment.patient))
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Appointment.time.asc())
    )
    appts = result.scalars().all()

    from datetime import timezone
    now = datetime.now(timezone.utc)
    today = now.date()

    today_schedule = []
    all_items = []
    completed = 0
    for a in appts:
        if a.status == "COMPLETED":
            completed += 1
        item = {
            "id": a.id,
            "time": a.time.isoformat(),
            "status": a.status,
            "symptoms": a.symptoms,
            "doctor_name": current_user.get("name", "Unknown") if current_user else "Unknown",
            "patient_name": a.patient.name if a.patient else "Unknown",
            "patient": {
                "id": a.patient.id if a.patient else None,
                "name": a.patient.name if a.patient else "Unknown",
                "email": a.patient.email if a.patient else None,
            },
        }
        all_items.append(item)
        if _as_utc(a.time).date() == today:
            today_schedule.append(item)

    total = len(appts)
    success_rate = f"{round((completed / total) * 100)}%" if total else "0%"

    return {
        "today_schedule": today_schedule,
        "appointments": all_items,
        "stats": {
            "today_patients": len(today_schedule),
            "success_rate": success_rate,
        },
    }

# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
