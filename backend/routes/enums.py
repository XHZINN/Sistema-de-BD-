from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

ENUMS_PERMITIDOS = [
    'tipo_visita',
    'formato_visita',
    'status_visita',
    'origem_tarefa',
    'prioridade_nivel',
    'status_tarefa',
    'modelo_contrato',
]


@router.get('/{nome_enum}')
def buscar_enum(nome_enum: str):
    if nome_enum not in ENUMS_PERMITIDOS:
        raise HTTPException(status_code=404, detail='Enum não encontrado')

    response = supabase.rpc('buscar_enum', {'nome_enum': nome_enum}).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail='Nenhum valor encontrado')

    return [row['enumlabel'] for row in response.data]