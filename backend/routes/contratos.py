from fastapi import APIRouter, HTTPException
from typing import Optional
from database import supabase
from models import CadastrarContrato, AtualizarContrato

router = APIRouter()


@router.post('/cliente/{id_cliente}/contrato/cadastrar')
def cadastrar_contrato(id_cliente: str, body: CadastrarContrato):
    data = body.model_dump()
    data['id_cliente'] = id_cliente

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
    response = (
        supabase.table('contratos')
        .select('*')
        .eq('id_contrato', id_contrato)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Contrato não encontrado')

    return response.data


@router.put('/contrato/{id_contrato}/atualizar')
def atualizar_contrato(id_contrato: str, body: AtualizarContrato):
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    response = (
        supabase.table('contratos')
        .update(data)
        .eq('id_contrato', id_contrato)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Contrato não encontrado')

    return response.data[0]