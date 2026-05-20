from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database import supabase
from models import CadastrarPagamento, AtualizarPagamento, ConfirmarPagamento
from datetime import date

router = APIRouter()

SELECT_FIELDS = '*, contratos(modelo, valor, permite_cobranca_extra, id_cliente, cliente(nome))'


@router.post('/cadastrar')
def cadastrar_pagamento(body: CadastrarPagamento):
    data = body.model_dump()
    data['data_vencimento'] = data['data_vencimento'].isoformat()
    data['status'] = 'Pendente'

    response = supabase.table('pagamentos').insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail='Erro ao cadastrar pagamento')

    return response.data[0]


@router.post('/gerar-mensalidades/{id_contrato}')
def gerar_mensalidades(id_contrato: str, meses: int = Query(default=12, ge=1, le=60)):
    """Gera N mensalidades futuras para um contrato de uma vez."""
    contrato = supabase.table('contratos').select('*').eq('id_contrato', id_contrato).single().execute()

    if not contrato.data:
        raise HTTPException(status_code=404, detail='Contrato não encontrado')

    if not contrato.data.get('valor'):
        raise HTTPException(status_code=400, detail='Contrato não tem valor definido')

    hoje = date.today()
    pagamentos = []
    for i in range(meses):
        mes = (hoje.month + i - 1) % 12 + 1
        ano = hoje.year + (hoje.month + i - 1) // 12
        pagamentos.append({
            'id_contrato': id_contrato,
            'valor': contrato.data['valor'],
            'tipo': 'Mensalidade',
            'status': 'Pendente',
            'data_vencimento': date(ano, mes, hoje.day).isoformat(),
        })

    response = supabase.table('pagamentos').insert(pagamentos).execute()

    return {'mensagem': f'{meses} mensalidades geradas com sucesso', 'pagamentos': response.data}


@router.get('/listar')
def listar_pagamentos(
    id_contrato: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    vencidos: Optional[bool] = Query(None),
):
    query = supabase.table('pagamentos').select(SELECT_FIELDS).order('data_vencimento')

    if id_contrato:
        query = query.eq('id_contrato', id_contrato)
    if status:
        query = query.eq('status', status)
    if tipo:
        query = query.eq('tipo', tipo)
    if vencidos:
        query = query.lt('data_vencimento', date.today().isoformat()).eq('status', 'Pendente')

    return query.execute().data


@router.get('/resumo-mensal')
def resumo_mensal(ano: int = Query(...), mes: int = Query(...)):
    """Retorna faturamento, pendentes e atrasados de um mês específico."""
    inicio = date(ano, mes, 1).isoformat()
    fim = date(ano, mes + 1, 1).isoformat() if mes < 12 else date(ano + 1, 1, 1).isoformat()

    response = supabase.table('pagamentos') \
        .select(SELECT_FIELDS) \
        .gte('data_vencimento', inicio) \
        .lt('data_vencimento', fim) \
        .execute()

    pagamentos = response.data
    hoje = date.today().isoformat()

    return {
        'faturado':  sum(p['valor'] for p in pagamentos if p['status'] == 'Pago'),
        'pendente':  sum(p['valor'] for p in pagamentos if p['status'] == 'Pendente' and p['data_vencimento'] >= hoje),
        'atrasado':  sum(p['valor'] for p in pagamentos if p['status'] == 'Pendente' and p['data_vencimento'] < hoje),
        'total_previsto': sum(p['valor'] for p in pagamentos),
        'pagamentos': pagamentos,
    }


@router.get('/{id_pagamento}')
def buscar_pagamento(id_pagamento: str):
    response = supabase.table('pagamentos') \
        .select(SELECT_FIELDS) \
        .eq('id_pagamento', id_pagamento) \
        .single() \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Pagamento não encontrado')

    return response.data


@router.put('/{id_pagamento}/confirmar')
def confirmar_pagamento(id_pagamento: str, body: ConfirmarPagamento):
    """Marca um pagamento como pago — chamado ao receber comprovante."""
    data = {
        'status': 'Pago',
        'data_pagamento': body.data_pagamento.isoformat(),
    }
    if body.observacao:
        data['observacao'] = body.observacao

    response = supabase.table('pagamentos') \
        .update(data) \
        .eq('id_pagamento', id_pagamento) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Pagamento não encontrado')

    return response.data[0]


@router.put('/{id_pagamento}/atualizar')
def atualizar_pagamento(id_pagamento: str, body: AtualizarPagamento):
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    for campo in ['data_vencimento', 'data_pagamento']:
        if campo in data:
            data[campo] = data[campo].isoformat()

    response = supabase.table('pagamentos') \
        .update(data) \
        .eq('id_pagamento', id_pagamento) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Pagamento não encontrado')

    return response.data[0]