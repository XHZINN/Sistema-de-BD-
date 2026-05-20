from fastapi import APIRouter, HTTPException, Query, File, UploadFile
from typing import Optional
from database import supabase
from models import CadastrarRelatorio, AtualizarRelatorio
import uuid

router = APIRouter()

# Join chain: relatorio -> visitas -> agendamentos -> cliente(nome)
SELECT_FIELDS = '*, visitas(id_agendamento, agendamentos(id_cliente, cliente(nome)))'

@router.post('/cadastrar')
def cadastrar_relatorio(body: CadastrarRelatorio):
    data = body.model_dump()
    if data.get('data_prevista'):
        data['data_prevista'] = data['data_prevista'].isoformat()

    response = supabase.table('relatorio').insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail='Erro ao cadastrar relatório')

    return response.data[0]


@router.get('/listar')
def listar_relatorios(
    id_visita: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
):
    query = supabase.table('relatorio').select(SELECT_FIELDS)

    if id_visita:
        query = query.eq('id_visita', id_visita)
    if status:
        query = query.eq('status', status)
    if tipo:
        query = query.eq('tipo', tipo)

    response = query.execute()

    return response.data


@router.get('/{id_relatorio}')
def buscar_relatorio(id_relatorio: str):
    response = (
        supabase.table('relatorio')
        .select(SELECT_FIELDS)
        .eq('id_relatorio', id_relatorio)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Relatório não encontrado')

    return response.data


@router.put('/{id_relatorio}/atualizar')
def atualizar_relatorio(id_relatorio: str, body: AtualizarRelatorio):
    data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')

    if 'data_prevista' in data:
        data['data_prevista'] = data['data_prevista'].isoformat()

    response = (
        supabase.table('relatorio')
        .update(data)
        .eq('id_relatorio', id_relatorio)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail='Relatório não encontrado')

    return response.data[0]

@router.post('/{id_relatorio}/anexos')
async def upload_anexo(id_relatorio: str, file: UploadFile = File(...)):
    # 1. Lê o arquivo
    contents = await file.read()
    
    # 2. Gera nome único no bucket
    ext = file.filename.split('.')[-1]
    path = f"relatorios/{id_relatorio}/{uuid.uuid4()}.{ext}"
    
    # 3. Faz upload no Supabase Storage
    supabase.storage.from_('relatorios').upload(path, contents, {
        "content-type": file.content_type
    })
    
    # 4. Pega a URL pública
    url = supabase.storage.from_('relatorios').get_public_url(path)
    
    # 5. Monta o objeto do anexo
    novo_anexo = {
        "id": str(uuid.uuid4()),
        "nome": file.filename,
        "tipo": file.content_type,
        "tamanho": len(contents),
        "url": url,
        "path": path,  # guarda pra poder deletar depois
    }
    
    # 6. Busca anexos atuais e faz append
    relatorio = supabase.table('relatorio').select('anexos').eq('id_relatorio', id_relatorio).single().execute()
    anexos_atuais = relatorio.data.get('anexos') or []
    anexos_atuais.append(novo_anexo)
    
    # 7. Salva no banco
    supabase.table('relatorio').update({'anexos': anexos_atuais}).eq('id_relatorio', id_relatorio).execute()
    
    return novo_anexo

@router.delete('/{id_relatorio}/anexos/{id_anexo}')
def deletar_anexo(id_relatorio: str, id_anexo: str):
    relatorio = supabase.table('relatorio').select('anexos').eq('id_relatorio', id_relatorio).single().execute()
    anexos = relatorio.data.get('anexos') or []
    
    # Acha o anexo pra pegar o path
    anexo = next((a for a in anexos if a['id'] == id_anexo), None)
    if not anexo:
        raise HTTPException(status_code=404, detail='Anexo não encontrado')
    
    # Remove do storage
    supabase.storage.from_('relatorios').remove([anexo['path']])
    
    # Remove da lista e salva
    anexos = [a for a in anexos if a['id'] != id_anexo]
    supabase.table('relatorio').update({'anexos': anexos}).eq('id_relatorio', id_relatorio).execute()
    
    return {'ok': True}
