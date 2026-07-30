import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://neondb_owner:npg_BOsiG1FM4uVY@ep-rough-snow-ackzdh5u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

try:
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    # Executa uma query pura para checar
    res = db.execute(text("SELECT id, usuario_id, endpoint FROM inscricoes_push")).fetchall()
    print("Inscricoes Push:")
    for r in res:
        print(r)
except Exception as e:
    print(f"Erro: {e}")
