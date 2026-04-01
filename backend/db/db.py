import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from db.models import Base, Doctor, Patient, Appointment
from datetime import datetime, timedelta
from sqlalchemy import delete

# Default to Postgres but allow sqlite for seamless testing if needed
# The Docker setup provides postgres: postgresql+asyncpg://mcp_user:mcp_password@localhost:5432/mcp_db
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mcp_user:mcp_password@localhost:5432/mcp_db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    await clear_appointments()
    await seed_users_if_missing()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def clear_appointments():
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Appointment))
        await session.commit()


async def seed_users_if_missing():
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        # Ensure the "known" mock users exist, even if the DB already has some rows.
        mock_doctors = [
            {"name": "Dr. Sarah Ahuja", "specialization": "General Physician", "email": "sahuja@example.com"},
            {"name": "Dr. Michael Chen", "specialization": "Cardiologist", "email": "mchen@example.com"},
        ]
        mock_patients = [
            {"name": "Alice Smith", "email": "alice@example.com"},
            {"name": "Bob Jones", "email": "bob@example.com"},
        ]

        doctor_by_email = {}
        for d in mock_doctors:
            result = await session.execute(select(Doctor).where(Doctor.email == d["email"]).limit(1))
            doctor = result.scalars().first()
            if not doctor:
                doctor = Doctor(**d)
                session.add(doctor)
            doctor_by_email[d["email"]] = doctor

        patient_by_email = {}
        for p in mock_patients:
            result = await session.execute(select(Patient).where(Patient.email == p["email"]).limit(1))
            patient = result.scalars().first()
            if not patient:
                patient = Patient(**p)
                session.add(patient)
            patient_by_email[p["email"]] = patient

        await session.commit()
        print("Database seed check completed.")
