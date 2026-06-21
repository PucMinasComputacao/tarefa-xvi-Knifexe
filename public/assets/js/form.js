// ─── FORM PAGE — Create & Update de lugares ──────────────────────────────────
// Depende de API_URL e showToast(), já definidos em script.js

const form = document.getElementById("lugarForm");
const submitBtn = document.getElementById("submitBtn");
const formPageLabel = document.getElementById("formPageLabel");

const fields = ["nome", "pais", "continente", "data", "imagem_principal", "descricao", "conteudo"];

let editingId = null;
let editingLugar = null; // guarda o registro original para preservar atracoes/id ao editar

function clearErrors() {
  document.querySelectorAll(".form-error").forEach(el => el.textContent = "");
}

function setError(fieldId, msg) {
  const el = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (el) el.textContent = msg;
}

function validateForm() {
  clearErrors();
  let valid = true;

  fields.forEach(id => {
    const value = document.getElementById(id).value.trim();
    if (!value) {
      setError(id, "Este campo é obrigatório.");
      valid = false;
    }
  });

  const urlField = document.getElementById("imagem_principal");
  if (urlField.value.trim()) {
    try {
      new URL(urlField.value.trim());
    } catch {
      setError("imagem_principal", "Informe uma URL válida (https://...).");
      valid = false;
    }
  }

  const dataField = document.getElementById("data");
  if (dataField.value && isNaN(new Date(dataField.value).getTime())) {
    setError("data", "Data inválida.");
    valid = false;
  }

  return valid;
}

function buildPayload() {
  const tagsRaw = document.getElementById("tags").value.trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  return {
    nome: document.getElementById("nome").value.trim(),
    pais: document.getElementById("pais").value.trim(),
    continente: document.getElementById("continente").value,
    descricao: document.getElementById("descricao").value.trim(),
    conteudo: document.getElementById("conteudo").value.trim(),
    data: document.getElementById("data").value,
    imagem_principal: document.getElementById("imagem_principal").value.trim(),
    destaque: document.getElementById("destaque").checked,
    tags,
    // Preserva atrações já cadastradas ao editar; novo registro começa sem atrações
    atracoes: editingLugar?.atracoes || []
  };
}

function fillForm(lugar) {
  document.getElementById("nome").value = lugar.nome || "";
  document.getElementById("pais").value = lugar.pais || "";
  document.getElementById("continente").value = lugar.continente || "";
  document.getElementById("data").value = lugar.data || "";
  document.getElementById("imagem_principal").value = lugar.imagem_principal || "";
  document.getElementById("descricao").value = lugar.descricao || "";
  document.getElementById("conteudo").value = lugar.conteudo || "";
  document.getElementById("tags").value = (lugar.tags || []).join(", ");
  document.getElementById("destaque").checked = !!lugar.destaque;
}

async function loadForEdit(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const lugar = await response.json();
    editingLugar = lugar;
    fillForm(lugar);
    formPageLabel.textContent = `✦ Editando: ${lugar.nome}`;
    submitBtn.textContent = "Atualizar destino";
  } catch (err) {
    console.error(err);
    showToast("Não foi possível carregar o destino para edição.", true);
  }
}

async function createLugar(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function updateLugar(id, payload) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Number(id), ...payload })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast("Verifique os campos obrigatórios.", true);
    return;
  }

  const payload = buildPayload();
  submitBtn.disabled = true;
  submitBtn.textContent = editingId ? "Atualizando..." : "Salvando...";

  try {
    if (editingId) {
      await updateLugar(editingId, payload);
      showToast("Destino atualizado com sucesso!");
    } else {
      const created = await createLugar(payload);
      showToast("Destino cadastrado com sucesso!");
      editingId = created.id;
    }
    setTimeout(() => { window.location.href = "index.html"; }, 900);
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar o destino. Verifique se o JSON Server está rodando.", true);
    submitBtn.disabled = false;
    submitBtn.textContent = editingId ? "Atualizar destino" : "Salvar destino";
  }
});

(function initForm() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    editingId = id;
    loadForEdit(id);
  }
})();
