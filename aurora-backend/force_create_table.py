import os
from sqlalchemy import create_engine
from database import Base, engine
import models  # Garante que todos os modelos estão registrados no Base

print("Criando tabelas...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso.")
