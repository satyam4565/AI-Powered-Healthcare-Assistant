import asyncio
from db.db import AsyncSessionLocal
from db.models import Patient
from db.models import Doctor
from sqlalchemy import select

# async def show_me_the_data():
#     async with AsyncSessionLocal() as session:
#         result = await session.execute(select(Patient))
#         users = result.scalars().all()
        
#         print("\n--- ALL REGISTERED USERS ---")
#         for u in users:
#             print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Appointments: {u.appointments}")
#         print("----------------------------\n")

async def show_me_the_data(): 
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Doctor))
        users = result.scalars().all()
        
        print("\n--- ALL REGISTERED USERS ---")
        for u in users:
            print(f"ID: {u.id} | Name: {u.name} | Specialisation: {u.specialization} | Email: {u.email} | Bio: {u.bio} | Appointments: {u.appointments} | Availabilities: {u.availabilities}")
        print("----------------------------\n")

if __name__ == "__main__":
    asyncio.run(show_me_the_data())