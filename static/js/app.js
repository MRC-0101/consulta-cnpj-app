const form = document.getElementById("consultaForm");
const cnpjInput = document.getElementById("cnpj");
const message = document.getElementById("message");
const resultado = document.getElementById("resultado");
const consultarButton = document.getElementById("consultarButton");
const limparButton = document.getElementById("limparButton");

const fields = {
    nome: document.getElementById("nome"),
    cnpjFormatado: document.getElementById("cnpjFormatado"),
    situacao: document.getElementById("situacao"),
    dataSituacao: document.getElementById("dataSituacao"),
    inscricaoEstadual: document.getElementById("inscricaoEstadual"),
    uf: document.getElementById("uf"),
    municipio: document.getElementById("municipio"),
};

function cleanValue(value) {
    return value.replace(/\D/g, "");
}

function formatCnpj(value) {
    const digits = value.replace(/\D/g, "");
    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
        .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
}

cnpjInput.addEventListener("input", () => {
    const formatted = formatCnpj(cnpjInput.value);
    cnpjInput.value = formatted;
});

limparButton.addEventListener("click", clearForm);

function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
}

function showResult(data) {
    fields.nome.textContent = data.nome;
    fields.cnpjFormatado.textContent = data.cnpj_formatado;
    fields.situacao.textContent = data.situacao_cadastral;
    fields.dataSituacao.textContent = data.data_situacao;
    fields.inscricaoEstadual.textContent = data.inscricao_estadual;
    fields.uf.textContent = data.uf;
    fields.municipio.textContent = data.municipio;
    resultado.classList.remove("hidden");
}

function clearForm() {
    cnpjInput.value = "";
    resultado.classList.add("hidden");
    showMessage("", "");
    consultarButton.disabled = false;
    consultarButton.innerHTML = "Consultar";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultado.classList.add("hidden");
    showMessage("", "");
    consultarButton.disabled = true;
    consultarButton.innerHTML = '<span class="spinner"></span>Consultando...';

    const cnpjRaw = cleanValue(cnpjInput.value);
    if (!/^\d{14}$/.test(cnpjRaw)) {
        showMessage("Informe um CNPJ válido com 14 dígitos.");
        consultarButton.disabled = false;
        consultarButton.innerHTML = "Consultar";
        return;
    }

    showMessage("Buscando dados...", "success");

    try {
        const response = await fetch("/api/consulta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cnpj: cnpjRaw }),
        });

        const result = await response.json();
        if (!response.ok) {
            showMessage(result.error || "Erro na consulta.");
            return;
        }

        showResult(result);
        showMessage("Consulta realizada com sucesso.", "success");
    } catch (error) {
        showMessage("Erro ao conectar com o servidor.");
        console.error(error);
    } finally {
        consultarButton.disabled = false;
        consultarButton.innerHTML = "Consultar";
    }
});
