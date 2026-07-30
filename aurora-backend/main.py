from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import produtos, ai, ambientes, auth, casas, connect, push, remedios
from services import push_service
from starlette.middleware.sessions import SessionMiddleware
import os

# Em modo dev, criamos as tabelas direto. No futuro usaremos Alembic.
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback

app = FastAPI(
    title="Aurora Home API",
    description="API para o MVP da plataforma Aurora",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    return JSONResponse(status_code=500, content={"detail": error_msg})

import os

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secret key para assinar os cookies de sessão do OAuth
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "uma_chave_muito_secreta_para_sessoes_locais"))

# Garante que request.url_for() gere HTTPS em produção (por trás de proxies como Render/Railway)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.include_router(produtos.router)
app.include_router(ai.router)
app.include_router(ambientes.router)
app.include_router(auth.router)
app.include_router(casas.router)
app.include_router(connect.router)
app.include_router(push.router)
app.include_router(remedios.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Aurora Home. Reduzindo carga mental."}

@app.on_event("startup")
async def startup_event():
    push_service.start_push_worker()

@app.on_event("shutdown")
async def shutdown_event():
    push_service.stop_push_worker()
