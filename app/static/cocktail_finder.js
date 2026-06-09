const selectedSet = new Set();   // 선택된 ingredient_id 집합
const LIMIT = 10;                 // 한 번에 로드할 개수
let currentOffset = 0;
let totalCount = 0;
let isLoading = false;
let observer = null;

document.addEventListener('DOMContentLoaded', function () {
    initFinderPage();
});

// initCabinet() 패턴 준수
async function initFinderPage() {
    if (!await checkAuth()) return;
    await loadIngredients();
    initScrollObserver();
}

// 전체 재료 로드 (카테고리별 아코디언)
async function loadIngredients() {
    try {
        const res = await fetch('/api/ingredients');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        renderIngredients(data.categories);
    } catch (err) {
        document.getElementById('loadingState').textContent = '재료를 불러오는 중 오류가 발생했습니다.';
    }
}

// 카테고리별 아코디언 렌더링
function renderIngredients(categories) {
    const container = document.getElementById('ingredientList');
    container.innerHTML = '';

    categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';

        const catName = escapeHtml(cat.category_name);
        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span class="category-name">${catName}</span>
                <div class="category-meta">
                    <span class="cat-count-badge" >0/${cat.ingredients.length}</span>
                    <span class="accordion-toggle collapsed">▼</span>
                </div>
            </div>
            <div class="accordion-body category-body collapsed">
                <div class="category-search-bar">
                    <input type="text"
                           class="category-search-input"
                           placeholder="${catName} 재료 검색..."
                           oninput="filterIngredients(this)"
                           onclick="event.stopPropagation()">
                </div>
                <div class="ingredient-grid">
                    ${cat.ingredients.map(ing => renderIngredientItem(ing)).join('')}
                </div>
            </div>
        `;

        container.appendChild(section);
    });

    document.getElementById('loadingState').style.display = 'none';
}

function renderIngredientItem(ing) {
    const name = escapeHtml(ing.ingredient_name);
    const unit = escapeHtml(ing.unit);
    return `
        <div class="ingredient-item"
             data-id="${ing.ingredient_id}"
             onclick="toggleIngredient(this)">
            <input type="checkbox"
                   class="ingredient-checkbox"
                   onclick="event.stopPropagation(); toggleIngredient(this.closest('.ingredient-item'))">
            <span class="ingredient-name">
                ${name}
                <span class="ingredient-unit">(${unit})</span>
            </span>
        </div>
    `;
}

// 재료 선택/해제
function toggleIngredient(itemEl) {
    const id = parseInt(itemEl.dataset.id);
    const checkbox = itemEl.querySelector('.ingredient-checkbox');

    if (selectedSet.has(id)) {
        selectedSet.delete(id);
        itemEl.classList.remove('selected');
        checkbox.checked = false;
    } else {
        selectedSet.add(id);
        itemEl.classList.add('selected');
        checkbox.checked = true;
    }

    updateUI();
    updateCategoryBadge(itemEl);
}

function updateUI() {
    const count = selectedSet.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('searchBtn').disabled = count === 0;
    document.getElementById('clearBtn').style.display = count > 0 ? '' : 'none';
}

function updateCategoryBadge(itemEl) {
    const section = itemEl.closest('.category-section');
    if (!section) return;
    const all      = section.querySelectorAll('.ingredient-item').length;
    const selected = section.querySelectorAll('.ingredient-item.selected').length;
    section.querySelector('.cat-count-badge').textContent = `${selected}/${all}`;
}

// 선택 초기화
function clearSelection() {
    selectedSet.clear();
    document.querySelectorAll('.ingredient-item.selected').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.ingredient-checkbox').checked = false;
    });
    document.querySelectorAll('.cat-count-badge').forEach(badge => {
        const total = badge.closest('.category-section').querySelectorAll('.ingredient-item').length;
        badge.textContent = `0/${total}`;
    });
    updateUI();
    document.getElementById('resultsSection').style.display = 'none';
}

// normalize / filterIngredients / toggleCategory → utils.js

// ── 검색 및 무한 스크롤 ───────────────────────────────────

function startSearch() {
    currentOffset = 0;
    totalCount = 0;
    document.getElementById('resultsList').innerHTML = '';
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsTitle').textContent = '검색 중...';
    loadResults();
}

async function loadResults() {
    if (isLoading) return;
    if (currentOffset > 0 && currentOffset >= totalCount) return;

    isLoading = true;
    const loadMoreState = document.getElementById('loadMoreState');
    loadMoreState.style.display = 'block';

    const ids = [...selectedSet].join(',');

    try {
        const res  = await fetch(`/api/cocktails/finder?ingredient_ids=${ids}&offset=${currentOffset}&limit=${LIMIT}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        totalCount = data.total;
        const list = document.getElementById('resultsList');

        if (currentOffset === 0) {
            document.getElementById('resultsTitle').textContent =
                `선택한 재료로 만들 수 있는 칵테일 ${totalCount}개`;

            if (data.cocktails.length === 0) {
                list.innerHTML = '<p class="results-empty">조건에 맞는 칵테일이 없습니다.</p>';
                loadMoreState.style.display = 'none';
                isLoading = false;
                return;
            }
        }

        data.cocktails.forEach(c => {
            list.insertAdjacentHTML('beforeend', renderResultCard(c));
        });

        currentOffset += data.cocktails.length;
    } catch (err) {
        document.getElementById('resultsTitle').textContent = '검색 중 오류가 발생했습니다.';
    } finally {
        isLoading = false;
        document.getElementById('loadMoreState').style.display = 'none';
    }
}

// IntersectionObserver 무한 스크롤
function initScrollObserver() {
    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) loadResults();
    }, { rootMargin: '200px' });

    observer.observe(document.getElementById('scrollSentinel'));
}
