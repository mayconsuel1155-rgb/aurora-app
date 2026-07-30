import asyncio
import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException
import models
from database import SessionLocal
from services import connect_service

# Variáveis globais para controlar o worker
_worker_task = None

def get_vapid_claims():
    email = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:aurora@maycon.dev")
    return {"sub": email}

def send_push_notification(inscricao: models.InscricaoPush, title: str, body: str, url: str = "/"):
    try:
        private_key = os.getenv("VAPID_PRIVATE_KEY", "4tUuFHe_boL0wGw_-Ouvpx_ZAdJO2JpZ34S1qqizRCg")
        if not private_key:
            print("AVISO: VAPID_PRIVATE_KEY não encontrada.")
            return False
            
        subscription_info = {
            "endpoint": inscricao.endpoint,
            "keys": {
                "p256dh": inscricao.p256dh,
                "auth": inscricao.auth
            }
        }
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url
        })
        
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=private_key,
            vapid_claims=get_vapid_claims()
        )
        return True
    except WebPushException as ex:
        print(f"WebPushException ao enviar para {inscricao.endpoint}: {ex}")
        # Se for 410 Gone, a inscrição não existe mais
        if ex.response and ex.response.status_code == 410:
            return "EXPIRED"
        return False
    except Exception as e:
        print(f"Erro geral no webpush: {e}")
        return False

async def push_worker_loop():
    print("🚀 Aurora Push Worker iniciado...")
    while True:
        try:
            # Roda a cada minuto
            await asyncio.sleep(60)
            
            db = SessionLocal()
            try:
                # Pegar todos os usuários que têm inscrições push ativas
                inscricoes = db.query(models.InscricaoPush).all()
                if not inscricoes:
                    continue
                
                usuarios_ids = list(set([i.usuario_id for i in inscricoes]))
                
                # Para cada usuário, checamos eventos próximos
                agora = datetime.utcnow()
                
                # A lógica de Vencimento de Produtos (1x ao dia)
                # Como simplificação para o MVP, vamos apenas focar nos eventos de agenda.
                # (Vencimentos podem ser feitos como 'Resumo Matinal' depois).
                
                for uid in usuarios_ids:
                    user_inscricoes = [i for i in inscricoes if i.usuario_id == uid]
                    if not user_inscricoes:
                        continue
                        
                    # Checar eventos do Google Calendar
                    # (Para isso, precisamos pegar os tokens)
                    conexao_google = db.query(models.ConexaoExterna).filter(
                        models.ConexaoExterna.usuario_id == uid,
                        models.ConexaoExterna.provedor == "google"
                    ).first()
                    
                    if not conexao_google:
                        continue
                        
                    try:
                        eventos = connect_service.buscar_eventos_google_local(conexao_google)
                        for evento in eventos:
                            # Ignorar eventos de dia inteiro sem horario
                            if 'T' not in evento.get("data", ""):
                                continue
                                
                            try:
                                data_ev = datetime.fromisoformat(evento["data"].replace("Z", "+00:00")).replace(tzinfo=None)
                                # Considerar fuso se a string tiver timezone. O fromisoformat cuida disso mas 
                                # precisamos garantir UTC. Vamos assumir que vem UTC ou vamos tratar simplificado.
                            except Exception:
                                continue
                            
                            diff = data_ev - agora
                            # Se faltar entre 29.5 e 30.5 minutos (para pegar no disparo de minuto)
                            diff_minutos = diff.total_seconds() / 60.0
                            if 29 < diff_minutos <= 30.5:
                                # Hora de notificar!
                                hora_str = data_ev.strftime("%H:%M")
                                titulo = "⏰ Compromisso em breve"
                                corpo = f"{evento['titulo']} começa às {hora_str}."
                                
                                for insc in user_inscricoes:
                                    res = send_push_notification(insc, titulo, corpo)
                                    if res == "EXPIRED":
                                        db.delete(insc)
                                db.commit()
                                
                    except Exception as ev_e:
                        print(f"Erro ao buscar eventos do Google para user {uid}: {ev_e}")

            finally:
                db.close()
                
        except asyncio.CancelledError:
            print("🛑 Aurora Push Worker cancelado.")
            break
        except Exception as e:
            print(f"⚠️ Erro no Push Worker: {e}")

def start_push_worker():
    global _worker_task
    loop = asyncio.get_event_loop()
    _worker_task = loop.create_task(push_worker_loop())

def stop_push_worker():
    global _worker_task
    if _worker_task:
        _worker_task.cancel()
