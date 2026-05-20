from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clientes, contatos, visitas, agendamentos, enums, relatorios, mensagens, tarefas, pagamento
from email_service import checar_emails
from apscheduler.schedulers.background import BackgroundScheduler


# comando pra testar:
# uvicorn main:app --reload

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
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
app.include_router(mensagens.router,   prefix='/mensagem')
app.include_router(pagamento.router, prefix='/pagamento')

# ── Job periódico: checa emails a cada 1 minutos ──
scheduler = BackgroundScheduler()
scheduler.add_job(checar_emails, 'interval', minutes=1)
scheduler.start()
 
@app.on_event('shutdown')
def shutdown_scheduler():
    scheduler.shutdown()
