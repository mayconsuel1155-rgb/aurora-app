import os
import smtplib
from email.message import EmailMessage


def _as_bool(value: str, default: bool = False) -> bool:
    if not value:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM_EMAIL", username).strip()
    sender_name = os.getenv("SMTP_FROM_NAME", "Aurora").strip() or "Aurora"
    use_tls = _as_bool(os.getenv("SMTP_USE_TLS", "true"), default=True)

    if not host or not username or not password or not sender:
        raise RuntimeError("Envio SMTP não configurado")

    message = EmailMessage()
    message["Subject"] = "Redefina sua senha do Aurora"
    message["From"] = f"{sender_name} <{sender}>"
    message["To"] = recipient
    message.set_content(
        "Recebemos uma solicitação para redefinir sua senha do Aurora.\n\n"
        f"Acesse este link em até 15 minutos: {reset_url}\n\n"
        "Se você não solicitou essa alteração, ignore esta mensagem."
    )

    with smtplib.SMTP(host, port, timeout=15) as smtp:
        if use_tls:
            smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)
