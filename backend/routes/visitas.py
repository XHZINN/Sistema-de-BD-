from fastapi import APIRouter, HTTPException 
from database import supabase
from models import CadastrarVisita, AtualizarVisita
from typing import Optional

router = APIRouter()
  
# define a rota tipo POST
@router.post('/cadastrar')
# cria a query de cadastrar a visita e puxa os dados da BaseModel
# os dados vem no body da requisição
async def cadastrar_visita(dados: CadastrarVisita):
    #vai tentar rodar o código
    try:
        # inserir na tabela visitas do supabase
        supabase.table('visitas').insert({
            'id_agendamento': dados.id_agendamento,
            'hora_inicio': dados.hora_inicio.isoformat(),
            #nessa tem que colocar os if pra não quebrar tudo se retornar null
            'observacao': dados.observacao.capitalize().strip() if dados.observacao else None,
            'registro_mult': dados.registro_mult.strip() if dados.registro_mult else None,
        }).execute()

        # retorna mensagem confirmando
        return {'mensagem': 'Visita cadastrada com sucesso!'}
    #se algo der erro, ele guarda o erro na variável "e"
    except Exception as e:
        # a API retorna um erro HTTP, 
        # status_code 500 significa "Erro interno no servidor",
        # detail=str(e) pega a mensagem do erro e transforma em texto
        raise HTTPException(status_code=500, detail=str(e))

# rota tipo GET(por ser GET, os dados vem pela URL, por isso que não usa BaseModel)
@router.get('/listar')
async def listar_visitas(
    id_agendamento: Optional[str] = None,
    id_cliente: Optional[str] = None
):
    try:
        # a view criada para não ter que fazer uma consulta complexa toda vez, selecionando todas as colunas da view
        query = supabase.table('visita_completa').select('*')

        # se o front mandou ?id_cliente=xxx na URL, coloca um filtro 
        # WHERE id_cliente = xxx 
        # se não mando, ignora e retorna tudo
        if id_cliente:
            query = query.eq('id_cliente', id_cliente)

        # mesma coisa mas com ?id_agendamento=yyy, os dois podendo ser combinados
        if id_agendamento:
            query = query.eq('id_agendamento', id_agendamento)

        # aqui que executa a query
        resposta = query.execute()

        #retorna os dados pro front
        return resposta.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/{id_visita}')
async def buscar_visita(id_visita: str):
    try:
        resposta = supabase.table('visita_completa').select('*').eq('id_visita', id_visita).single().execute()

        return resposta.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/{id_visita}/atualizar')
#ele vai pegar o id da visita pra saber qual tem que atualizar ai usa o BaseModel
async def atualizar_visita(id_visita: str, dados: AtualizarVisita):
    try: 
        supabase.table('visitas').update({
            'observacao': dados.observacao.capitalize().strip() if dados.observacao else None,
            'registro_mult': dados.registro_mult.strip() if dados.registro_mult else None
        }).eq('id_visita',id_visita).execute()
        
        return {'mensagem': 'Visita atualizada com sucesso!'}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))