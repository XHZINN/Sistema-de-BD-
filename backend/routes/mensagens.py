from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database import supabase
from models import ResponderMensagem, AtualizarMensagem
from email_service import enviar_email

router = APIRouter()


@router.get('/listar')
def listar_mensagens(
    id_cliente:     Optional[str]  = Query(None),
    canal:          Optional[str]  = Query(None),
    lida:           Optional[bool] = Query(None),
    status_vinculo: Optional[str]  = Query(None),
):
    query = supabase.table('mensagens') \
        .select('*, cliente(nome)') \
        .order('created_at', desc=True)

    if id_cliente:
        query = query.eq('id_cliente', id_cliente)
    if canal:
        query = query.eq('canal', canal)
    if lida is not None:
        query = query.eq('lida', lida)
    if status_vinculo:
        query = query.eq('status_vinculo', status_vinculo)

    return query.execute().data


@router.get('/{id_mensagem}')
def buscar_mensagem(id_mensagem: str):
    res = supabase.table('mensagens') \
        .select('*, cliente(nome)') \
        .eq('id_mensagem', id_mensagem) \
        .single() \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail='Mensagem não encontrada')
    return res.data


@router.post('/{id_mensagem}/responder')
def responder_mensagem(id_mensagem: str, body: ResponderMensagem):
    # busca mensagem original para pegar remetente e canal
    original = supabase.table('mensagens') \
        .select('remetente, canal, id_cliente') \
        .eq('id_mensagem', id_mensagem) \
        .single() \
        .execute()

    if not original.data:
        raise HTTPException(status_code=404, detail='Mensagem não encontrada')

    msg = original.data

    if msg['canal'] == 'email':
        enviar_email(msg['remetente'], body.conteudo)
    else:
        raise HTTPException(status_code=400, detail=f"Canal '{msg['canal']}' ainda não suportado para envio")

    # salva a resposta enviada
    supabase.table('mensagens').insert({
        'id_cliente':     msg['id_cliente'],
        'canal':          msg['canal'],
        'direcao':        'enviada',
        'conteudo':       body.conteudo,
        'lida':           True,
        'remetente':      msg['remetente'],
        'status_vinculo': 'vinculado',
    }).execute()

    return {'mensagem': 'Resposta enviada com sucesso'}


@router.put('/{id_mensagem}/atualizar')
def atualizar_mensagem(id_mensagem: str, body: AtualizarMensagem):
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    res = supabase.table('mensagens') \
        .update(data) \
        .eq('id_mensagem', id_mensagem) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail='Mensagem não encontrada')

    return res.data[0]