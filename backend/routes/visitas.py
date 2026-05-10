from fastapi import APIRouter
from database import supabase
from models import CadastrarVisita

router = APIRouter()

# class CadastrarVisita(BaseModel):
#     id_agendamento: str
#     hora_inicio: datetime
#     observacao: Optional[str] = None
#     registro_mult: Optional[str] = None
  
@router.post('/cadastrar')
async def cadastrar_visita(dados: CadastrarVisita):

    supabase.table('visitas').insert({
        'id_agendamento': dados.id_agendamento,
        'hora_inicio': dados.hora_inicio.isoformat(),
        'observacao': dados.observacao.capitalize().strip() if dados.observacao else None,
        'registro_mult': dados.registro_mult.strip() if dados.registro_mult else None,
    }).execute()

    return {'mensagem': 'Visita cadastrada com sucesso!'}


# @router.get('/listar')
# async def listar_visitas()