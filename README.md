# MediBridge

An intelligent, full-stack scheduling and reporting assistant. This application demonstrates advanced agentic behavior, allowing an LLM to dynamically discover and invoke tools to manage doctor availability, book appointments, sync with external calendars, and generate real-time analytical reports.

---

## 🚀 Key Features

- **Agentic Workflow Orchestration:** The LLM autonomously determines when to check the database, when to book an appointment, and when to generate reports based on natural language prompts.
- **Smart Rescheduling:** Built-in clash detection. If a requested time slot is booked, the AI dynamically calculates the doctor's working hours and suggests the next available slots.
- **Role-Based Access Control (RBAC):** Secure JWT authentication isolating the **Patient** booking experience from the **Doctor** analytical dashboard.
- **External API Integrations:** - **Google Calendar:** Automatically pushes confirmed appointments to the doctor's calendar.
  - **Gmail SMTP:** Dispatches asynchronous booking confirmation emails to patients.
- **Live Doctor Dashboard:** A React-powered dashboard featuring live patient statistics and an interactive toggle system for doctors to set their weekly working hours.
- **In-App Notifications:** Real-time, LLM-triggered toast notifications for summarizing daily patient reports.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS & Framer Motion (Styling & Animations)
- Lucide React (Icons)
- React Hot Toast (In-App Notifications)

**Backend:**
- FastAPI (Python)
- PostgreSQL (Database)
- SQLAlchemy (Async ORM)
- PyJWT (Authentication)

**External Services:**
- Google Calendar API v3
- Gmail SMTP

---

## ⚙️ Prerequisites

Before running the application, ensure you have the following installed:
- **Docker & Docker Compose** (Recommended) or PostgreSQL installed locally.
- **Node.js** (v18+)
- **Python** (3.10+)
- **Google Cloud Console Account:** For generating `credentials.json` (Calendar API).
- **Gmail Account:** For generating a 16-character App Password.

---

## 📦 Setup & Installation

### 1. Environment Variables
Create a `.env` file in the root directory and configure the following:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/doctor_db

# JWT Security
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256

# External APIs
GMAIL_ADDRESS=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

### 2. Google Calendar Credentials
Download your OAuth 2.0 Client IDs from the Google Cloud Console and save the file as `credentials.json` inside the `backend/` directory.

### 3. Running with Docker (Database)
If using Docker for PostgreSQL, start the database container:
```bash
docker-compose up -d
```

### 4. Start the Backend (FastAPI + MCP)
Navigate to the backend directory, install dependencies, and start the server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*(Note: On the first run, Google OAuth will open a browser window to authenticate the Calendar API. A `token.json` file will be generated automatically).*

### 5. Start the Frontend (React)
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

---

## 💬 Sample Prompts (Testing the Agent)

### Scenario 1: Patient Booking (Multi-Turn)
Log in as a **Patient** and use the Smart Assistant:
1. *"I want to check Dr. Ahuja's availability for tomorrow."*
2. *"Please book the 3:00 PM slot."*
   - **Expected Result:** The AI books the appointment in PostgreSQL, creates a Google Calendar event, and sends a Gmail confirmation.

### Scenario 2: Smart Rescheduling
Attempt to double-book a slot:
1. *"Book an appointment with Dr. Ahuja tomorrow at 3:00 PM."*
   - **Expected Result:** The AI detects the conflict, reads the doctor's custom working hours, and replies: *"Dr. Ahuja is booked at 3:00 PM, but how about 4:00 PM or 5:00 PM?"*

### Scenario 3: Doctor Summary Report
Log in as a **Doctor** and use the Smart Assistant:
1. *"Give me a summary report of my patients."*
   - **Expected Result:** The AI queries the database for yesterday, today, and tomorrow's stats, and triggers an **In-App Toast Notification** on the frontend dashboard.

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── mcp/
│   │   ├── server.py           # FastMCP server configuration
│   │   └── tools/              # MCP Tools (book_appointment, get_summary, etc.)
│   ├── services/
│   │   ├── calendar_service.py # Google Calendar API logic
│   │   └── email_service.py    # Gmail SMTP logic
│   ├── db/
│   │   ├── models.py           # SQLAlchemy database schemas
│   │   └── db.py               # Database connection & session management
│   └── credentials.json        # Google OAuth Secrets
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components (Chat, Dashboard, Auth)
│   │   ├── context/            # Global state (AuthContext, AppContext)
│   │   └── services/           # Axios API interceptors & endpoints
│   ├── package.json
│   └── vite.config.js
│
└── docker-compose.yml          # PostgreSQL Container Config
```

---

## 🏆 Bonus Objectives Achieved
- **Role-Based Login:** Complete separation of Patient and Doctor capabilities using JWT.
- **LLM-Powered Auto-Rescheduling:** Dynamic clash detection and alternative slot suggestion.
- **Conversation Continuity:** Seamless multi-turn prompt tracking using secure session IDs.
