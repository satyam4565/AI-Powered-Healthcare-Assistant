import asyncio
from db.db import AsyncSessionLocal
from db.models import Patient
from sqlalchemy import select

async def show_me_the_data():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Patient))
        users = result.scalars().all()
        
        print("\n--- ALL REGISTERED USERS ---")
        for u in users:
            # Change u.role or u.name to match your actual model fields
            print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Bio: {u.bio} | Pass: {u.password_hash}")
        print("----------------------------\n")

if __name__ == "__main__":
    asyncio.run(show_me_the_data())