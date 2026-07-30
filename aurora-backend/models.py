from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hash_senha = Column(String)
    casas = relationship("Casa", back_populates="dono")
    casas_membro = relationship("MembroCasa", back_populates="usuario")

class Casa(Base):
    __tablename__ = "casas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    dono = relationship("Usuario", back_populates="casas")
    produtos = relationship("Produto", back_populates="casa")
    listas = relationship("ListaCompras", back_populates="casa")
    ambientes = relationship("Ambiente", back_populates="casa", cascade="all, delete-orphan")
    membros = relationship("MembroCasa", back_populates="casa", cascade="all, delete-orphan")
    convites = relationship("ConviteCasa", back_populates="casa", cascade="all, delete-orphan")

class Ambiente(Base):
    __tablename__ = "ambientes"
    id = Column(Integer, primary_key=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    nome = Column(String, index=True)
    icone = Column(String, default="🏠")
    
    casa = relationship("Casa", back_populates="ambientes")
    produtos = relationship("Produto", back_populates="ambiente")

class Produto(Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    ambiente_id = Column(Integer, ForeignKey("ambientes.id"), nullable=True)
    nome = Column(String, index=True)
    categoria = Column(String, index=True)
    quantidade = Column(Float, default=0)
    quantidade_minima = Column(Float, default=0)
    validade = Column(DateTime, nullable=True)
    
    casa = relationship("Casa", back_populates="produtos")
    ambiente = relationship("Ambiente", back_populates="produtos")
    itens_lista = relationship("ListaCompras", back_populates="produto")

class ListaCompras(Base):
    __tablename__ = "lista_compras"
    id = Column(Integer, primary_key=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    status = Column(String, default="Pendente")
    
    casa = relationship("Casa", back_populates="listas")
    produto = relationship("Produto", back_populates="itens_lista")

class MemoriaIA(Base):
    __tablename__ = "memoria_ia"
    id = Column(Integer, primary_key=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    tipo = Column(String) # Ex: "preferencia", "rotina"
    informacao = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MembroCasa(Base):
    __tablename__ = "membros_casa"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    casa_id = Column(Integer, ForeignKey("casas.id"))
    permissao = Column(String, default="membro")
    
    usuario = relationship("Usuario", back_populates="casas_membro")
    casa = relationship("Casa", back_populates="membros")

class ConviteCasa(Base):
    __tablename__ = "convites_casa"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    usado = Column(Boolean, default=False)
    expiracao = Column(DateTime)
    
    casa = relationship("Casa", back_populates="convites")

class ConexaoExterna(Base):
    __tablename__ = "conexoes_externas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    provedor = Column(String, index=True) # Ex: "google"
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    usuario = relationship("Usuario")

class InscricaoPush(Base):
    __tablename__ = "inscricoes_push"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    endpoint = Column(String, unique=True, index=True)
    p256dh = Column(String)
    auth = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    usuario = relationship("Usuario")

class Remedio(Base):
    __tablename__ = "remedios"
    id = Column(Integer, primary_key=True, index=True)
    casa_id = Column(Integer, ForeignKey("casas.id"))
    nome = Column(String, index=True)
    horarios = Column(String) # Ex: "08:00, 20:00"
    ativo = Column(Boolean, default=True)
    estoque = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    casa = relationship("Casa")
