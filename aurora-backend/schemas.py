from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class AmbienteBase(BaseModel):
    nome: str
    icone: str = "🏠"

class AmbienteCreate(AmbienteBase):
    pass

class AmbienteResponse(AmbienteBase):
    id: int
    casa_id: int
    class Config:
        from_attributes = True

class ProdutoBase(BaseModel):
    nome: str
    categoria: str
    quantidade: float = 0.0
    quantidade_minima: float = 0.0
    unidade: str = "un"
    preco: Optional[float] = 0.0
    ambiente_id: Optional[int] = None
    validade: Optional[datetime] = None

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    quantidade: Optional[float] = None
    quantidade_minima: Optional[float] = None
    unidade: Optional[str] = None
    preco: Optional[float] = None
    ambiente_id: Optional[int] = None
    validade: Optional[datetime] = None

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoResponse(ProdutoBase):
    id: int
    casa_id: int
    ambiente: Optional[AmbienteResponse] = None
    class Config:
        from_attributes = True

class CasaBase(BaseModel):
    nome: str

class CasaCreate(CasaBase):
    pass

class CasaResponse(CasaBase):
    id: int
    usuario_id: int
    produtos: List[ProdutoResponse] = []
    ambientes: List[AmbienteResponse] = []
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    mensagem: str
    historico: Optional[List[ChatMessage]] = []

class TokenData(BaseModel):
    username: Optional[str] = None

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    codigo_convite: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UsuarioResponse] = None

class LoginRequest(BaseModel):
    email: str
    senha: str

PASSWORD_RESET_GENERIC_MESSAGE = (
    "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."
)

class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Informe um e-mail válido")
        return normalized

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=256)
    nova_senha: str = Field(min_length=8, max_length=72)

    @field_validator("nova_senha")
    @classmethod
    def validate_bcrypt_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("A senha deve ter no máximo 72 bytes")
        return value

class PasswordResetMessage(BaseModel):
    message: str

class MembroResponse(BaseModel):
    id: int
    nome: str
    email: str
    permissao: str

class ConviteResponse(BaseModel):
    codigo: str
    expiracao: datetime

class EntrarCasaRequest(BaseModel):
    codigo: str

class GoogleEventCreate(BaseModel):
    titulo: str
    data: str
    is_all_day: bool = False

class GoogleEventUpdate(BaseModel):
    titulo: Optional[str] = None
    data: Optional[str] = None
    is_all_day: Optional[bool] = None

class RemedioBase(BaseModel):
    nome: str
    horarios: str
    ativo: bool = True
    estoque: Optional[int] = None

class RemedioCreate(RemedioBase):
    pass

class RemedioResponse(RemedioBase):
    id: int
    casa_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class DespesaBase(BaseModel):
    descricao: str
    categoria: str
    valor: float
    vencimento: Optional[datetime] = None
    pago: bool = False

class DespesaCreate(DespesaBase):
    pass

class DespesaUpdate(BaseModel):
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    valor: Optional[float] = None
    vencimento: Optional[datetime] = None
    pago: Optional[bool] = None

class DespesaResponse(DespesaBase):
    id: int
    casa_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class CategoriaProdutoBase(BaseModel):
    nome: str

class CategoriaProdutoCreate(CategoriaProdutoBase):
    pass

class CategoriaProdutoResponse(CategoriaProdutoBase):
    id: int
    casa_id: int
    
    class Config:
        from_attributes = True

class NfcePreviewRequest(BaseModel):
    qr_code: str = Field(min_length=10, max_length=2048)

class NfceItemPreview(BaseModel):
    indice: int
    nome: str
    quantidade: float
    unidade: str
    preco_unitario: float
    valor_total: float
    produto_id: Optional[int] = None

class NfcePreviewResponse(BaseModel):
    chave_acesso: str
    uf: str
    emitente: Optional[str] = None
    valor_total: Optional[float] = None
    consulta_portal: str
    consulta_tentativas: int = Field(ge=1)
    retry_after_seconds: int = Field(default=0, ge=0)
    itens: List[NfceItemPreview]

class NfceImportItem(BaseModel):
    indice: int = Field(default=0, ge=0)
    nome: str = Field(min_length=1, max_length=200)
    quantidade: float = Field(gt=0)
    unidade: str = Field(min_length=1, max_length=16)
    preco_unitario: float = Field(ge=0)
    produto_id: Optional[int] = None
    categoria: str = Field(default="Outros", min_length=1, max_length=100)

class NfceImportRequest(BaseModel):
    chave_acesso: str = Field(pattern=r"^\d{44}$")
    uf: str = Field(min_length=2, max_length=2)
    emitente: Optional[str] = Field(default=None, max_length=200)
    valor_total: Optional[float] = Field(default=None, ge=0)
    itens: List[NfceImportItem] = Field(min_length=1, max_length=500)
    itens_nota: List[NfceItemPreview] = Field(min_length=1, max_length=500)

class NfceImportResponse(BaseModel):
    atualizados: int
    criados: int
    produtos: List[ProdutoResponse]

class NfceHistoryItemResponse(BaseModel):
    indice: int
    nome: str
    quantidade: float
    unidade: str
    preco_unitario: float
    valor_total: float
    importado_estoque: bool

class NfceAccessKeyResponse(BaseModel):
    chave_acesso: str
    uf: str
    importada: bool
    emitente: Optional[str] = None
    valor_total: Optional[float] = None
    importada_em: Optional[datetime] = None
    itens: List[NfceHistoryItemResponse] = Field(default_factory=list)
    consulta_automatica_disponivel: bool = False
    mensagem: str
