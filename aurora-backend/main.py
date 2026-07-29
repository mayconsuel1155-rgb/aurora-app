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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
