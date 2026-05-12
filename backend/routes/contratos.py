from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database import supabase
from models import CadastrarContrato, AtualizarContrato
from datetime import date

router = APIRouter()


@router.post('/cliente/{id_cliente}/contrato/cadastrar')
def cadastrar_contrato(id_cliente: str, body: CadastrarContrato):
    data = body.model_dump()
    data['id_cliente'] = id_cliente 
    
    
    data['data_inicio'] = data['data_inicio'].isoformat()
    if data['data_fim']:
        data['data_fim'] = data['data_fim'].isoformat()

    response = supabase.table('contratos').insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail='Erro ao cadastrar contrato')

    return response.data[0]


@router.get('/cliente/{id_cliente}/contrato/listar')
def listar_contratos_cliente(id_cliente: str):
    response = supabase.table('contratos').select('*').eq('id_cliente', id_cliente).execute()
    return response.data


@router.get('/contrato/{id_contrato}')
def buscar_contrato(id_contrato: str):
    response = supabase.table('contratos').select('*').eq('id', id_contrato).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Contrato não encontrado')

    return response.data


@router.put('/contrato/{id_contrato}/atualizar')
def atualizar_contrato(id_contrato: str, body: AtualizarContrato):
    
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    
    for campo in ['data_inicio', 'data_fim']:
        if campo in data and data[campo]:
            data[campo] = data[campo].isoformat()

    response = supabase.table('contratos').update(data).eq('id', id_contrato).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Contrato não encontrado')

    return response.data[0]