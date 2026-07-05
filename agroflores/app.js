/* ===== Agroflores Garden — Estoque & Vendas =====
 * Modelo de app (front-end estático, dados em localStorage).
 * Perfis: vendedor (vende, adiciona estoque, solicita alteração de preço)
 *         admin    (autoriza alterações, gerencia estoque, vê vendas).
 */
"use strict";

const ADMIN_PIN = "1234"; // PIN de demonstração do modelo
const LOW_STOCK = 5;
const DB_KEY = "agroflores-db-v1";

const fmtBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

/* ===== Estado ===== */

const seedProducts = [
  { name: "Muda de rosa vermelha",        category: "Mudas",       price: 14.9,  qty: 32 },
  { name: "Orquídea Phalaenopsis",        category: "Flores",      price: 59.9,  qty: 8 },
  { name: "Girassol (vaso P)",            category: "Flores",      price: 18.5,  qty: 15 },
  { name: "Samambaia americana",          category: "Mudas",       price: 24.0,  qty: 12 },
  { name: "Terra vegetal adubada 5 kg",   category: "Insumos",     price: 12.9,  qty: 40 },
  { name: "Substrato para orquídeas 2 kg",category: "Insumos",     price: 16.5,  qty: 18 },
  { name: "Vaso de cerâmica M",           category: "Vasos",       price: 32.0,  qty: 10 },
  { name: "Vaso autoirrigável G",         category: "Vasos",       price: 49.9,  qty: 4 },
  { name: "Regador 5 L",                  category: "Ferramentas", price: 27.9,  qty: 7 },
  { name: "Kit jardinagem 3 peças",       category: "Ferramentas", price: 45.0,  qty: 6 },
];

let db = loadDb();
let user = null;             // { name, role }
let cart = new Map();        // productId -> qty
let priceModalProductId = null;

// localStorage pode estar bloqueado (ex.: navegação privada / iframe);
// nesse caso os dados vivem só em memória durante a sessão.
const storage = (() => {
  try {
    localStorage.setItem("__agroflores_test", "1");
    localStorage.removeItem("__agroflores_test");
    return localStorage;
  } catch (_) {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
})();

function loadDb() {
  try {
    const raw = storage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* dados corrompidos: recomeça */ }
  return {
    products: seedProducts.map((p, i) => ({ id: i + 1, ...p })),
    nextProductId: seedProducts.length + 1,
    requests: [],   // { id, productId, productName, oldPrice, newPrice, reason, seller, status, createdAt, resolvedAt }
    nextRequestId: 1,
    sales: [],      // { id, seller, items: [{name, qty, price}], total, createdAt }
    nextSaleId: 1,
  };
}

function saveDb() {
  storage.setItem(DB_KEY, JSON.stringify(db));
}

const productById = (id) => db.products.find((p) => p.id === id);
const pendingCount = () => db.requests.filter((r) => r.status === "pendente").length;
const pendingRequestFor = (productId) =>
  db.requests.find((r) => r.productId === productId && r.status === "pendente");

/* ===== Helpers de DOM ===== */

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

let toastTimer = null;
function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", isError);
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 3200);
}

/* ===== Login ===== */

let selectedRole = "vendedor";

document.querySelectorAll(".role-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedRole = btn.dataset.role;
    $("#login-pin-row").classList.toggle("hidden", selectedRole !== "admin");
  });
});

$("#btn-login").addEventListener("click", () => {
  const name = $("#login-name").value.trim();
  const errBox = $("#login-error");
  errBox.classList.add("hidden");

  if (!name) return showLoginError("Informe seu nome para entrar.");
  if (selectedRole === "admin" && $("#login-pin").value !== ADMIN_PIN)
    return showLoginError("PIN do administrador incorreto.");

  user = { name, role: selectedRole };
  $("#login-pin").value = "";
  enterApp();
});

function showLoginError(msg) {
  const errBox = $("#login-error");
  errBox.textContent = msg;
  errBox.classList.remove("hidden");
}

$("#btn-logout").addEventListener("click", () => {
  user = null;
  cart.clear();
  $("#mobile-cart-bar").classList.add("hidden");
  $("#screen-app").classList.remove("active");
  $("#screen-login").classList.add("active");
});

/* ===== Navegação por abas ===== */

const TABS = {
  vendedor: [
    { id: "pdv",           label: "🛒 Venda" },
    { id: "estoque",       label: "📦 Estoque" },
    { id: "solicitacoes",  label: "🔔 Solicitações" },
  ],
  admin: [
    { id: "solicitacoes",  label: "🔑 Autorizações" },
    { id: "estoque",       label: "📦 Estoque" },
    { id: "vendas",        label: "📈 Vendas" },
  ],
};

function enterApp() {
  $("#screen-login").classList.remove("active");
  $("#screen-app").classList.add("active");
  $("#user-badge").textContent =
    (user.role === "admin" ? "🔑 " : "🛒 ") + user.name +
    (user.role === "admin" ? " · Administrador" : " · Vendedor");
  buildTabs();
  renderAll();
}

function buildTabs() {
  const nav = $("#tabs");
  nav.innerHTML = "";
  TABS[user.role].forEach((t, i) => {
    const btn = el("button", "tab" + (i === 0 ? " active" : ""));
    btn.dataset.view = t.id;
    btn.append(t.label);
    if (t.id === "solicitacoes") {
      const badge = el("span", "badge hidden");
      badge.id = "tab-badge";
      btn.append(badge);
    }
    btn.addEventListener("click", () => switchView(t.id));
    nav.append(btn);
  });
  switchView(TABS[user.role][0].id);
}

function switchView(id) {
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.view === id));
  document.querySelectorAll(".view").forEach((v) =>
    v.classList.toggle("active", v.id === "view-" + id));
  renderCart(); // atualiza a barra mobile conforme a aba visível
}

function updateBadge() {
  const badge = $("#tab-badge");
  if (!badge) return;
  const n = user.role === "admin"
    ? pendingCount()
    : db.requests.filter((r) => r.seller === user.name && r.status === "pendente").length;
  badge.textContent = n;
  badge.classList.toggle("hidden", n === 0);
}

function renderAll() {
  renderPdv();
  renderCart();
  renderStock();
  renderRequests();
  renderSales();
  updateBadge();
}

/* ===== PDV ===== */

$("#pdv-search").addEventListener("input", renderPdv);

function renderPdv() {
  const q = $("#pdv-search").value.trim().toLowerCase();
  const list = $("#pdv-products");
  list.innerHTML = "";
  db.products
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((p) => {
      const inCart = cart.get(p.id) || 0;
      const left = p.qty - inCart;
      const li = el("li", "product-item" + (left <= 0 ? " out" : ""));
      const info = el("div");
      info.append(el("div", "p-name", p.name));
      info.append(el("div", "p-meta",
        `${p.category} · ${left <= 0 ? "sem estoque disponível" : left + " em estoque"}`));
      li.append(info, el("div", "p-price", fmtBRL(p.price)));
      if (left > 0) {
        li.addEventListener("click", () => {
          cart.set(p.id, inCart + 1);
          renderCart();
          renderPdv();
        });
      }
      list.append(li);
    });
}

function renderCart() {
  const list = $("#cart-items");
  list.innerHTML = "";
  let total = 0;

  cart.forEach((qty, id) => {
    const p = productById(id);
    if (!p) { cart.delete(id); return; }
    const sub = p.price * qty;
    total += sub;

    const li = el("li", "cart-item");

    const info = el("div", "c-info");
    info.append(el("div", "c-name", p.name));
    info.append(el("div", "c-unit", `${fmtBRL(p.price)} / un.`));
    const pending = pendingRequestFor(p.id);
    if (pending) {
      info.append(el("div", "pending-tag",
        `⏳ Novo preço ${fmtBRL(pending.newPrice)} aguardando autorização`));
    } else {
      const alterBtn = el("button", "link-btn", "Alterar preço (requer autorização)");
      alterBtn.addEventListener("click", () => openPriceModal(p.id));
      info.append(alterBtn);
    }

    const controls = el("div", "qty-controls");
    const minus = el("button", "qty-btn", "−");
    minus.addEventListener("click", () => {
      qty > 1 ? cart.set(id, qty - 1) : cart.delete(id);
      renderCart(); renderPdv();
    });
    const plus = el("button", "qty-btn", "+");
    plus.addEventListener("click", () => {
      if (qty < p.qty) { cart.set(id, qty + 1); renderCart(); renderPdv(); }
      else toast("Quantidade máxima em estoque atingida.", true);
    });
    controls.append(minus, el("span", "qty-val", String(qty)), plus);

    li.append(info, controls, el("div", "c-sub", fmtBRL(sub)));
    list.append(li);
  });

  $("#cart-empty").classList.toggle("hidden", cart.size > 0);
  $("#cart-total").textContent = fmtBRL(total);
  updateMobileBar(total);
}

/* Barra fixa no rodapé (telas pequenas) com o total da venda */
function updateMobileBar(total) {
  const bar = $("#mobile-cart-bar");
  const count = [...cart.values()].reduce((a, b) => a + b, 0);
  const onPdv = $("#view-pdv").classList.contains("active");
  bar.classList.toggle("hidden", count === 0 || !onPdv);
  $("#mbar-count").textContent =
    count === 1 ? "1 item na venda" : `${count} itens na venda`;
  $("#mbar-total").textContent = fmtBRL(total);
}

$("#btn-mbar").addEventListener("click", () => {
  document.querySelector(".cart-panel").scrollIntoView({ behavior: "smooth" });
});

$("#btn-clear-cart").addEventListener("click", () => {
  cart.clear();
  renderCart();
  renderPdv();
});

$("#btn-checkout").addEventListener("click", () => {
  if (cart.size === 0) return toast("Adicione produtos à venda primeiro.", true);

  // Venda com alteração de preço pendente só depois da autorização do admin.
  for (const [id] of cart) {
    const pending = pendingRequestFor(id);
    if (pending) {
      return toast(
        `Venda bloqueada: "${pending.productName}" tem alteração de preço ` +
        `aguardando autorização do administrador. 🔒`, true);
    }
  }

  const items = [];
  let total = 0;
  for (const [id, qty] of cart) {
    const p = productById(id);
    if (!p || p.qty < qty)
      return toast(`Estoque insuficiente para "${p ? p.name : "produto removido"}".`, true);
    items.push({ name: p.name, qty, price: p.price });
    total += p.price * qty;
  }
  for (const [id, qty] of cart) productById(id).qty -= qty;

  db.sales.unshift({
    id: db.nextSaleId++,
    seller: user.name,
    items,
    total,
    createdAt: new Date().toISOString(),
  });
  cart.clear();
  saveDb();
  renderAll();
  toast(`Venda finalizada: ${fmtBRL(total)} ✅`);
});

/* ===== Estoque ===== */

$("#form-product").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#prod-name").value.trim();
  const category = $("#prod-category").value;
  const price = parseFloat($("#prod-price").value);
  const qty = parseInt($("#prod-qty").value, 10);

  if (!name || !(price > 0) || !(qty > 0))
    return toast("Preencha nome, preço e quantidade válidos.", true);

  const existing = db.products.find(
    (p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.qty += qty;
    toast(`+${qty} un. somadas ao estoque de "${existing.name}".`);
  } else {
    db.products.push({ id: db.nextProductId++, name, category, price, qty });
    toast(`Produto "${name}" adicionado ao estoque.`);
  }
  saveDb();
  e.target.reset();
  $("#prod-qty").value = 1;
  renderAll();
});

$("#stock-search").addEventListener("input", renderStock);

function renderStock() {
  const q = $("#stock-search").value.trim().toLowerCase();
  const tbody = $("#stock-rows");
  tbody.innerHTML = "";

  db.products
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((p) => {
      const tr = el("tr");
      tr.append(el("td", null, p.name));

      const catTd = el("td");
      catTd.append(el("span", "chip", p.category));
      tr.append(catTd);

      tr.append(el("td", null, fmtBRL(p.price)));
      tr.append(el("td", p.qty <= LOW_STOCK ? "low" : null,
        String(p.qty) + (p.qty <= LOW_STOCK ? " ⚠️" : "")));

      const actions = el("td");
      const wrap = el("div", "row-actions");

      if (user.role !== "admin" && pendingRequestFor(p.id)) {
        wrap.append(el("span", "chip pending-chip", "⏳ Aguardando admin"));
      } else {
        const priceBtn = el("button", "btn btn-ghost btn-small",
          user.role === "admin" ? "Alterar preço" : "Solicitar novo preço");
        priceBtn.addEventListener("click", () => openPriceModal(p.id));
        wrap.append(priceBtn);
      }

      if (user.role === "admin") {
        const delBtn = el("button", "btn btn-danger btn-small", "Remover");
        delBtn.addEventListener("click", () => {
          if (!confirm(`Remover "${p.name}" do estoque?`)) return;
          db.products = db.products.filter((x) => x.id !== p.id);
          cart.delete(p.id);
          saveDb();
          renderAll();
          toast(`Produto "${p.name}" removido.`);
        });
        wrap.append(delBtn);
      }

      actions.append(wrap);
      tr.append(actions);
      tbody.append(tr);
    });
}

/* ===== Alteração de preço (com autorização) ===== */

function openPriceModal(productId) {
  const p = productById(productId);
  if (!p) return;
  if (user.role !== "admin" && pendingRequestFor(productId)) {
    return toast(`"${p.name}" já tem uma solicitação aguardando o administrador.`, true);
  }
  priceModalProductId = productId;

  $("#price-product-name").textContent = p.name;
  $("#price-current").textContent = fmtBRL(p.price);
  $("#price-new").value = "";
  $("#price-reason").value = "";
  $("#price-error").classList.add("hidden");

  // Admin altera direto; vendedor precisa de autorização.
  $("#price-auth-block").classList.toggle("hidden", user.role === "admin");
  $("#btn-price-submit").textContent =
    user.role === "admin" ? "Alterar preço" : "Enviar solicitação";

  $("#modal-price").classList.remove("hidden");
  $("#price-new").focus();
}

function closePriceModal() {
  $("#modal-price").classList.add("hidden");
  priceModalProductId = null;
}

$("#btn-price-cancel").addEventListener("click", closePriceModal);
$("#modal-price").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closePriceModal();
});

$("#btn-price-submit").addEventListener("click", () => {
  const p = productById(priceModalProductId);
  if (!p) return closePriceModal();

  const newPrice = parseFloat($("#price-new").value);
  const reason = $("#price-reason").value.trim();
  const errBox = $("#price-error");
  errBox.classList.add("hidden");

  const fail = (msg) => {
    errBox.textContent = msg;
    errBox.classList.remove("hidden");
  };

  if (!(newPrice > 0)) return fail("Informe um novo preço válido.");
  if (newPrice === p.price) return fail("O novo preço é igual ao atual.");
  if (!reason) return fail("Informe o motivo da alteração.");

  const oldPrice = p.price;

  // Administrador logado: altera direto.
  if (user.role === "admin") {
    applyPriceChange(p, newPrice);
    logRequest(p, oldPrice, newPrice, reason, "aprovada", user.name);
    closePriceModal();
    toast(`Preço de "${p.name}" atualizado para ${fmtBRL(newPrice)}.`);
    return;
  }

  // Vendedor: a solicitação vai pelo app para o administrador aprovar.
  logRequest(p, oldPrice, newPrice, reason, "pendente", null);
  closePriceModal();
  toast("Solicitação enviada ao administrador. A venda com o novo preço fica liberada após a aprovação. 🔔");
});

function applyPriceChange(product, newPrice) {
  product.price = newPrice;
  saveDb();
  renderAll();
}

function logRequest(product, oldPrice, newPrice, reason, status, approvedBy) {
  db.requests.unshift({
    id: db.nextRequestId++,
    productId: product.id,
    productName: product.name,
    oldPrice,
    newPrice,
    reason,
    seller: user.name,
    status,
    approvedBy,
    createdAt: new Date().toISOString(),
    resolvedAt: status === "pendente" ? null : new Date().toISOString(),
  });
  saveDb();
  renderAll();
}

/* ===== Lista de solicitações / autorizações ===== */

function renderRequests() {
  const list = $("#request-list");
  list.innerHTML = "";

  $("#requests-title").textContent = user && user.role === "admin"
    ? "Autorizações de alteração de preço"
    : "Minhas solicitações de alteração de preço";

  const requests = user && user.role === "admin"
    ? db.requests
    : db.requests.filter((r) => r.seller === (user && user.name));

  $("#requests-empty").classList.toggle("hidden", requests.length > 0);

  requests.forEach((r) => {
    const li = el("li", "request-item " +
      (r.status === "pendente" ? "pending" : r.status === "recusada" ? "rejected" : ""));

    const head = el("div", "r-head");
    head.append(el("strong", null, r.productName));
    head.append(el("span", "status-pill " + r.status, r.status));
    li.append(head);

    const prices = el("div", "r-prices");
    if (r.oldPrice != null) {
      prices.append(el("span", "old", fmtBRL(r.oldPrice)));
      prices.append(" → ");
    }
    prices.append(el("span", "new", fmtBRL(r.newPrice)));
    li.append(prices);

    li.append(el("div", "r-meta",
      `Motivo: ${r.reason} · Vendedor: ${r.seller} · ${fmtDate(r.createdAt)}` +
      (r.approvedBy ? ` · Autorizado por: ${r.approvedBy}` : "")));

    if (user && user.role === "admin" && r.status === "pendente") {
      const actions = el("div", "r-actions");
      const approve = el("button", "btn btn-primary btn-small", "✔ Aprovar");
      approve.addEventListener("click", () => resolveRequest(r.id, true));
      const reject = el("button", "btn btn-danger btn-small", "✖ Recusar");
      reject.addEventListener("click", () => resolveRequest(r.id, false));
      actions.append(approve, reject);
      li.append(actions);
    } else if (user && user.role !== "admin" && r.status === "pendente") {
      const actions = el("div", "r-actions");
      const cancel = el("button", "btn btn-ghost btn-small", "Cancelar solicitação");
      cancel.addEventListener("click", () => {
        db.requests = db.requests.filter((x) => x.id !== r.id);
        saveDb();
        renderAll();
        toast("Solicitação cancelada.");
      });
      actions.append(cancel);
      li.append(actions);
    }

    list.append(li);
  });
}

function resolveRequest(requestId, approved) {
  const r = db.requests.find((x) => x.id === requestId);
  if (!r || r.status !== "pendente") return;

  r.status = approved ? "aprovada" : "recusada";
  r.approvedBy = user.name;
  r.resolvedAt = new Date().toISOString();

  if (approved) {
    const p = productById(r.productId);
    if (p) p.price = r.newPrice;
  }
  saveDb();
  renderAll();
  toast(approved
    ? `Aprovado: "${r.productName}" agora custa ${fmtBRL(r.newPrice)}.`
    : `Solicitação de "${r.productName}" recusada.`);
}

/* ===== Histórico de vendas ===== */

function renderSales() {
  const list = $("#sales-list");
  list.innerHTML = "";
  $("#sales-empty").classList.toggle("hidden", db.sales.length > 0);

  db.sales.forEach((s) => {
    const li = el("li", "sale-item");
    const head = el("div", "s-head");
    head.append(el("span", null, `Venda #${s.id}`));
    head.append(el("span", "s-total", fmtBRL(s.total)));
    li.append(head);
    li.append(el("div", "s-meta", `Vendedor: ${s.seller} · ${fmtDate(s.createdAt)}`));

    const ul = el("ul");
    s.items.forEach((it) => {
      ul.append(el("li", null,
        `${it.qty}× ${it.name} — ${fmtBRL(it.price * it.qty)}`));
    });
    li.append(ul);
    list.append(li);
  });
}
