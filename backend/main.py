from fastapi import FastAPI, HTTPException
from database import supabase
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, model_validator
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

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

@app.post('/cliente/cadastrar')
async def cadastrar_cliente(dados: CadastrarCliente):

    # inserindo o cliente
    resposta_cliente = supabase.table('cliente').insert({
        'nome': dados.nome.title().strip(),
        'cidade': dados.cidade.title().strip(),
        'tipo_cliente': dados.tipo_cliente.strip()
    }).execute()

    id_cliente = resposta_cliente.data[0]['id_cliente']

    # inserir cada contato usando o id_cliente
    for contato in dados.contatos:
        supabase.table('contatos').insert({
            'id_cliente': id_cliente,
            'nome': contato.nome.title().strip(),
            'telefone': contato.telefone.strip() if contato.telefone else None,
            'email': contato.email.lower().strip() if contato.email else None,
            'vinculo': contato.vinculo.title().strip(),
            'area': contato.area.capitalize().strip() if contato.area else None,
            'observacoes': contato.observacoes.strip() if contato.observacoes else None,
        }).execute()

    # inserir o contrato usando o id_cliente
    supabase.table('contratos').insert({
        'id_cliente': id_cliente,
        'modelo': dados.modelo.capitalize().strip(),
        'valor': dados.valor,
        'permite_cobranca_extra': dados.permite_cobranca_extra,
        'descricao_regras': dados.descricao_regras.strip() if dados.descricao_regras else None,
    }).execute()

    return {'mensagem': 'Cliente cadastrado com sucesso!', 'id_cliente': id_cliente}