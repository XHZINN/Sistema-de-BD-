from database import supabase
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import AtualizarContato

router = APIRouter()

#busca um contato especifico pelo id 
@router.get('/{id_contato}')
async def buscar_contato(id_contato: str):
    try:
        resposta = supabase.table('contatos').select('*').eq('id_contato', id_contato).execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail='Contato não encontrado.')

        return resposta.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/{id_contato}/atualizar')
async def atualizar_contato(id_contato: str, dados: AtualizarContato):
    try:
        # cria um dicionario so com oque for enviado, nao alterando as demais seções
        campos = dados.model_dump(exclude_unset=True)

        #se nao forem feitas alteracoes nada acontece
        if not campos:
            raise HTTPException(status_code=400, detail='Nenhum dado enviado para atualização.')

        # apaga os ids do dicionario pra nao ter risco de serem alterados
        campos.pop('id_contato', None)
        campos.pop('id_cliente', None)

        #tratament dos dados que vierem
        if 'nome' in campos: campos['nome'] = campos['nome'].title().strip()
        if 'vinculo' in campos: campos['vinculo'] = campos['vinculo'].title().strip()
        if 'area' in campos and campos['area']: campos['area'] = campos['area'].capitalize().strip()
        if 'email' in campos and campos['email']: campos['email'] = campos['email'].lower().strip()
        if 'telefone' in campos and campos['telefone']: campos['telefone'] = campos['telefone'].strip()

        #atualiza somente o campo onde o id contato coincidir
        resposta = supabase.table('contatos')\
            .update(campos)\
            .eq('id_contato', id_contato)\
            .execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail='Contato não encontrado.')

        return {
            'mensagem': 'Contato atualizado com sucesso!',
            'contato': resposta.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        if 'invalid input syntax' in str(e).lower():
            raise HTTPException(status_code=400, detail='ID do contato inválido.')
        raise HTTPException(status_code=500, detail=str(e))