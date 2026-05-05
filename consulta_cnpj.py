from flask import Flask, request, jsonify, render_template
import os
import re
import requests

app = Flask(__name__, template_folder="templates", static_folder="static")

SINTEGRA_API_URL = os.environ.get(
    "SINTEGRA_API_URL",
    "https://open.cnpja.com/office/{cnpj}",
)
SINTEGRA_API_TOKEN = os.environ.get("SINTEGRA_API_TOKEN", "24D22976-1B4C-4CFE-B6B5-D180E7A04F74")

CNPJ_REGEX = re.compile(r"^\d{14}$")


def format_cnpj(cnpj: str) -> str:
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/consulta", methods=["POST"])
def consulta_cnpj():
    data = request.get_json(force=True, silent=True)
    if not data or "cnpj" not in data:
        return jsonify({"error": "Informe o CNPJ no corpo da requisição."}), 400

    cnpj = re.sub(r"\D", "", str(data["cnpj"]))
    if not CNPJ_REGEX.match(cnpj):
        return jsonify({"error": "CNPJ inválido. Informe 14 dígitos numéricos."}), 400

    url = SINTEGRA_API_URL.format(cnpj=cnpj)
    headers = {}

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        error_message = "Erro ao consultar a API."
        if "Failed to resolve" in str(exc) or "NameResolutionError" in str(exc):
            error_message = (
                "Não foi possível resolver o host da API. "
                "Verifique o endereço em SINTEGRA_API_URL e sua conexão de internet."
            )
        return jsonify({"error": f"{error_message} Detalhes: {exc}"}), 502
    except ValueError:
        return jsonify({"error": "Resposta inválida da API."}), 502

    # Ajuste os campos abaixo conforme o formato retornado pela API CNPJa.
    result = {
        "nome": payload.get("company", {}).get("name") or "Não encontrado",
        "cnpj_formatado": format_cnpj(cnpj),
        "situacao_cadastral": payload.get("status", {}).get("text") or "Não informado",
        "data_situacao": payload.get("statusDate") or "Não informado",
        "inscricao_estadual": payload.get("suframa", [{}])[0].get("number") if payload.get("suframa") else "Não possui",
        "uf": payload.get("address", {}).get("state") or "Não informado",
        "municipio": payload.get("address", {}).get("city") or "Não informado",
    }

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
