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
                
                for uid in usuarios_ids:
                    user_inscricoes = [i for i in inscricoes if i.usuario_id == uid]
                    if not user_inscricoes:
                        continue
                        
                    # 1. Resumo de Estoque (às 07:00 e às 17:00 no horário de Brasília)
                    # Hora atual de Brasília = agora - 3 horas
                    agora_br = agora - timedelta(hours=3)
                    if (agora_br.hour == 7 or agora_br.hour == 17) and agora_br.minute == 0:
                        produtos = db.query(models.Produto).filter(
                            models.Produto.casa_id == db.query(models.Usuario).filter_by(id=uid).first().casa_id
                        ).all()
                        
                        vencendo_em_breve = 0
                        vencidos = 0
                        
                        for p in produtos:
                            if p.validade and p.quantidade > 0:
                                diff_dias = (p.validade.date() - agora_br.date()).days
                                if diff_dias < 0:
                                    vencidos += 1
                                elif diff_dias <= 3:
                                    vencendo_em_breve += 1
                        
                        if vencendo_em_breve > 0 or vencidos > 0:
                            periodo = "Matinal" if agora_br.hour == 7 else "Vespertino"
                            titulo = f"🛒 Resumo {periodo} do Estoque"
                            corpo = ""
                            if vencidos > 0:
                                corpo += f"{vencidos} produto(s) já venceram! "
                            if vencendo_em_breve > 0:
                                corpo += f"{vencendo_em_breve} produto(s) vencem em breve."
                            
                            for insc in user_inscricoes:
                                send_push_notification(insc, titulo, corpo)

                    # 1.5. Lembretes de Remédios (Hora exata)
                    usuario_dono = db.query(models.Usuario).filter_by(id=uid).first()
                    membro_casa = db.query(models.MembroCasa).filter_by(usuario_id=uid).first()
                    casa_id_dono = membro_casa.casa_id if membro_casa else None
                    
                    if casa_id_dono:
                        remedios = db.query(models.Remedio).filter(
                            models.Remedio.casa_id == casa_id_dono,
                            models.Remedio.ativo == True
                        ).all()
                    else:
                        remedios = []
                    
                    hora_agora_str = f"{agora_br.hour:02d}:{agora_br.minute:02d}"
                    
                    for remedio in remedios:
                        horarios_list = [h.strip() for h in remedio.horarios.split(",")]
                        if hora_agora_str in horarios_list:
                            titulo_rem = "💊 Hora do Remédio"
                            corpo_rem = f"Está na hora de tomar: {remedio.nome}"
                            
                            # Notifica a família inteira (todos da casa)
                            if casa_id_dono:
                                membros = db.query(models.MembroCasa).filter_by(casa_id=casa_id_dono).all()
                                familiares_ids = [m.usuario_id for m in membros]
                                
                                alvos_remedio = []
                                for fam_id in familiares_ids:
                                    inscs_fam = [i for i in inscricoes if i.usuario_id == fam_id]
                                    alvos_remedio.extend(inscs_fam)
                                
                                inscricoes_unicas_rem = {i.id: i for i in alvos_remedio}.values()
                                for insc in inscricoes_unicas_rem:
                                    res = send_push_notification(insc, titulo_rem, corpo_rem, url="/saude")
                                    if res == "EXPIRED":
                                        db.delete(insc)
                            db.commit()

                    # 2. Checar eventos do Google Calendar
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
                                
                                # Quem deve ser notificado?
                                # 1. O dono do evento
                                alvos_inscricoes = list(user_inscricoes)
                                
                                # 2. Os convidados (attendees) que sejam da mesma família (casa_id)
                                attendees = evento.get("attendees", [])
                                if attendees:
                                    # Pega o usuario dono para saber qual a casa_id
                                    dono = db.query(models.Usuario).filter_by(id=uid).first()
                                    if dono:
                                        # Busca se algum email de attendee é usuário da mesma casa
                                        familiares = db.query(models.Usuario).filter(
                                            models.Usuario.casa_id == dono.casa_id,
                                            models.Usuario.email.in_(attendees),
                                            models.Usuario.id != uid  # Já pegamos o dono
                                        ).all()
                                        
                                        for fam in familiares:
                                            # Pegar as inscricoes desse familiar
                                            inscs_fam = [i for i in inscricoes if i.usuario_id == fam.id]
                                            alvos_inscricoes.extend(inscs_fam)
                                            print(f"Adicionando familiar {fam.nome} ao lembrete do evento '{evento['titulo']}'")
                                
                                # Evitar duplicatas caso a mesma inscricao por algum motivo caia duas vezes
                                inscricoes_unicas = {i.id: i for i in alvos_inscricoes}.values()
                                
                                for insc in inscricoes_unicas:
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
