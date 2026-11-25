import os
from pathlib import Path
from urllib.parse import quote_plus

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text

from database import db

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
database = os.getenv("DB_NAME")

ca_path = BASE_DIR / "ca.pem"

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{quote_plus(user)}:{quote_plus(password)}"
    f"@{host}:{port}/{database}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "connect_args": {
        "ssl": {"ca": str(ca_path)},
        "connect_timeout": 10
    }
}

db.init_app(app)

@app.route("/")
def inicio():
    return "TESTE NOVO - ESTOU NO APP.PY CERTO!"

@app.route("/teste-banco")
def teste_banco():


    print("ETAPA 1: Rota acessada!", flush=True)

    try:
        print("ETAPA 2: Tentando conectar ao Aiven...", flush=True)

        with db.engine.connect() as conexao:
            print("ETAPA 3: Conexão estabelecida!", flush=True)
            conexao.execute(text("SELECT 1"))

        print("ETAPA 4: Teste concluído!", flush=True)

        return {"mensagem": "Conexão com MySQL realizada!"}

    except Exception as erro:
        print("ERRO NA CONEXÃO:", repr(erro), flush=True)
        return {"erro": str(erro)}, 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)