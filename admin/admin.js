// js/admin.js - Adicionar / Editar / Excluir produtos com localStorage, modal de confirmação e toast
// Default images (usadas no seu projeto)
const DEFAULT_IMAGE = 'https://placehold.co/60x60?text=IMG';
const CONFIRM_ICON = '/mnt/data/39decceb-60ac-468a-a15d-a1a91ab088a4.png';

// Referências DOM
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const cancelBtn = document.getElementById('cancelBtn');
const tableBody = document.getElementById('productTableBody');
const modalTitleEl = productModal.querySelector('.modal-content h3');
const formSubmitBtn = productForm.querySelector('button[type="submit"]');

// Estado
let currentEditingRow = null;
let productsCache = []; // array de produtos carregados do localStorage

// ---------- Helpers ----------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function formatPriceToDisplay(value) {
    return String(value).replace('.', ',');
}
function parsePriceInput(value) {
    if (value === undefined || value === null || value === '') return '0.00';
    const normalized = String(value).replace(',', '.');
    const n = parseFloat(normalized);
    if (Number.isNaN(n)) return '0.00';
    return n.toFixed(2);
}
function uid() { return 'p_' + Date.now() + '_' + Math.floor(Math.random() * 9000); }

// ---------- localStorage (persistência) ----------
const STORAGE_KEY = 'rp_products_v1';

function loadProductsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        productsCache = raw ? JSON.parse(raw) : [];
    } catch (e) {
        productsCache = [];
    }
    renderAllProducts();
}

function saveProductsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsCache));
}

// ---------- UI: render ---------
function renderAllProducts() {
    // Renderiza produtos do storage - limpa apenas linhas que vieram do storage (evita duplicar linhas estáticas)
    // Simples: esvazia tbody e re-renderiza todas (mais robusto).
    tableBody.innerHTML = '';
    // Se o HTML tinha linhas estáticas que quer manter, adapte; aqui reescrevemos tudo a partir do storage.
    productsCache.forEach(p => {
        const row = createProductRowElement(p);
        tableBody.appendChild(row);
    });
    // Se não houver produtos no storage e você quiser manter linhas estáticas iniciais, não limpe.
    fixInitialButtons(); // garanta classes corretas
}

function createProductRowElement({ id, name, price, imageUrl, desc }) {
    const newRow = document.createElement('tr');
    newRow.className = 'hover:bg-gray-700';
    if (id) newRow.dataset.id = id;
    newRow.innerHTML = `
    <td class="px-4 py-4 whitespace-nowrap">
      <img src="${escapeHtml(imageUrl || DEFAULT_IMAGE)}" alt="${escapeHtml(name)}" class="table-img">
    </td>
    <td class="px-4 py-4 whitespace-nowrap">${escapeHtml(name)}</td>
    <td class="px-4 py-4 whitespace-nowrap">R$ ${formatPriceToDisplay(price)}</td>
    <td class="px-4 py-4 whitespace-nowrap text-center">
      <button class="btn-edit bg-yellow-500 text-black px-3 py-1 text-sm rounded-md mr-2 transition hover:bg-yellow-400">Editar</button>
      <button class="btn-delete bg-red-600 text-white px-3 py-1 text-sm rounded-md transition hover:bg-red-500">Excluir</button>
    </td>
  `;
    if (desc) newRow.dataset.desc = desc;
    return newRow;
}

function updateRowWithValues(row, { name, price, imageUrl, desc }) {
    const img = row.querySelector('td:nth-child(1) img');
    const nameTd = row.querySelector('td:nth-child(2)');
    const priceTd = row.querySelector('td:nth-child(3)');

    if (img) img.src = imageUrl || DEFAULT_IMAGE;
    if (nameTd) nameTd.textContent = name;
    if (priceTd) priceTd.textContent = `R$ ${formatPriceToDisplay(price)}`;
    if (typeof desc !== 'undefined') row.dataset.desc = desc;
}

// ---------- Modal open/close ----------
function openModal(forEdit = false) {
    productModal.classList.remove('hidden');
    productModal.classList.add('flex');

    if (forEdit) {
        if (modalTitleEl) modalTitleEl.textContent = 'Editar Produto';
        if (formSubmitBtn) formSubmitBtn.textContent = 'Salvar Alterações';
        productForm.dataset.editing = 'true';
    } else {
        if (modalTitleEl) modalTitleEl.textContent = 'Adicionar Novo Produto';
        if (formSubmitBtn) formSubmitBtn.textContent = 'Salvar Produto';
        productForm.dataset.editing = 'false';
        productForm.reset();
    }
}
function closeModal() {
    productModal.classList.add('hidden');
    productModal.classList.remove('flex');
    productForm.dataset.editing = 'false';
    currentEditingRow = null;
}
productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeModal();
});

// ---------- Delegation & Form ----------
addProductBtn.addEventListener('click', () => {
    currentEditingRow = null;
    openModal(false);
});
cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const txt = btn.textContent.trim().toLowerCase();
    const isDelete = btn.classList.contains('btn-delete') || txt === 'excluir';
    const isEdit = btn.classList.contains('btn-edit') || txt === 'editar';
    if (isDelete) { e.preventDefault(); handleDelete(btn); }
    else if (isEdit) { e.preventDefault(); handleEdit(btn); }
});

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const imageInput = document.getElementById('productImage');
    const descInput = document.getElementById('productDesc');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = parsePriceInput(priceInput ? priceInput.value : '0');
    const imageUrl = imageInput && imageInput.value ? imageInput.value.trim() : DEFAULT_IMAGE;
    const desc = descInput ? descInput.value.trim() : '';

    if (!name) { alert('Por favor, informe o nome do produto.'); return; }

    // editar
    if (productForm.dataset.editing === 'true' && currentEditingRow) {
        const id = currentEditingRow.dataset.id;
        // update cache
        const idx = productsCache.findIndex(p => p.id === id);
        if (idx > -1) {
            productsCache[idx] = { id, name, price, imageUrl, desc };
        } else {
            // caso não exista, cria
            productsCache.push({ id, name, price, imageUrl, desc });
        }
        saveProductsToStorage();
        // update DOM
        updateRowWithValues(currentEditingRow, { name, price, imageUrl, desc });
        showToast('Produto atualizado', 'success');
        closeModal();
        return;
    }

    // adicionar novo
    const id = uid();
    const product = { id, name, price, imageUrl, desc };
    productsCache.push(product);
    saveProductsToStorage();
    const newRow = createProductRowElement(product);
    tableBody.appendChild(newRow);
    showToast('Produto adicionado', 'success');
    closeModal();
});

// ---------- Confirm modal (promise) ----------
function showConfirmModal({ title = 'Confirmar exclusão', message = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.', iconUrl = CONFIRM_ICON } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'rp-confirm-overlay';
        const box = document.createElement('div');
        box.className = 'rp-confirm-box';
        box.innerHTML = `
      <div class="rp-confirm-header">
        <img class="rp-confirm-icon" src="${escapeHtml(iconUrl)}" alt="icone">
        <div>
          <div class="rp-confirm-title">${escapeHtml(title)}</div>
        </div>
      </div>
      <div class="rp-confirm-body">${escapeHtml(message)}</div>
      <div class="rp-confirm-actions">
        <button class="rp-confirm-btn cancel">Cancelar</button>
        <button class="rp-confirm-btn confirm">Excluir</button>
      </div>
    `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const btnCancel = box.querySelector('.rp-confirm-btn.cancel');
        const btnConfirm = box.querySelector('.rp-confirm-btn.confirm');

        function cleanup() {
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
            document.removeEventListener('keydown', onKey);
            overlay.remove();
        }
        function onCancel(e) { e.preventDefault(); cleanup(); resolve(false); }
        function onConfirm(e) { e.preventDefault(); cleanup(); resolve(true); }
        function onKey(e) { if (e.key === 'Escape') onCancel(e); if (e.key === 'Enter') onConfirm(e); }

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        document.addEventListener('keydown', onKey);
        btnCancel.focus();
    });
}

// ---------- Toast ----------
function showToast(message, type = 'info', duration = 2800) {
    // container
    let container = document.querySelector('.rp-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'rp-toast-container';
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `rp-toast rp-toast-${type}`;
    t.textContent = message;
    container.appendChild(t);
    // show animation
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, duration);
}

// ---------- Handle delete/edit (com persistência) ----------
async function handleDelete(buttonEl) {
    const row = buttonEl.closest('tr');
    if (!row) return;
    const confirmed = await showConfirmModal({
        title: 'Excluir item',
        message: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
        iconUrl: CONFIRM_ICON
    });
    if (!confirmed) { showToast('Exclusão cancelada', 'info'); return; }

    // Remove do cache se tiver id
    const id = row.dataset.id;
    if (id) {
        productsCache = productsCache.filter(p => p.id !== id);
        saveProductsToStorage();
    } else {
        // fallback (não deve ocorrer se usarmos storage)
    }
    row.remove();
    showToast('Produto excluído', 'success');
}

function handleEdit(buttonEl) {
    const row = buttonEl.closest('tr');
    if (!row) return;

    // extrai valores
    const img = row.querySelector('td:nth-child(1) img');
    const nameTd = row.querySelector('td:nth-child(2)');
    const priceTd = row.querySelector('td:nth-child(3)');
    const imageUrl = img ? img.src : DEFAULT_IMAGE;
    const name = nameTd ? nameTd.textContent.trim() : '';
    let priceText = priceTd ? priceTd.textContent.replace('R$', '').trim() : '0';
    priceText = priceText.replace(',', '.');
    const desc = row.dataset.desc || '';

    // popula form
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const imageInput = document.getElementById('productImage');
    const descInput = document.getElementById('productDesc');

    if (nameInput) nameInput.value = name;
    if (priceInput) priceInput.value = priceText;
    if (imageInput) imageInput.value = imageUrl !== DEFAULT_IMAGE ? imageUrl : '';
    if (descInput) descInput.value = desc;

    // set state
    productForm.dataset.editing = 'true';
    currentEditingRow = row;
    openModal(true);
}

// ---------- Inicialização: corrige botões e carrega storage ----------
function fixInitialButtons() {
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    rows.forEach(row => {
        const btns = Array.from(row.querySelectorAll('button'));
        btns.forEach(btn => {
            const txt = btn.textContent.trim().toLowerCase();
            if (txt === 'editar') {
                btn.classList.add('btn-edit', 'bg-yellow-500', 'text-black', 'px-3', 'py-1', 'text-sm', 'rounded-md', 'mr-2', 'transition', 'hover:bg-yellow-400');
                btn.className = btn.className.replace(/\.\.\./g, '').replace(/\s+/g, ' ').trim();
            } else if (txt === 'excluir') {
                btn.classList.add('btn-delete', 'bg-red-600', 'text-white', 'px-3', 'py-1', 'text-sm', 'rounded-md', 'transition', 'hover:bg-red-500');
                btn.className = btn.className.replace(/\.\.\./g, '').replace(/\s+/g, ' ').trim();
            }
        });
    });
}

// Inicializa
fixInitialButtons();
loadProductsFromStorage();

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');

    toast.textContent = msg;

    toast.classList.remove('hidden');

    if (type === 'success') {
        toast.classList.add('bg-green-600');
        toast.classList.remove('bg-red-600');
    } else {
        toast.classList.add('bg-red-600');
        toast.classList.remove('bg-green-600');
    }

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

/* ---------------------------
  Fix de render / preserva linhas iniciais
   - evita limpar tabela quando storage está vazio
--------------------------- */

function loadProductsFromStorageSafe() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        productsCache = raw ? JSON.parse(raw) : [];
    } catch (e) {
        productsCache = [];
    }

    // Se não há produtos no storage, não sobrescreve o tbody existente (mantém linhas estáticas)
    if (!productsCache || productsCache.length === 0) {
        // ainda corrige classes dos botões existentes
        fixInitialButtons();
        return;
    }

    // Caso haja produtos no storage, renderiza-os (substitui o tbody)
    renderAllProducts();
}

// Substitua chamadas anteriores de loadProductsFromStorage() por loadProductsFromStorageSafe()
// Se você chamou loadProductsFromStorage() no final do arquivo, mude para:
loadProductsFromStorageSafe();

/* ---------------------------
  Edição inline para VENDAS (salesTableBody)
  - Edit transforma células em inputs; Save atualiza a linha; Cancel restaura.
  - Não persiste (se quiser persistência, posso integrar com backend)
--------------------------- */

(function attachSalesTableHandlers() {
    const salesTbody = document.getElementById('salesTableBody');
    if (!salesTbody) return;

    salesTbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const txt = btn.textContent.trim().toLowerCase();

        if (txt === 'editar') {
            startEditSaleRow(btn);
        } else if (txt === 'excluir') {
            // reuso do confirm modal (se tiver) ou fallback
            (async () => {
                const confirmed = typeof showConfirmModal === 'function'
                    ? await showConfirmModal({ title: 'Excluir venda', message: 'Deseja excluir esta venda?' })
                    : confirm('Deseja excluir esta venda?');

                if (confirmed) {
                    const row = btn.closest('tr');
                    if (row) row.remove();
                    // se precisar persistir, faça chamada ao backend aqui
                }
            })();
        } else if (txt === 'salvar') {
            saveEditedSale(btn);
        } else if (txt === 'cancelar') {
            cancelEditSale(btn);
        }
    });

    function startEditSaleRow(btn) {
        const row = btn.closest('tr');
        if (!row) return;
        // evita múltiplas edições
        if (row.dataset.editing === 'true') return;
        row.dataset.editing = 'true';

        // colunas: Nome | Telefone | Email | Descrição | Foto | Ações
        const cols = row.querySelectorAll('td');
        const nome = cols[0]?.textContent.trim() || '';
        const tel = cols[1]?.textContent.trim() || '';
        const email = cols[2]?.textContent.trim() || '';
        const desc = cols[3]?.textContent.trim() || '';
        const fotoImg = cols[4]?.querySelector('img');
        const fotoUrl = fotoImg ? fotoImg.src : '';

        // substitui células por inputs (mantenha classes para estilo)
        cols[0].innerHTML = `<input class="w-full p-2 rounded bg-gray-900 text-white" value="${escapeHtml(nome)}">`;
        cols[1].innerHTML = `<input class="w-full p-2 rounded bg-gray-900 text-white" value="${escapeHtml(tel)}">`;
        cols[2].innerHTML = `<input class="w-full p-2 rounded bg-gray-900 text-white" value="${escapeHtml(email)}">`;
        cols[3].innerHTML = `<input class="w-full p-2 rounded bg-gray-900 text-white" value="${escapeHtml(desc)}">`;
        cols[4].innerHTML = `<input class="w-full p-2 rounded bg-gray-900 text-white" value="${escapeHtml(fotoUrl)}">`;

        // trocar botões Ações por Salvar / Cancelar
        cols[5].innerHTML = `
      <button class="btn-save bg-green-600 text-white px-3 py-1 text-sm rounded-md mr-2">Salvar</button>
      <button class="btn-cancel bg-gray-500 text-white px-3 py-1 text-sm rounded-md">Cancelar</button>
    `;
    }

    function saveEditedSale(btn) {
        const row = btn.closest('tr');
        if (!row) return;
        const cols = row.querySelectorAll('td');

        // pega valores dos inputs
        const nome = cols[0].querySelector('input')?.value.trim() || '';
        const tel = cols[1].querySelector('input')?.value.trim() || '';
        const email = cols[2].querySelector('input')?.value.trim() || '';
        const desc = cols[3].querySelector('input')?.value.trim() || '';
        const fotoUrl = cols[4].querySelector('input')?.value.trim() || '';

        // atualiza células com texto / img
        cols[0].textContent = nome;
        cols[1].textContent = tel;
        cols[2].textContent = email;
        cols[3].textContent = desc;
        cols[4].innerHTML = fotoUrl
            ? `<img src="${escapeHtml(fotoUrl)}" alt="" class="table-img mx-auto">`
            : '';

        // restaura botões padrão
        cols[5].innerHTML = `
      <button class="btn-edit bg-yellow-500 text-black px-3 py-1 text-sm rounded-md mr-2 transition hover:bg-yellow-400">Editar</button>
      <button class="btn-delete bg-red-600 text-white px-3 py-1 text-sm rounded-md transition hover:bg-red-500">Excluir</button>
    `;

        row.dataset.editing = 'false';

        // opcional: showToast('Venda atualizada', 'success');
        if (typeof showToast === 'function') showToast('Venda atualizada', 'success');
    }

    function cancelEditSale(btn) {
        const row = btn.closest('tr');
        if (!row) return;
        const cols = row.querySelectorAll('td');

        // se tiver data-original, restaura; se não, recompondo dos valores iniciais via re-seed não temos, então apenas marca como não editando:
        // Melhor: recarregue a página ou recupere dados do backend se disponíveis.
        // Aqui vamos simplesmente recarregar a página para restaurar o estado inicial:
        window.location.reload();
    }
})();
