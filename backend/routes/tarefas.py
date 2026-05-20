from fastapi import APIRouter, HTTPException 
from database import supabase
from models import CadastrarTarefa, AtualizarTarefa, AtualizarStatusTarefa
from typing import Optional, Literal

router = APIRouter()

#cadastrar uma nova tarefa(caso não tenha ficado claro, tá bem difícil de entender né)
@router.post('/cadastrar')
async def cadastrar_tarefa(dados: CadastrarTarefa):
    try:
        supabase.table('tarefas').insert({
            'id_cliente': dados.id_cliente if dados.id_cliente else None,
            'descricao': dados.descricao.capitalize().strip(),
            'origem': dados.origem,
            'prioridade': dados.prioridade,
            'status': dados.status,
            'id_agendamento': dados.id_agendamento if dados.id_agendamento else None,
        }).execute()

        return {'mensagem': 'Tarefa cadastrada com sucesso!'}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/listar')
async def listar_tarefas(
    id_cliente: Optional[str] = None,
    id_agendamento: Optional[str] = None,
    origem: Optional[Literal['Atendimento','WhatsApp','Lembrete pessoal','Ligação rápida']] = None,
    prioridade: Optional[Literal['Baixa','Média','Alta','Urgente']] = None,
    status: Optional[Literal['Pendente','Em andamento','Concluída']] = None):
    try:
        query = supabase.table('tarefas').select('*')

        if id_cliente:
            query = query.eq('id_cliente', id_cliente)

        if id_agendamento:
            query = query.eq('id_agendamento', id_agendamento)

        if origem:
            query = query.eq('origem', origem)

        if prioridade:
            query = query.eq('prioridade', prioridade)
        
        if status:
            query = query.eq('status', status)

        resposta = query.execute()

        return resposta.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get('/{id_tarefa}')
async def buscar_tarefa(id_tarefa: str):

    try:
        resposta = supabase.table('tarefas').select('*').eq('id_tarefa', id_tarefa).single().execute()

        return resposta.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/{id_tarefa}/atualizar')
async def atualizar_tarefa(id_tarefa: str, dados: AtualizarTarefa):
    try:
        data = {k: v for k, v in dados.model_dump().items() if v is not None}

        if not data:
            raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

        response = supabase.table('tarefas').update(data).eq('id_tarefa', id_tarefa).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail='Tarefa não encontrada')

        return response.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put('/{id_tarefa}/status')
async def atualizar_status(id_tarefa: str, dados: AtualizarStatusTarefa):
    try:
        response = supabase.table('tarefas').update({
            'status': dados.status
        }).eq('id_tarefa', id_tarefa).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail='Tarefa não encontrada')

        return response.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))