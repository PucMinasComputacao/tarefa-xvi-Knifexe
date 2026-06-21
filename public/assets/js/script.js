const API_URL = 'http://localhost:3000/lugares';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function goToDetail(id) {
  window.location.href = `detalhe.html?id=${id}`;
}

function getContinente(pais) {
  const mapa = {
    "França": "🇪🇺 Europa",
    "Japão": "🌏 Ásia",
    "Brasil": "🌎 América do Sul",
    "África do Sul": "🌍 África",
    "Espanha": "🇪🇺 Europa",
    "Estados Unidos": "🌎 América do Norte",
    "Itália": "🇪🇺 Europa",
    "Indonésia": "🌏 Ásia",
    "Portugal": "🇪🇺 Europa"
  };
  return mapa[pais] || "🌐 Internacional";
}

function showError(container, msg) {
  container.innerHTML = `
    <div class="text-center py-5">
      <h2 style="font-family:var(--font-display); color:var(--gold)">Erro ao carregar</h2>
      <p style="color:var(--muted)" class="mt-2">${msg}</p>
      <p style="color:var(--muted); font-size:0.85rem" class="mt-1">Verifique se o JSON Server está rodando em <strong>http://localhost:3000</strong></p>
    </div>
  `;
}

function showToast(msg, isError = false) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "toast-custom";
    document.body.appendChild(toast);
  }
  toast.classList.toggle("error", isError);
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), 3000);
}

let _deleteTargetId = null;

function ensureConfirmModal() {
  let overlay = document.getElementById("confirmOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "confirmOverlay";
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>Excluir destino?</h3>
      <p id="confirmText">Esta ação não pode ser desfeita.</p>
      <div class="confirm-actions">
        <button type="button" class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
        <button type="button" class="btn-confirm-delete" onclick="executeDelete()">Excluir</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeConfirmModal();
  });
  return overlay;
}

function confirmDelete(id, nome) {
  _deleteTargetId = id;
  const overlay = ensureConfirmModal();
  document.getElementById("confirmText").textContent = `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;
  overlay.classList.add("show");
}

function closeConfirmModal() {
  const overlay = document.getElementById("confirmOverlay");
  if (overlay) overlay.classList.remove("show");
  _deleteTargetId = null;
}

async function executeDelete() {
  if (_deleteTargetId == null) return;
  const id = _deleteTargetId;
  closeConfirmModal();

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    showToast("Destino excluído com sucesso.");

    if (window.location.pathname.includes("detalhe")) {
      setTimeout(() => { window.location.href = "index.html"; }, 900);
    } else {
      const card = document.querySelector(`[data-id="${id}"]`);
      buildHomePage();
    }
  } catch (err) {
    console.error(err);
    showToast("Erro ao excluir o destino.", true);
  }
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────

async function fetchItems() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function buildCarousel(destaques) {
  const inner = document.getElementById("carouselInner");
  const indicators = document.getElementById("carouselIndicators");

  destaques.forEach((lugar, i) => {
    // Indicator
    const ind = document.createElement("button");
    ind.type = "button";
    ind.setAttribute("data-bs-target", "#carouselDestaques");
    ind.setAttribute("data-bs-slide-to", i);
    ind.setAttribute("aria-label", `Slide ${i + 1}`);
    if (i === 0) { ind.classList.add("active"); ind.setAttribute("aria-current", "true"); }
    indicators.appendChild(ind);

    // Slide
    const item = document.createElement("div");
    item.className = `carousel-item${i === 0 ? " active" : ""}`;
    item.innerHTML = `
      <div class="carousel-item-custom" onclick="goToDetail(${lugar.id})">
        <img src="${lugar.imagem_principal}" alt="${lugar.nome}" loading="${i === 0 ? 'eager' : 'lazy'}">
        <div class="carousel-overlay"></div>
        <div class="carousel-caption-custom">
          <p class="carousel-country">✦ ${lugar.pais}</p>
          <h2 class="carousel-title">${lugar.nome}</h2>
          <p class="carousel-desc">${lugar.descricao}</p>
          <button class="carousel-cta" onclick="event.stopPropagation(); goToDetail(${lugar.id})">
            Explorar destino →
          </button>
        </div>
      </div>
    `;
    inner.appendChild(item);
  });
}

function createCard(lugar) {
  const col = document.createElement("div");
  col.className = "col-6 col-md-4 col-lg-3";
  col.innerHTML = `
    <a href="detalhe.html?id=${lugar.id}" class="dest-card">
      <div class="dest-card-img">
        <div class="dest-card-actions">
          <button type="button" class="card-action-btn edit" title="Editar" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='form.html?id=${lugar.id}';">✎</button>
          <button type="button" class="card-action-btn delete" title="Excluir" onclick="event.preventDefault(); event.stopPropagation(); confirmDelete(${lugar.id}, '${lugar.nome.replace(/'/g, "\\'")}');">🗑</button>
        </div>
        <img src="${lugar.imagem_principal}" alt="${lugar.nome}" loading="lazy">
        ${lugar.destaque ? '<span class="dest-card-badge">Destaque</span>' : ''}
      </div>
      <div class="dest-card-body">
        <p class="dest-card-country">${lugar.pais}</p>
        <h3 class="dest-card-name">${lugar.nome}</h3>
        <p class="dest-card-desc">${lugar.descricao}</p>
      </div>
      <div class="dest-card-footer">
        <span class="dest-card-date">${formatDate(lugar.data)}</span>
        <span class="dest-card-arrow">→</span>
      </div>
    </a>
  `;
  return col;
}

function renderCards(lugares) {
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = '';
  lugares.forEach(lugar => grid.appendChild(createCard(lugar)));
}

async function buildHomePage() {
  const grid = document.getElementById("cardGrid");
  const inner = document.getElementById("carouselInner");
  if (!inner || !grid) return;

  try {
    const lugares = await fetchItems();
    const destaques = lugares.filter(l => l.destaque);
    buildCarousel(destaques);
    renderCards(lugares);
  } catch (err) {
    console.error(err);
    showError(grid, "Não foi possível carregar os destinos.");
  }
}

// ─── DETAIL PAGE ─────────────────────────────────────────────────────────────

async function fetchItem(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function renderDetails(lugar) {
  const container = document.getElementById("detalheContainer");

  document.title = `BMG Transportes — ${lugar.nome}`;

  const tagsHTML = (lugar.tags || [])
    .map(tag => `<span class="dest-card-badge" style="position:static; margin:0">${tag}</span>`)
    .join('');

  container.innerHTML = `
    <div class="detail-hero">
      <img src="${lugar.imagem_principal}" alt="${lugar.nome}">
      <div class="detail-hero-overlay"></div>
      <div class="detail-hero-meta">
        <p class="detail-country">✦ ${lugar.pais}</p>
        <h1 class="detail-title">${lugar.nome}</h1>
        ${lugar.destaque ? '<span class="detail-badge">Destaque</span>' : ''}
      </div>
    </div>

    <div class="section-label mb-3">
      <span>✦ Informações Gerais</span>
    </div>

    <div class="info-grid">
      <div class="info-chip">
        <p class="info-chip-label">País</p>
        <p class="info-chip-value">🌍 ${lugar.pais}</p>
      </div>
      <div class="info-chip">
        <p class="info-chip-label">Publicado em</p>
        <p class="info-chip-value">📅 ${formatDate(lugar.data)}</p>
      </div>
      <div class="info-chip">
        <p class="info-chip-label">Status</p>
        <p class="info-chip-value">${lugar.destaque ? '⭐ Destaque' : '📍 Regular'}</p>
      </div>
      <div class="info-chip">
        <p class="info-chip-label">Atrações</p>
        <p class="info-chip-value">🗺️ ${lugar.atracoes.length} locais</p>
      </div>
      <div class="info-chip">
        <p class="info-chip-label">Continente</p>
        <p class="info-chip-value">${getContinente(lugar.pais)}</p>
      </div>
    </div>

    <div class="detail-content-block">
      <h2 class="detail-content-title">Sobre ${lugar.nome}</h2>
      <p class="detail-content-text">${lugar.conteudo}</p>
      ${tagsHTML ? `<div class="d-flex flex-wrap gap-2 mt-3">${tagsHTML}</div>` : ''}
    </div>

    <div class="atracoes-section">
      <div class="section-label">
        <span>✦ Atrações do Destino</span>
      </div>
      <div class="row g-4 mt-1">
        ${lugar.atracoes.map(a => `
          <div class="col-12 col-sm-6 col-md-4">
            <div class="atracao-card">
              <div class="atracao-img">
                <img src="${a.imagem}" alt="${a.nome}" loading="lazy">
              </div>
              <div class="atracao-body">
                <h4 class="atracao-name">${a.nome}</h4>
                <p class="atracao-desc">${a.descricao}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="text-center mt-5 mb-5">
      <a href="index.html" class="carousel-cta text-decoration-none" style="display:inline-flex">
        ← Explorar outros destinos
      </a>
    </div>
  `;
}

async function buildDetailPage() {
  const container = document.getElementById("detalheContainer");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = `
      <div class="text-center py-5">
        <h2 style="font-family:var(--font-display); color:var(--gold)">Nenhum destino selecionado</h2>
        <p style="color:var(--muted)" class="mt-2">Acesse um destino pela página principal.</p>
        <a href="index.html" style="color:var(--gold)">← Voltar para a lista</a>
      </div>
    `;
    return;
  }

  try {
    const lugar = await fetchItem(id);
    renderDetails(lugar);
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="text-center py-5">
        <h2 style="font-family:var(--font-display); color:var(--gold)">Destino não encontrado</h2>
        <p style="color:var(--muted)" class="mt-2">O destino com id "${id}" não existe na nossa base de dados.</p>
        <a href="index.html" style="color:var(--gold)">← Voltar para a lista</a>
      </div>
    `;
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

(function init() {
  const page = window.location.pathname;
  if (page.includes("detalhe")) {
    buildDetailPage();
  } else {
    buildHomePage();
  }
})();
