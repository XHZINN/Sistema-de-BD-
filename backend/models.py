from pydantic import BaseModel, model_validator
from typing import List, Optional
from datetime import datetime


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

class CadastrarVisita(BaseModel):
    id_agendamento: str
    hora_inicio: datetime
    observacao: Optional[str] = None
    registro_mult: Optional[str] = None

class CadastrarAgendamento(BaseModel):
    id_cliente: str
    tipo_agendamento: str        # 'Planejada' | 'Inesperada'
    data: datetime
    urgencia: str                # conforme ENUM do BD
    local: str
    formato: str                 # 'Presencial' | 'Online'
    status: str                  # 'Agendada' | 'Concluída' | 'Cancelada'
    observacao: Optional[str] = None
 
 
class AtualizarAgendamento(BaseModel):
    tipo_agendamento: Optional[str] = None
    data: Optional[datetime] = None
    urgencia: Optional[str] = None
    local: Optional[str] = None
    formato: Optional[str] = None
    status: Optional[str] = None
    observacao: Optional[str] = None
 
