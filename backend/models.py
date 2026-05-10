from pydantic import BaseModel, model_validator
from typing import List, Optional

class Contato(BaseModel):
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    vinculo: str
    area: Optional[str] = None
    observacoes: Optional[str] = None

    @model_validator(mode='after')
    def verificar_contato_minimo(self):
        if not self.telefone and not self.email:
            raise ValueError('Contato deve ter pelo menos telefone ou email')
        return self

class CadastrarCliente(BaseModel):
    nome: str
    cidade: str
    tipo_cliente: str
    contatos: List[Contato]
    modelo: str
    valor: Optional[float] = None
    permite_cobranca_extra: bool = False
    descricao_regras: Optional[str] = None

    