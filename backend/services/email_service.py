import smtplib
import asyncio
from email.message import EmailMessage

# 🛑 Replace these with your actual details!
# Make sure to remove the spaces from the 16-letter App Password.
GMAIL_ADDRESS = "satyam40506@gmail.com"
GMAIL_APP_PASSWORD = "mdqgiwkfhfrpdqjl"

async def mock_send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Sends a REAL email using Gmail SMTP.
    (Kept the name 'mock_send_email' to prevent import errors in book_appointment.py)
    """
    print(f"📧 [Email Service] Preparing to send email to {to_email}...")

    if GMAIL_APP_PASSWORD == "your_16_letter_app_password_here":
        print("⚠️ Email credentials not set. Skipping real email send.")
        return False

    try:
        # 1. Construct the email
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = f"Smart Doctor Assistant <{GMAIL_ADDRESS}>"
        msg['To'] = to_email

        # 2. Define the synchronous blocking send function
        def _send():
            # Connect securely to Google's SMTP server
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
                smtp.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
                smtp.send_message(msg)

        # 3. Run it in an async thread so it doesn't freeze your FastAPI server!
        await asyncio.to_thread(_send)
        
        print(f"✅ Email successfully sent to {to_email}!")
        return True

    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False