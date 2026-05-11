from database import supabase
from fastapi import APIRouter, HTTPException 
from typing import Optional
from models import CadastrarCliente

router = APIRouter()

@router.post('/cadastrar')
async def cadastrar_cliente(dados: CadastrarCliente):
    try:
        resposta_cliente = supabase.table('cliente').insert({
            'nome': dados.nome.title().strip(),
            'cidade': dados.cidade.title().strip(),
            'tipo_cliente': dados.tipo_cliente.strip(),
            'email_oficial': dados.email_oficial.lower().strip() if dados.email_oficial else None, 
            'telefone_oficial': dados.telefone_oficial.strip() if dados.telefone_oficial else None, 
        }).execute()

        id_cliente = resposta_cliente.data[0]['id_cliente']

        if dados.contatos: 
            for contato in dados.contatos:
                supabase.table('contatos').insert({
                    'id_cliente': id_cliente,
                    'nome': contato.nome.title().strip(),
                    'telefone': contato.telefone.strip() if contato.telefone else None,
                    'email': contato.email.lower().strip() if contato.email else None,
                    'vinculo': contato.vinculo.title().strip(),
                    'area': contato.area.capitalize().strip() if contato.area else None,
                    'observacoes': contato.observacoes.strip() if contato.observacoes else None,
                }).execute()

        supabase.table('contratos').insert({
            'id_cliente': id_cliente,
            'modelo': dados.modelo.strip(),
            'valor': dados.valor,
            'permite_cobranca_extra': dados.permite_cobranca_extra,
            'descricao_regras': dados.descricao_regras.strip() if dados.descricao_regras else None,
        }).execute()

        return {'mensagem': 'Cliente cadastrado com sucesso!', 'id_cliente': id_cliente}

    except Exception as e:
        erro = str(e)
        if  'cliente_email_oficial_key' in erro or 'email_oficial' in erro:
            raise HTTPException(status_code=400, detail= 'Já existe um cliente com esse email.')
        if 'cliente_telefone_oficial_key' in erro or 'telefone_oficial' in erro:
            raise HTTPException(status_code=400, detail='Já existe um cliente com esse telefone.')
        raise HTTPException(status_code=500, detail=f"Erro interno:{erro}")
    
#listar clientes 

@router.get('/listar')
async def listar_clientes(
    cidade: Optional[str] = None,
    tipo_cliente: Optional[str] = None
): 
    try:
        query = supabase.table('cliente').select('*')
        
        if cidade:
            query = query.eq('cidade', cidade)
        if tipo_cliente:
            query = query.eq('tipo_cliente', tipo_cliente)

        resposta = query.order('nome').execute()
        
        return resposta.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))