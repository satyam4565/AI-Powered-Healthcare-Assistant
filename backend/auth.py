import os
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from passlib.context import CryptContext

from db.db import AsyncSessionLocal
from db.models import Doctor, Patient
from sqlalchemy import select

# --- Existing Security Config ---
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # Adding a fallback just in case testing locally without a .env
    SECRET_KEY = "fallback-secret-key-change-in-prod" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

# --- Your Existing Utility Functions ---
def create_access_token(data: dict):
    """Generates a JWT token containing user ID and role."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """FastAPI Dependency to extract user context from the Bearer token."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded JWT payload: {payload}")
        user_id_raw = payload.get("user_id")
        user_id: int = int(user_id_raw) if user_id_raw is not None else None
        role: str = payload.get("role")
        
        if user_id is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
            
        return {"user_id": user_id, "role": role}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")


# --- New Pydantic Request Models ---
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str # Must be 'doctor' or 'patient'
    specialization: str = "General" # Only needed if role is doctor

class LoginRequest(BaseModel):
    email: str
    password: str

# --- New Auth Routes ---
@router.post("/signup")
async def signup(user_data: SignupRequest):
    async with AsyncSessionLocal() as session:
        email = user_data.email.lower().strip()
        role = user_data.role.lower().strip()

        # 1. Check if email is already in use
        if role == "doctor":
            existing = await session.execute(select(Doctor).where(Doctor.email == email))
        else:
            existing = await session.execute(select(Patient).where(Patient.email == email))

        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # 2. Hash the password securely
        hashed_pw = pwd_context.hash(user_data.password)

        # 3. Create the user
        if role == "doctor":
            new_user = Doctor(
                name=user_data.name,
                email=email,
                password_hash=hashed_pw,
                specialization=user_data.specialization
            )
        elif role == "patient":
            new_user = Patient(
                name=user_data.name,
                email=email,
                password_hash=hashed_pw
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid role. Use 'doctor' or 'patient'.")

        session.add(new_user)
        await session.commit()
        
        return {"message": f"{role.capitalize()} account created successfully!"}

@router.post("/login")
async def login(credentials: LoginRequest):
    async with AsyncSessionLocal() as session:
        email = credentials.email.lower().strip()

        # 1. Search for the user in both tables
        doc_result = await session.execute(select(Doctor).where(Doctor.email == email))
        doctor = doc_result.scalars().first()

        pat_result = await session.execute(select(Patient).where(Patient.email == email))
        patient = pat_result.scalars().first()

        user = doctor or patient
        role = "doctor" if doctor else "patient"

        # 2. Verify user exists and password is correct
        if not user or not user.password_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not pwd_context.verify(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # 3. Generate the JWT token using your existing function!
        token = create_access_token({"user_id": user.id, "role": role})

        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": role
            }
        }