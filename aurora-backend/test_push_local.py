from database import SessionLocal
import models
from services.push_service import send_push_notification

db = SessionLocal()
subs = db.query(models.InscricaoPush).filter(models.InscricaoPush.usuario_id == 6).all()

for sub in subs:
    print(f"Testando push para a inscrição {sub.id}...")
    res = send_push_notification(sub, "Teste Local", "Corpo do teste", "/saude")
    print(f"Resultado: {res}")
