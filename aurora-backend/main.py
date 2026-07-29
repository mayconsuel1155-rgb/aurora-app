from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import produtos, ai, ambientes, auth, casas

# Em modo dev, criamos as tabelas direto. No futuro usaremos Alembic.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Aurora Home API",
    description="API para o MVP da plataforma Aurora",
    version="1.0.0"
)

import os

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

# Em produção gratuita, podemos até aceitar todos '*' se não houver um FRONTEND_URL fixo,
# mas para segurança vamos permitir os configurados, ou aceitar origens específicas da Vercel.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ALLOW_ALL_CORS") else origins,
    allow_credentials=True if not os.getenv("ALLOW_ALL_CORS") else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(produtos.router)
app.include_router(ai.router)
app.include_router(ambientes.router)
app.include_router(auth.router)
app.include_router(casas.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Aurora Home. Reduzindo carga mental."}
