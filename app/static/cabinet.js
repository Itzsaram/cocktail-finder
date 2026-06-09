// 사용자가 보관 중인 재료 ID 집합
const cabinetSet = new Set();

document.addEventListener('DOMContentLoaded', function () {
    initCabinet();
});

// 초기화: 로그인 확인 → 보관함 조회 → 전체 재료 조회 → 렌더링
async function initCabinet() {
    // 클라이언트 로그인 보호 (default.md: 서버+클라이언트 양쪽)
    if (!await checkAuth()) return;

    try {
        // 보관함 조회 (선택된 ingredient_id 목록)
        const cabinetRes = await fetch('/api/cabinet');
        const cabinetData = await cabinetRes.json();
        if (cabinetData.success) {
            cabinetData.ingredient_ids.forEach(id => cabinetSet.add(id));
        }

        // 전체 재료 조회 (카테고리별 그룹)
        const ingredientRes = await fetch('/api/ingredients');
        const ingredientData = await ingredientRes.json();
        if (!ingredientData.success) {
            throw new Error(ingredientData.message);
        }

        renderIngredients(ingredientData.categories);
        updateSelectedCount();

    } catch (err) {
        console.error('초기화 오류:', err);
        document.getElementById('loadingState').textContent = '재료를 불러오는 중 오류가 발생했습니다.';
    }
}

// 카테고리별 재료 렌더링
function renderIngredients(categories) {
    const container = document.getElementById('ingredientList');
    container.innerHTML = '';

    categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';

        const selectedInCat = cat.ingredients.filter(i => cabinetSet.has(i.ingredient_id)).length;

        const catName = escapeHtml(cat.category_name);
        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span class="category-name">${catName}</span>
                <div class="category-meta">
                    <span class="cat-count-badge">${selectedInCat}/${cat.ingredients.length}</span>
                    <span class="accordion-toggle">▼</span>
                </div>
            </div>
            <div class="accordion-body category-body">
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
    container.style.display = 'flex';
}

// 재료 아이템 HTML 생성
function renderIngredientItem(ing) {
    const checked = cabinetSet.has(ing.ingredient_id);
    const name    = escapeHtml(ing.ingredient_name);
    const unit    = escapeHtml(ing.unit);
    const desc    = escapeHtml(ing.description || '');
    return `
        <div class="ingredient-item ${checked ? 'selected' : ''}"
             onclick="toggleIngredient(${ing.ingredient_id}, this)">
            <input type="checkbox"
                   class="ingredient-checkbox"
                   id="ing_${ing.ingredient_id}"
                   ${checked ? 'checked' : ''}
                   onclick="event.stopPropagation(); toggleIngredient(${ing.ingredient_id}, this.closest('.ingredient-item'))">
            <div class="ingredient-info">
                <div class="ingredient-name">${name} <span class="ingredient-unit">(${unit})</span></div>
                <div class="ingredient-desc">${desc}</div>
            </div>
        </div>
    `;
}

// 재료 선택/해제 토글
async function toggleIngredient(ingredientId, itemEl) {
    const isSelected = cabinetSet.has(ingredientId);
    const checkbox = itemEl.querySelector('.ingredient-checkbox');

    try {
        const method = isSelected ? 'DELETE' : 'POST';
        const res = await fetch(`/api/cabinet/${ingredientId}`, { method });
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        if (isSelected) {
            cabinetSet.delete(ingredientId);
            itemEl.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
        } else {
            cabinetSet.add(ingredientId);
            itemEl.classList.add('selected');
            if (checkbox) checkbox.checked = true;
        }

        updateSelectedCount();
        updateCategoryBadge(itemEl);

    } catch (err) {
        console.error('보관함 업데이트 오류:', err);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 전체 선택 카운트 업데이트
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = cabinetSet.size;
}

// 카테고리 뱃지 (선택수/전체) 업데이트
function updateCategoryBadge(itemEl) {
    const section = itemEl.closest('.category-section');
    if (!section) return;

    const allItems = section.querySelectorAll('.ingredient-item');
    const selectedItems = section.querySelectorAll('.ingredient-item.selected');
    const badge = section.querySelector('.cat-count-badge');
    if (badge) {
        badge.textContent = `${selectedItems.length}/${allItems.length}`;
    }
}

// normalize / filterIngredients / toggleCategory → utils.js
