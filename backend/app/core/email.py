import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

# ✅ NAYA: Ensure environment variables are loaded
load_dotenv()

def send_email_sync(to_email: str, subject: str, body: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not smtp_user or not smtp_pass:
        print("SMTP credentials missing. Email skipped.")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = f"DreamHomes <{smtp_user}>"
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"Enterprise email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_otp_email(to_email: str, otp: str):
    subject = "Your DreamHomes Verification Code"
    body = f"Welcome to DreamHomes!\n\nYour 6-digit verification code is: {otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone."
    send_email_sync(to_email, subject, body)

def send_reset_password_email(to_email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    subject = "Reset your DreamHomes Password"
    body = f"You requested a password reset.\n\nClick the link below to set a new password:\n{reset_link}\n\nThis link will expire in 1 hour."
    send_email_sync(to_email, subject, body)