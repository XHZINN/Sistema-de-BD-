from pydantic import BaseModel, model_validator
from typing import List, Optional, Any, Dict
from datetime import datetime, date


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
    email_oficial: Optional[str] = None      
    telefone_oficial: Optional[str] = None    
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
    tipo_agendamento: str       
    data: datetime
    urgencia: str                
    local: str
    formato: str                 
    status: str                  
    observacao: Optional[str] = None
 
 
class AtualizarAgendamento(BaseModel):
    tipo_agendamento: Optional[str] = None
    data: Optional[datetime] = None
    urgencia: Optional[str] = None
    local: Optional[str] = None
    formato: Optional[str] = None
    status: Optional[str] = None
    observacao: Optional[str] = None
 
class CadastrarRelatorio(BaseModel):
    id_visita: str
    tipo: str
    data_prevista: date
    status: str = 'Pendente'
    documento: Optional[str] = None
    avancos: Optional[str] = None
    proximo_passo: Optional[str] = None
    cobranca_extra: bool = False
    valor_extra: Optional[float] = None
    duracao: Optional[float] = None
    conteudo: Optional[Dict[str, Any]] = None
    conteudo_html: Optional[str] = None


class AtualizarRelatorio(BaseModel):
    tipo: Optional[str] = None
    data_prevista: Optional[date] = None
    status: Optional[str] = None
    documento: Optional[str] = None
    avancos: Optional[str] = None
    proximo_passo: Optional[str] = None
    cobranca_extra: Optional[bool] = None
    valor_extra: Optional[float] = None
    duracao: Optional[float] = None
    conteudo: Optional[Dict[str, Any]] = None
    conteudo_html: Optional[str] = None