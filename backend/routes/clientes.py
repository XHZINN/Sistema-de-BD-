from fastapi import APIRouter, HTTPException, Query
from database import supabase
from typing import Optional
from models import CadastrarCliente, AtualizarCliente, CadastrarContato

router = APIRouter()

@router.post('/cadastrar')
async def cadastrar_cliente(dados: CadastrarCliente):
    id_cliente = None 
    try:
        #insere os dados basicos do cliente
        resposta_cliente = supabase.table('cliente').insert({
            'nome': dados.nome.title().strip(),
            'cidade': dados.cidade.title().strip(),
            'tipo_cliente': dados.tipo_cliente.strip(),
            'email_oficial': dados.email_oficial.lower().strip() if dados.email_oficial else None, 
            'telefone_oficial': dados.telefone_oficial.strip() if dados.telefone_oficial else None, 
        }).execute()

        #confere se os dados foram pro banco
        if not resposta_cliente.data:
            raise Exception("Falha ao inserir cliente: Nenhum dado retornado.")

        #guarda o id pra usar nos outros insert 
        id_cliente = resposta_cliente.data[0]['id_cliente']

        #pega os contatos, se tiver, e insere todos no fim 
        if dados.contatos: 
            lista_contatos = [{
                'id_cliente': id_cliente,
                'nome': contato.nome.title().strip(),
                'telefone': contato.telefone.strip() if contato.telefone else None,
                'email': contato.email.lower().strip() if contato.email else None,
                'vinculo': contato.vinculo.title().strip(),
                'area': contato.area.capitalize().strip() if contato.area else None,
                'observacoes': contato.observacoes.strip() if contato.observacoes else None,
                } for contato in dados.contatos]
            
            supabase.table('contatos').insert(lista_contatos).execute()

        #insert dos dados do contrato do cliente
        supabase.table('contratos').insert({
            'id_cliente': id_cliente,
            'modelo': dados.modelo.strip(),
            'valor': dados.valor,
            'permite_cobranca_extra': dados.permite_cobranca_extra,
            'descricao_regras': dados.descricao_regras.strip() if dados.descricao_regras else None,
        }).execute()

        return {'mensagem': 'Cliente cadastrado com sucesso!', 'id_cliente': id_cliente}

    except Exception as e:
        print(f"ERRO NO CADASTRO: {str(e)}")
        
        #limpa o cliente fantasma se uma das etapas de cima der errado
        if id_cliente:
            try:
                supabase.table('cliente').delete().eq('id_cliente', id_cliente).execute()
            except:
                pass 

        #erros de duplicatas e de inputs invalidos 
        erro_msg = str(e).lower()
        if 'cliente_email_oficial_key' in erro_msg:
            raise HTTPException(status_code=400, detail='Já existe um cliente com este e-mail.')
        
        if 'cliente_telefone_oficial_key' in erro_msg:
            raise HTTPException(status_code=400, detail='Já existe um cliente com este telefone.')
            
        if 'invalid input value' in erro_msg or 'user-defined' in erro_msg:
            raise HTTPException(status_code=400, detail="Valor inválido para campos de seleção (Modelo/Status).")

        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
    

#listar clientes 
@router.get('/listar')
async def listar_clientes(
    nome: Optional[str] = None,
    cidade: Optional[str] = None,
    tipo_cliente: Optional[str] = None
): 
    try:
        query = supabase.table('cliente').select('*')
        
        #filtros
        if nome:
            query = query.ilike('nome', f'%{nome}%')
        if cidade:
            query = query.eq('cidade', cidade)
        if tipo_cliente:
            query = query.eq('tipo_cliente', tipo_cliente)

        resposta = query.order('nome').execute()
        return resposta.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get('/{id_cliente}')
async def buscar_cliente(id_cliente: str):
    
    try:
        #busca os dados basicos dos clientes  
        resposta_cliente = supabase.table('cliente').select('*').eq('id_cliente', id_cliente).execute()
        if not resposta_cliente.data:
            raise HTTPException(status_code=404, detail='Cliente não encontrado')
        
        cliente = resposta_cliente.data[0]

        #busca todos os contatos relacionados a esse cliente
        resposta_contatos = supabase.table('contatos').select('*').eq('id_cliente', id_cliente).order('nome').execute()

        #junta os contatos com o objeto do cliente pra mandar tudo junto
        cliente['contatos'] = resposta_contatos.data
 
        return cliente
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.put('/{id_cliente}/atualizar')
async def atualizar_cliente(id_cliente: str, dados: AtualizarCliente):
    try:
        #converte o modelo pra dicionario e ignora oque nao for enviado
        #(se atualizar apenas uma parte/seção as outras nao sao alteradas) 
        campos = dados.model_dump(exclude_unset=True)

        if not campos:
            raise HTTPException(status_code=400, detail='Nenhum campo para atualizar foi enviado.')

        #tratamento dos dados
        if 'nome' in campos:
            campos['nome'] = campos['nome'].title().strip()
        if 'cidade' in campos:
            campos['cidade'] = campos['cidade'].title().strip()
        if 'email_oficial' in campos and campos['email_oficial']:
            campos['email_oficial'] = campos['email_oficial'].lower().strip()
        if 'telefone_oficial' in campos and campos['telefone_oficial']:
            campos['telefone_oficial'] = campos['telefone_oficial'].strip()

        #atualiza oque tiver sido alterado 
        resposta = supabase.table('cliente')\
            .update(campos)\
            .eq('id_cliente', id_cliente)\
            .execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail='Cliente não encontrado.')

        return {
            'mensagem': 'Cliente atualizado com sucesso!',
            'cliente': resposta.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        erro = str(e)
        #erros de duplicidade
        if 'cliente_email_oficial_key' in erro or 'email_oficial' in erro:
            raise HTTPException(status_code=400, detail='Já existe um cliente com esse email.')
        if 'cliente_telefone_oficial_key' in erro or 'telefone_oficial' in erro:
            raise HTTPException(status_code=400, detail='Já existe um cliente com esse telefone.')
        raise HTTPException(status_code=500, detail=f"Erro interno: {erro}")
    

@router.post('/{id_cliente}/contato/cadastrar')
async def cadastrar_contato(id_cliente: str, dados: CadastrarContato):
    try:
        #o id do cliente vem da url(rota) e ele ve se tem um cliente com esse id pra adicionar um contato dele
        resposta = supabase.table('contatos').insert({
            'id_cliente':  id_cliente,
            'nome':        dados.nome.title().strip(),
            'vinculo':     dados.vinculo.title().strip(),
            'area':        dados.area.capitalize().strip() if dados.area else None,
            'telefone':    dados.telefone.strip() if dados.telefone else None,
            'email':       dados.email.lower().strip() if dados.email else None,
            'observacoes': dados.observacoes.strip() if dados.observacoes else None,
        }).execute()

        if not resposta.data:
            raise HTTPException(status_code=400, detail='Erro ao processar cadastro.')

        return {
            'mensagem': 'Contato cadastrado com sucesso!',
            'contato': resposta.data[0]
        }

    except Exception as e:
        erro_msg = str(e).lower()
        #se colocar um id que nao existe ele da erro
        if 'foreign key' in erro_msg:
            raise HTTPException(status_code=404, detail='Cliente não encontrado.')
        
        # nao aceita o formato de id invalido
        if 'invalid input syntax' in erro_msg:
            raise HTTPException(status_code=400, detail='ID do cliente inválido.')
            
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get('/{id_cliente}/contato/listar')
async def listar_contatos(id_cliente: str):
    try:
        #o .eq ali so deixa mostrar os contatos daquele cliente do id especificamente
        resposta = supabase.table('contatos')\
            .select('*')\
            .eq('id_cliente', id_cliente)\
            .order('nome')\
            .execute()

        return resposta.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


