// 헤더 인증 버튼은 _header.html에서 서버사이드 렌더링으로 처리됨

// ── 검색 타입 탭 ──────────────────────────────────────────────
let currentSearchType = 'cocktail';   // 'cocktail' | 'ingredient'

function setSearchType(type) {
    currentSearchType = type;
    const isCocktail = type === 'cocktail';

    document.getElementById('tabCocktail').classList.toggle('active', isCocktail);
    document.getElementById('tabIngredient').classList.toggle('active', !isCocktail);
    document.getElementById('searchInput').placeholder =
        isCocktail ? '칵테일 이름 검색...' : '재료 이름 검색...';

    // 이전 결과 숨김
    document.getElementById('searchResultsSection').style.display = 'none';
    document.getElementById('searchInput').value = '';
    closeSuggestions();
}

// ── 추천 검색어 ───────────────────────────────────────────────
let suggestionDebounce = null;
let activeSuggestionIndex = -1;

async function fetchAndRenderSuggestions(q) {
    try {
        if (currentSearchType === 'ingredient') {
            if (!q) { closeSuggestions(); return; }
            const res  = await fetch(`/api/ingredients/suggestions?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            renderSuggestions(data.suggestions || [], q, 'ingredient');
        } else {
            const url = q ? `/api/cocktails/suggestions?q=${encodeURIComponent(q)}`
                          : '/api/cocktails/suggestions';
            const res  = await fetch(url);
            const data = await res.json();
            renderSuggestions(data.suggestions || [], q, 'cocktail');
        }
    } catch { closeSuggestions(); }
}

function handleSuggestionInput() {
    clearTimeout(suggestionDebounce);
    activeSuggestionIndex = -1;
    const q = document.getElementById('searchInput').value.trim();

    suggestionDebounce = setTimeout(() => fetchAndRenderSuggestions(q), 200);
}

function renderSuggestions(suggestions, q, type) {
    const dropdown = document.getElementById('suggestionDropdown');
    if (!suggestions.length) { closeSuggestions(); return; }

    const isIngredient = type === 'ingredient';
    const icon  = isIngredient ? '🧪' : '🍹';
    const getName = s => isIngredient ? s.ingredient_name : s.cocktail_name;

    const header = q ? '' : '<li class="suggestion-header">🎲 랜덤 추천</li>';
    const regex  = q ? new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi') : null;

    dropdown.innerHTML = header + suggestions.map((s, idx) => {
        const safeName = escapeHtml(getName(s));
        const display  = regex ? safeName.replace(regex, '<mark>$1</mark>') : safeName;
        const sub      = isIngredient && s.category_name
            ? ` <span class="suggestion-sub">${escapeHtml(s.category_name)}</span>`
            : '';
        return `
        <li class="suggestion-item"
            data-index="${idx}"
            data-name="${safeName}"
            onmousedown="selectSuggestion(this.dataset.name)"
            onmouseenter="setActiveSuggestion(${idx})">
            ${icon} ${display}${sub}
        </li>`;
    }).join('');
    dropdown.classList.add('open');
}

function setActiveSuggestion(idx) {
    activeSuggestionIndex = idx;
    document.querySelectorAll('.suggestion-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
    });
}

function selectSuggestion(name) {
    document.getElementById('searchInput').value = name;
    closeSuggestions();
    handleSearch();
}

function closeSuggestions() {
    const dropdown = document.getElementById('suggestionDropdown');
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    activeSuggestionIndex = -1;
}

function handleSearchKeydown(e) {
    const items = document.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('active', i === activeSuggestionIndex));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
        items.forEach((el, i) => el.classList.toggle('active', i === activeSuggestionIndex));
    } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
            items[activeSuggestionIndex].dispatchEvent(new MouseEvent('mousedown'));
        } else {
            closeSuggestions();
            handleSearch();
        }
    } else if (e.key === 'Escape') {
        closeSuggestions();
    }
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) closeSuggestions();
});

// ── 검색 기능 ─────────────────────────────────────────────────

// 페이지네이션 상태
let _cocktailSearchPage = 1;
let _cocktailSearchQ    = '';
let _cocktailSearchBusy = false;
let _ingredientSearchPage = 1;
let _ingredientSearchQ    = '';
let _ingredientSearchBusy = false;

async function handleSearch() {
    closeSuggestions();
    if (currentSearchType === 'ingredient') {
        _ingredientSearchPage = 1;
        _ingredientSearchQ    = document.getElementById('searchInput').value.trim();
        await handleIngredientSearch(false);
    } else {
        _cocktailSearchPage = 1;
        _cocktailSearchQ    = document.getElementById('searchInput').value.trim();
        await handleCocktailSearch(false);
    }
}

async function handleCocktailSearch(append = false) {
    if (_cocktailSearchBusy) return;
    _cocktailSearchBusy = true;

    const section = document.getElementById('searchResultsSection');
    const list    = document.getElementById('searchResultsList');
    const title   = document.getElementById('searchResultsTitle');

    if (!append) {
        list.innerHTML = '<p class="search-loading">검색 중...</p>';
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const q   = _cocktailSearchQ;
        const url = q
            ? `/api/cocktails/search?q=${encodeURIComponent(q)}&page=${_cocktailSearchPage}`
            : '/api/cocktails/search';
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (data.random) {
            title.textContent = `🎲 랜덤 추천 ${data.cocktails.length}개`;
            list.innerHTML = data.cocktails.map(c => renderResultCard(c)).join('');
        } else {
            if (!append) {
                title.textContent = `"${q}" 검색 결과`;
                list.innerHTML = data.cocktails.length === 0
                    ? '<p class="search-empty">검색 결과가 없습니다.</p>'
                    : data.cocktails.map(c => renderResultCard(c)).join('');
            } else {
                list.insertAdjacentHTML('beforeend',
                    data.cocktails.map(c => renderResultCard(c)).join(''));
            }
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    _cocktailSearchPage++;
                    handleCocktailSearch(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="search-empty">검색 중 오류가 발생했습니다.</p>';
    } finally {
        _cocktailSearchBusy = false;
    }
}

async function handleIngredientSearch(append = false) {
    if (_ingredientSearchBusy) return;
    _ingredientSearchBusy = true;

    const section = document.getElementById('searchResultsSection');
    const list    = document.getElementById('searchResultsList');
    const title   = document.getElementById('searchResultsTitle');

    if (!append) {
        list.innerHTML = '<p class="search-loading">검색 중...</p>';
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const q   = _ingredientSearchQ;
        const url = q
            ? `/api/ingredients/search?q=${encodeURIComponent(q)}&page=${_ingredientSearchPage}`
            : '/api/ingredients/search';
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (data.random) {
            title.textContent = `🎲 랜덤 재료 ${data.ingredients.length}개`;
            list.innerHTML = data.ingredients.map(i => renderIngredientCard(i)).join('');
        } else {
            if (!append) {
                title.textContent = `"${q}" 재료 검색 결과`;
                list.innerHTML = data.ingredients.length === 0
                    ? '<p class="search-empty">검색 결과가 없습니다.</p>'
                    : data.ingredients.map(i => renderIngredientCard(i)).join('');
            } else {
                list.insertAdjacentHTML('beforeend',
                    data.ingredients.map(i => renderIngredientCard(i)).join(''));
            }
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    _ingredientSearchPage++;
                    handleIngredientSearch(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="search-empty">검색 중 오류가 발생했습니다.</p>';
    } finally {
        _ingredientSearchBusy = false;
    }
}

// 재료 카드 HTML
function renderIngredientCard(i) {
    const name = escapeHtml(i.ingredient_name);
    const cat  = escapeHtml(i.category_name);
    const unit = escapeHtml(i.unit);
    const desc = i.description ? ' · ' + escapeHtml(i.description) : '';
    return `
        <div class="result-card ingredient-card"
             onclick="window.location.href='/ingredient/${i.ingredient_id}'">
            <div class="result-img">
                <span class="result-img-placeholder">🧪</span>
            </div>
            <div class="result-info">
                <div class="result-name">${name}</div>
                <div class="result-category">${cat}</div>
                <div class="result-ingredients">단위: ${unit}${desc}</div>
            </div>
        </div>
    `;
}

// CABINET 버튼 - 나의 재료 보관함
function handleCabinet() {
    window.location.href = '/cabinet';
}

// RANDOM COCKTAIL 버튼
function handleRandomCocktail() {
    document.getElementById('searchInput').value = '';
    handleSearch();
}

// COCKTAIL FINDER 버튼 - 고급 검색
function handleCocktailFinder() {
    window.location.href = '/cocktail-finder';
}

// UPLOAD 버튼 - 칵테일 업로드
function handleUpload() {
    window.location.href = '/upload-cocktail';
}

// 재료 업로드 버튼
function handleIngredientUpload() {
    window.location.href = '/upload-ingredient';
}

// 캐비닛 검색 버튼
function handleCabinetSearch() {
    window.location.href = '/cabinet-search';
}

// ── 인기 칵테일 ───────────────────────────────────────────────

async function loadPopularCocktails() {
    const container = document.getElementById('popularCocktailCards');
    if (!container) return;
    try {
        const res  = await fetch('/api/cocktails/popular');
        const data = await res.json();
        if (!data.success || data.cocktails.length === 0) {
            container.innerHTML = '<p class="popular-empty">아직 댓글이 달린 칵테일이 없습니다.</p>';
            return;
        }
        container.innerHTML = data.cocktails.map(c => {
            const name = escapeHtml(c.cocktail_name);
            const ings = escapeHtml(c.ingredients) || '재료 정보 없음';
            const img  = c.image_path
                ? `<img src="/static/${escapeHtml(c.image_path)}" alt="${name}" class="card-img">`
                : '<div class="card-image">🍹</div>';
            return `
                <div class="cocktail-card" onclick="window.location.href='/cocktail/${c.cocktail_id}'">
                    ${img}
                    <h3>${name}</h3>
                    <p>${ings}</p>
                    <span class="card-comment-count">💬 ${c.comment_count}</span>
                </div>
            `;
        }).join('');
    } catch {
        container.innerHTML = '<p class="popular-empty">불러오는 중 오류가 발생했습니다.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadPopularCocktails);

