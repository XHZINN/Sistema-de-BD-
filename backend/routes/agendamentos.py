from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database import supabase
from models import CadastrarAgendamento, AtualizarAgendamento

router = APIRouter()


@router.post('/cadastrar')
def cadastrar_agendamento(body: CadastrarAgendamento):
    data = body.model_dump()
    data['data'] = data['data'].isoformat()

    response = supabase.table('agendamentos').insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail='Erro ao cadastrar agendamento')

    return response.data[0]


@router.get('/listar')
def listar_agendamentos(
    id_cliente: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    formato: Optional[str] = Query(None),
):
    query = supabase.table('agendamentos').select('*, cliente(nome)')

    if id_cliente:
        query = query.eq('id_cliente', id_cliente)
    if status:
        query = query.eq('status', status)
    if tipo:
        query = query.eq('tipo_agendamento', tipo)
    if formato:
        query = query.eq('formato', formato)

    response = query.order('data', desc=False).execute()

    return response.data


@router.get('/{id_agendamento}')
def buscar_agendamento(id_agendamento: str):
    response = (
        supabase.table('agendamentos')
        .select('*, cliente(nome)')
        .eq('id_agendamento', id_agendamento)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')

    return response.data


@router.put('/{id_agendamento}/atualizar')
def atualizar_agendamento(id_agendamento: str, body: AtualizarAgendamento):
    # Remove campos None para não sobrescrever com null
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    if 'data' in data:
        data['data'] = data['data'].isoformat()

    response = (
        supabase.table('agendamentos')
        .update(data)
        .eq('id_agendamento', id_agendamento)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')

    return response.data[0]