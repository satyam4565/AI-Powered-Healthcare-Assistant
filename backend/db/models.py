from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Time, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Doctor(Base):
    __tablename__ = 'doctors'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    
    password_hash = Column(String(255), nullable=True) # Nullable so existing test accounts don't break
    bio = Column(Text, nullable=True)
    
    appointments = relationship("Appointment", back_populates="doctor", lazy="selectin")
    availabilities = relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin")

class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    
    appointments = relationship("Appointment", back_populates="patient", lazy="selectin")

class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    time = Column(DateTime, nullable=False)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, CANCELLED, COMPLETED
    symptoms = Column(Text, nullable=True)

    doctor = relationship("Doctor", back_populates="appointments", lazy="selectin")
    patient = relationship("Patient", back_populates="appointments", lazy="selectin")

# ==========================================
# NEW MODEL: DOCTOR SCHEDULING
# ==========================================

class DoctorAvailability(Base):
    __tablename__ = 'doctor_availabilities'
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id', ondelete="CASCADE"), nullable=False)
    
    day_of_week = Column(String(20), nullable=False) # e.g., "Monday", "Tuesday"
    start_time = Column(Time, nullable=True)         # e.g., 09:00:00
    end_time = Column(Time, nullable=True)           # e.g., 17:00:00
    is_working = Column(Boolean, default=True)       # If False, doctor is off this day

    doctor = relationship("Doctor", back_populates="availabilities")

# ==========================================
# CHAT HISTORY PERSISTENCE (Unchanged)
# ==========================================

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    session_id = Column(String(255), primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="selectin", order_by="ChatMessage.id")

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), ForeignKey('chat_sessions.session_id'), nullable=False)
    
    message_data = Column(JSON, nullable=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")