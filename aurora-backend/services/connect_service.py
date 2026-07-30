import requests
from datetime import datetime, timezone

def buscar_eventos_google_local(conexao):
    if not conexao or not conexao.access_token:
        return []
        
    now = datetime.now(timezone.utc).isoformat()
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    params = {
        "timeMin": now,
        "maxResults": 10,
        "singleEvents": "true",
        "orderBy": "startTime"
    }
    headers = {
        "Authorization": f"Bearer {conexao.access_token}",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code != 200:
            return []
            
        data = response.json()
        eventos_limpos = []
        for item in data.get("items", []):
            start = item.get("start", {})
            dt = start.get("dateTime") or start.get("date")
            
            # Puxar a lista de convidados (attendees) com seus emails
            attendees = []
            for attendee in item.get("attendees", []):
                if "email" in attendee:
                    attendees.append(attendee["email"])
            
            eventos_limpos.append({
                "id": item.get("id"),
                "titulo": item.get("summary", "Sem título"),
                "data": dt,
                "link_meet": item.get("hangoutLink", None),
                "origem": "google",
                "attendees": attendees
            })
            
        return eventos_limpos
    except Exception as e:
        print(f"Erro no buscar_eventos_google_local: {e}")
        return []
