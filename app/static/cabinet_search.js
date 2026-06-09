let extraIngredient = null;   // { ingredient_id, ingredient_name }
let dualDebounce    = null;

// makeable / almost 독립 페이지 상태
const _cs = {
    makeable: { page: 1, busy: false },
    almost:   { page: 1, busy: false },
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    runSearch();
});

// ── 검색 실행 (필터 변경 시 항상 page 1 초기화) ───────────────

async function runSearch() {
    _cs.makeable.page = 1;
    _cs.almost.page   = 1;

    const list = document.getElementById('resultsList');
    list.innerHTML = '<div class="loading-state">검색 중...</div>';

    try {
        const url = extraIngredient
            ? `/api/cocktails/cabinet-search?extra_id=${extraIngredient.ingredient_id}`
            : '/api/cocktails/cabinet-search';
        const res  = await fetch(url);
        const data = await res.json();

        if (!data.success) {
            list.innerHTML = '<p class="results-empty">검색 중 오류가 발생했습니다.</p>';
            return;
        }

        renderCabinetChips(data.cabinet_ingredients || []);
        renderResults(data);
    } catch {
        document.getElementById('resultsList').innerHTML =
            '<p class="results-empty">검색 중 오류가 발생했습니다.</p>';
    }
}

// ── 더 보기: makeable ─────────────────────────────────────────

async function loadMoreMakeable() {
    if (_cs.makeable.busy) return;
    _cs.makeable.busy = true;

    const section = document.getElementById('makeableList');
    const btn     = section?.querySelector('.btn-load-more');
    if (btn) btn.disabled = true;

    try {
        const params = new URLSearchParams({ makeable_page: _cs.makeable.page });
        if (extraIngredient) params.set('extra_id', extraIngredient.ingredient_id);
        const res  = await fetch(`/api/cocktails/cabinet-search?${params}`);
        const data = await res.json();
        if (!data.success) return;

        if (btn) btn.remove();
        section.insertAdjacentHTML('beforeend',
            data.makeable.map(c => renderResultCard(c)).join(''));

        if (data.makeable_more) {
            appendLoadMoreBtn(section, () => {
                _cs.makeable.page++;
                loadMoreMakeable();
            });
        }
    } finally {
        _cs.makeable.busy = false;
    }
}

// ── 더 보기: almost ───────────────────────────────────────────

async function loadMoreAlmost() {
    if (_cs.almost.busy) return;
    _cs.almost.busy = true;

    const section = document.getElementById('almostList');
    const btn     = section?.querySelector('.btn-load-more');
    if (btn) btn.disabled = true;

    try {
        const params = new URLSearchParams({ almost_page: _cs.almost.page });
        if (extraIngredient) params.set('extra_id', extraIngredient.ingredient_id);
        const res  = await fetch(`/api/cocktails/cabinet-search?${params}`);
        const data = await res.json();
        if (!data.success) return;

        if (btn) btn.remove();
        section.insertAdjacentHTML('beforeend',
            data.almost.map(c => renderAlmostCard(c)).join(''));

        if (data.almost_more) {
            appendLoadMoreBtn(section, () => {
                _cs.almost.page++;
                loadMoreAlmost();
            });
        }
    } finally {
        _cs.almost.busy = false;
    }
}

// ── 캐비닛 재료 칩 렌더링 ─────────────────────────────────────

function renderCabinetChips(ingredients) {
    const chips  = document.getElementById('cabinetChips');
    const badge  = document.getElementById('cabinetCountBadge');

    badge.textContent = `${ingredients.length}가지`;

    if (!ingredients.length) {
        chips.innerHTML =
            '<span class="cabinet-chip-placeholder">캐비닛이 비어있습니다. 재료를 추가해보세요.</span>';
        return;
    }
    chips.innerHTML = ingredients
        .map(i => `<span class="cabinet-chip">${escapeHtml(i.ingredient_name)}</span>`)
        .join('');
}

// ── 결과 렌더링 (page 1 전체 구조) ───────────────────────────

function renderResults(data) {
    const { makeable, makeable_more, almost, almost_more } = data;
    const list = document.getElementById('resultsList');

    const filterLabel = extraIngredient
        ? `<span class="dual-active-badge">🧪 ${escapeHtml(extraIngredient.ingredient_name)} 포함</span>`
        : '';

    let html = `
        <div class="cs-section">
            <div class="cs-section-header cs-header--ok">
                ✅ 지금 바로 만들 수 있어요 ${filterLabel}
                <span class="cs-count">${makeable.length}${makeable_more ? '+' : ''}개</span>
            </div>
            <div id="makeableList">`;

    if (makeable.length === 0) {
        html += '<p class="results-empty" style="padding:20px 0">현재 캐비닛 재료로 만들 수 있는 칵테일이 없습니다.</p>';
    } else {
        html += makeable.map(c => renderResultCard(c)).join('');
    }
    html += '</div></div>';

    html += `
        <div class="cs-section">
            <div class="cs-section-header cs-header--almost">
                🔸 재료 1가지만 더 있으면 만들 수 있어요 ${filterLabel}
                <span class="cs-count">${almost.length}${almost_more ? '+' : ''}개</span>
            </div>
            <div id="almostList">`;

    if (almost.length === 0) {
        html += '<p class="results-empty" style="padding:20px 0">해당 조건의 칵테일이 없습니다.</p>';
    } else {
        html += almost.map(c => renderAlmostCard(c)).join('');
    }
    html += '</div></div>';

    list.innerHTML = html;

    // 더 보기 버튼 삽입 (page=1 기준으로 렌더됨, 버튼 클릭 시 page++ 후 요청)
    if (makeable_more) {
        _cs.makeable.page = 1;
        appendLoadMoreBtn(document.getElementById('makeableList'), () => {
            _cs.makeable.page++;
            loadMoreMakeable();
        });
    }
    if (almost_more) {
        _cs.almost.page = 1;
        appendLoadMoreBtn(document.getElementById('almostList'), () => {
            _cs.almost.page++;
            loadMoreAlmost();
        });
    }
}

function renderAlmostCard(c) {
    const name = escapeHtml(c.cocktail_name);
    const cat  = escapeHtml(c.category_name);
    const ings = escapeHtml(c.ingredients) || '재료 정보 없음';
    const miss = escapeHtml(c.missing_ingredient || '');
    const img  = c.image_path
        ? `<img src="${escapeHtml(imgUrl(c.image_path))}" alt="${name}">`
        : '<span class="result-img-placeholder">🍹</span>';
    return `
        <div class="result-card" onclick="window.location.href='/cocktail/${c.cocktail_id}'">
            <div class="result-img">${img}</div>
            <div class="result-info">
                <div class="result-name">${name}</div>
                <div class="result-category">${cat}</div>
                <div class="result-ingredients">${ings}</div>
                <div class="missing-badge">+ ${miss} 필요</div>
            </div>
        </div>`;
}

// ── 이중검색 자동완성 ─────────────────────────────────────────

async function handleDualInput() {
    clearTimeout(dualDebounce);
    const q = document.getElementById('dualSearchInput').value.trim();
    if (!q) { closeDualDropdown(); return; }

    dualDebounce = setTimeout(async () => {
        try {
            const res  = await fetch(`/api/ingredients/suggestions?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            renderDualDropdown(data.suggestions || []);
        } catch { closeDualDropdown(); }
    }, 200);
}

function renderDualDropdown(suggestions) {
    const dropdown = document.getElementById('dualDropdown');
    if (!suggestions.length) { closeDualDropdown(); return; }
    dropdown.innerHTML = suggestions.map(s => `
        <li class="suggestion-item"
            onmousedown="selectDualIngredient(${s.ingredient_id}, ${JSON.stringify(s.ingredient_name)})">
            🧪 ${escapeHtml(s.ingredient_name)}
            <span class="suggestion-sub">${escapeHtml(s.category_name || '')}</span>
        </li>`).join('');
    dropdown.classList.add('open');
}

function selectDualIngredient(id, name) {
    extraIngredient = { ingredient_id: id, ingredient_name: name };
    document.getElementById('dualSearchInput').value = name;
    document.getElementById('dualClearBtn').style.display = '';
    closeDualDropdown();
    runSearch();
}

function clearDualSearch() {
    extraIngredient = null;
    document.getElementById('dualSearchInput').value = '';
    document.getElementById('dualClearBtn').style.display = 'none';
    closeDualDropdown();
    runSearch();
}

function closeDualDropdown() {
    const dropdown = document.getElementById('dualDropdown');
    if (dropdown) { dropdown.classList.remove('open'); dropdown.innerHTML = ''; }
}

document.addEventListener('click', e => {
    if (!e.target.closest('.dual-search-wrap')) closeDualDropdown();
});
