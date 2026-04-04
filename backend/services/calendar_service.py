import os
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

def get_calendar_service():
    """Authenticates and returns the Google Calendar API service object."""
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "..", "token.json")
    creds_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                raise FileNotFoundError("Missing credentials.json in the backend/ directory!")
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=8080)
        # Save the credentials for the next run
        with open(token_path, "w") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)

async def mock_check_calendar_availability(doctor_id: int, date: str) -> list[str]:
    """
    (Kept for your availability checking logic. To make this real, you would use 
    service.freebusy().query() using the doctor's specific calendar ID.)
    """
    print(f"[Calendar API] Checking availability for doctor {doctor_id} on {date}...")
    return ["09:00 AM", "10:00 AM", "02:00 PM", "04:30 PM"]

async def mock_book_calendar_event(doctor_id: int, patient_id: int, date: str, time: str) -> str:
    """
    Real Google Calendar API - books an event.
    (Note: Kept the function name as 'mock_book_calendar_event' so you don't 
    have to change your book_appointment.py imports right now).
    """
    print(f"🗓️ [Calendar API] Pushing event to Google Calendar for {date} at {time}...")
    
    try:
        service = get_calendar_service()

        # Parse the date and time strings into datetime objects
        # Example format: date="2026-03-31", time="03:00 PM"
        start_datetime_str = f"{date} {time}"
        start_dt = datetime.datetime.strptime(start_datetime_str, "%Y-%m-%d %I:%M %p")
        
        # Assume appointments are 1 hour long
        end_dt = start_dt + datetime.timedelta(hours=1)

        # Create the event payload
        event = {
            'summary': f'Medical Appointment: Patient #{patient_name} with Doctor #{doctor_name}',
            'description': 'Automated booking via Smart Doctor Assistant.',
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Asia/Kolkata', 
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
            'attendees': [
                {'email': patient_email},       
                {'email': doctor_email}        
            ],
        }

        # Insert the event into the primary calendar of the authenticated user
        event_result = service.events().insert(calendarId='primary', body=event).execute()
        
        print(f"✅ Event created! View it here: {event_result.get('htmlLink')}")
        return event_result.get('id')

    except Exception as error:
        # We return the exact error string instead of printing it!
        return f"CALENDAR_ERROR: {str(error)}"