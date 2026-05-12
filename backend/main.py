from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clientes, contatos, visitas, agendamentos, enums, relatorios, tarefas


# comando pra testar:
# uvicorn main:app --reload

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(clientes.router, prefix='/cliente')
app.include_router(visitas.router, prefix='/visitas')
app.include_router(agendamentos.router, prefix='/agendamento')
app.include_router(enums.router, prefix='/enum')
app.include_router(relatorios.router, prefix='/relatorio')
app.include_router(contatos.router , prefix='/contatos')
app.include_router(tarefas.router , prefix='/tarefas')