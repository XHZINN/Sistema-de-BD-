from fastapi import APIRouter, HTTPException, UploadFile, File
from database import supabase
from models import CadastrarVisita, AtualizarVisita
from typing import Optional
import uuid as uuid_lib

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
            'registros': dados.registros if dados.registros else [],
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
    #aqui ele vai colocar os filtros para listar as visitas, eles podendo ser opcionais e quando não tiver é None
    id_agendamento: Optional[str] = None,
    id_cliente: Optional[str] = None,
    tipo_agendamento: Optional[str] = None,
    urgencia: Optional[str] = None,
    formato: Optional[str] = None

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

        if tipo_agendamento:
            query = query.eq('tipo_agendamento', tipo_agendamento)

        if urgencia:
            query = query.eq('urgencia', urgencia)

        if formato:
            query = query.eq('formato', formato)

        # aqui que executa a query
        resposta = query.order('hora_inicio', desc=True).limit(50).execute()

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

@router.post('/{id_visita}/midia')
async def upload_midia(id_visita: str, file: UploadFile = File(...)):
    contents = await file.read()
    ext = file.filename.split('.')[-1]
    path = f"visitas/{id_visita}/{uuid_lib.uuid4()}.{ext}"

    supabase.storage.from_('visitas').upload(path, contents, {
        "content-type": file.content_type
    })

    url = supabase.storage.from_('visitas').get_public_url(path)

    novo_registro = {
        "nome":      file.filename,
        "url":       url,
        "path":      path,
        "tipo":      file.content_type,
        "tamanho":   len(contents),
        "criado_em": __import__('datetime').datetime.utcnow().isoformat(),
    }

    visita = supabase.table('visitas').select('registros').eq('id_visita', id_visita).single().execute()
    registros_atuais = visita.data.get('registros') or []
    registros_atuais.append(novo_registro)

    supabase.table('visitas').update({'registros': registros_atuais}).eq('id_visita', id_visita).execute()

    return novo_registro


@router.delete('/{id_visita}/midia')
def deletar_midia(id_visita: str, path: str):
    supabase.storage.from_('visitas').remove([path])

    visita = supabase.table('visitas').select('registros').eq('id_visita', id_visita).single().execute()
    registros = [r for r in (visita.data.get('registros') or []) if r['path'] != path]
    supabase.table('visitas').update({'registros': registros}).eq('id_visita', id_visita).execute()

    return {'ok': True}

@router.put('/{id_visita}/atualizar')
async def atualizar_visita(id_visita: str, dados: AtualizarVisita):
    try:
        data = {}
        if dados.observacao is not None:
            data['observacao'] = dados.observacao.capitalize().strip()
        if dados.registros is not None:
            data['registros'] = dados.registros

        if not data:
            raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

        response = supabase.table('visitas').update(data).eq('id_visita', id_visita).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail='Visita não encontrada')

        return response.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

