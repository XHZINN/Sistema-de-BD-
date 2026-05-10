from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clientes, visitas

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