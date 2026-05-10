from fastapi import APIRouter, HTTPException
from database import supabase
from models import CadastrarCliente

router = APIRouter()

@router.post('/cadastrar')
async def cadastrar_cliente(dados: CadastrarCliente):

    resposta_cliente = supabase.table('cliente').insert({
        'nome': dados.nome.title().strip(),
        'cidade': dados.cidade.title().strip(),
        'tipo_cliente': dados.tipo_cliente.strip()
    }).execute()

    id_cliente = resposta_cliente.data[0]['id_cliente']

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

    supabase.table('contratos').insert({
        'id_cliente': id_cliente,
        'modelo': dados.modelo.capitalize().strip(),
        'valor': dados.valor,
        'permite_cobranca_extra': dados.permite_cobranca_extra,
        'descricao_regras': dados.descricao_regras.strip() if dados.descricao_regras else None,
    }).execute()

    return {'mensagem': 'Cliente cadastrado com sucesso!', 'id_cliente': id_cliente}