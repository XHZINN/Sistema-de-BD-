from pydantic import BaseModel, model_validator
from typing import List, Optional, Any, Dict, Literal
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
    
class CadastrarContato(BaseModel):
    """Usado na rota POST /cliente/{id}/contato/cadastrar — contato avulso."""
    nome: str
    vinculo: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    area: Optional[str] = None
    observacoes: Optional[str] = None

    @model_validator(mode='after')
    def verificar_contato_minimo(self):
        if not self.telefone and not self.email:
            raise ValueError('Contato deve ter pelo menos telefone ou email.')
        return self


class AtualizarContato(BaseModel):
    """Usado na rota PUT /contato/{id}/atualizar — todos os campos opcionais."""
    nome: Optional[str] = None
    vinculo: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    area: Optional[str] = None
    observacoes: Optional[str] = None
  
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

class AtualizarCliente(BaseModel):
    nome: Optional[str] = None
    cidade: Optional[str] = None
    tipo_cliente: Optional[str] = None
    email_oficial: Optional[str] = None
    telefone_oficial: Optional[str] = None

class CadastrarVisita(BaseModel):
    id_agendamento: str
    hora_inicio: datetime
    observacao: Optional[str] = None
    registros: Optional[List[Dict[str, Any]]] = None

class AtualizarVisita(BaseModel):
    observacao: Optional[str] = None
    registros: Optional[List[Dict[str, Any]]] = None


class CadastrarAgendamento(BaseModel):
    id_cliente: Optional[str] = None
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

class ResponderMensagem(BaseModel):
    conteudo: str
 
 
class AtualizarMensagem(BaseModel):
    lida: Optional[bool] = None
    status_vinculo: Optional[str] = None  # 'vinculado' | 'sugerido' | 'desconhecido' | 'ignorado'
    id_cliente: Optional[str] = None
 
class CadastrarTarefa(BaseModel):
    id_cliente: Optional[str] = None
    descricao: str
    origem: Literal['Atendimento', 'WhatsApp', 'Lembrete pessoal', 'Ligação rápida']
    prioridade: Literal['Baixa', 'Média', 'Alta', 'Urgente']
    status: Literal['Pendente', 'Em andamento', 'Concluída']
    id_agendamento: Optional[str] = None


class AtualizarTarefa(BaseModel):
    id_cliente: Optional[str] = None
    descricao: Optional[str] = None
    origem: Optional[Literal['Atendimento', 'WhatsApp', 'Lembrete pessoal', 'Ligação rápida']] = None
    prioridade: Optional[Literal['Baixa', 'Média', 'Alta', 'Urgente']] = None
    status: Optional[Literal['Pendente', 'Em andamento', 'Concluída']] = None
    id_agendamento: Optional[str] = None

class AtualizarStatusTarefa(BaseModel):
    status: Literal['Pendente', 'Em andamento', 'Concluída'] = None

class CadastrarPagamento(BaseModel):
    id_contrato: str
    id_relatorio: Optional[str] = None
    valor: float
    tipo: Literal['Mensalidade', 'Cobrança extra']
    data_vencimento: date
    observacao: Optional[str] = None

class ConfirmarPagamento(BaseModel):
    data_pagamento: date
    observacao: Optional[str] = None

class AtualizarPagamento(BaseModel):
    valor: Optional[float] = None
    tipo: Optional[Literal['Mensalidade', 'Cobrança extra']] = None
    status: Optional[Literal['Pendente', 'Pago', 'Atrasado']] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[date] = None
    observacao: Optional[str] = None

class CadastrarContrato(BaseModel):
    modelo: str
    valor: Optional[float] = None
    permite_cobranca_extra: bool = False
    descricao_regras: Optional[str] = None
    data_fechamento: Optional[date] = None
    prazo_contrato: Optional[date] = None
 
 
class AtualizarContrato(BaseModel):
    modelo: Optional[str] = None
    valor: Optional[float] = None
    permite_cobranca_extra: Optional[bool] = None
    descricao_regras: Optional[str] = None
    data_fechamento: Optional[date] = None
    prazo_contrato: Optional[date] = None
 