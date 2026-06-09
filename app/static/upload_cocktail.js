// 선택된 재료: { ingredient_id -> { name, unit, amount } }
const selectedIngredients = new Map();

document.addEventListener('DOMContentLoaded', function () {
    initUploadCocktail();
});

// initCabinet() 패턴 준수: /user/profile → 데이터 로드
async function initUploadCocktail() {
    if (!await checkAuth()) return;

    await Promise.all([
        loadCocktailCategories(),
        loadIngredients()
    ]);

    document.getElementById('uploadForm').addEventListener('submit', handleSubmit);
}

// 칵테일 카테고리 로드
async function loadCocktailCategories() {
    try {
        const res = await fetch('/api/cocktail-categories');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const select = document.getElementById('categorySelect');
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            select.appendChild(option);
        });
    } catch (err) {
        showMessage('error', '카테고리를 불러오는 중 오류가 발생했습니다.');
    }
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

        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span class="category-name">${cat.category_name}</span>
                <div class="category-meta">
                    <span class="cat-count-badge" data-cat-id="${cat.category_id}">0/${cat.ingredients.length}</span>
                    <span class="accordion-toggle collapsed">▼</span>
                </div>
            </div>
            <div class="accordion-body category-body collapsed">
                <div class="category-search-bar">
                    <input type="text"
                           class="category-search-input"
                           placeholder="${cat.category_name} 재료 검색..."
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
}

// 재료 아이템 HTML
function renderIngredientItem(ing) {
    const name = escapeHtml(ing.ingredient_name);
    const unit = escapeHtml(ing.unit);
    return `
        <div class="ingredient-item"
             data-id="${ing.ingredient_id}"
             data-name="${name}"
             data-unit="${unit}"
             onclick="toggleIngredient(this)">
            <div class="ingredient-item-top">
                <input type="checkbox"
                       class="ingredient-checkbox"
                       onclick="event.stopPropagation(); toggleIngredient(this.closest('.ingredient-item'))">
                <span class="ingredient-name">
                    ${name}
                    <span class="ingredient-unit">(${unit})</span>
                </span>
            </div>
            <div class="amount-row">
                <span class="amount-label">양:</span>
                <input type="text"
                       class="amount-input"
                       inputmode="decimal"
                       placeholder="예) 45 또는 1.5"
                       onclick="event.stopPropagation()"
                       oninput="updateAmount(${ing.ingredient_id}, this)">
                <span class="amount-unit-badge">${unit}</span>
            </div>
        </div>
    `;
}

// 재료 선택/해제 토글
function toggleIngredient(itemEl) {
    const id = parseInt(itemEl.dataset.id);
    const name = itemEl.dataset.name;
    const unit = itemEl.dataset.unit;
    const checkbox = itemEl.querySelector('.ingredient-checkbox');

    if (selectedIngredients.has(id)) {
        selectedIngredients.delete(id);
        itemEl.classList.remove('selected');
        checkbox.checked = false;
        itemEl.querySelector('.amount-input').value = '';
    } else {
        selectedIngredients.set(id, { ingredient_id: id, name, unit, amount: '' });
        itemEl.classList.add('selected');
        checkbox.checked = true;
        itemEl.querySelector('.amount-input').focus();
    }

    updateSelectedCount();
    updateCategoryBadge(itemEl);
}

// 숫자(양수 float)만 허용하는 실시간 필터
function sanitizeAmountInput(el) {
    let v = el.value;

    // 숫자와 소수점만 허용
    v = v.replace(/[^0-9.]/g, '');

    // 소수점이 2개 이상이면 첫 번째 이후 제거
    const dotIdx = v.indexOf('.');
    if (dotIdx !== -1) {
        v = v.slice(0, dotIdx + 1) + v.slice(dotIdx + 1).replace(/\./g, '');
    }

    // 커서 위치 보존 후 값 적용
    const cursor = el.selectionStart - (el.value.length - v.length);
    el.value = v;
    el.setSelectionRange(Math.max(0, cursor), Math.max(0, cursor));

    return v;
}

// 양 업데이트 (el: input 엘리먼트)
function updateAmount(ingredientId, el) {
    const value = sanitizeAmountInput(el);
    const num   = parseFloat(value);
    const valid = value === '' || (!isNaN(num) && num > 0);

    el.classList.toggle('amount-error', value !== '' && !valid);

    if (selectedIngredients.has(ingredientId)) {
        selectedIngredients.get(ingredientId).amount = value;
    }
}

// 선택 카운트 업데이트
function updateSelectedCount() {
    document.getElementById('selectedIngredientCount').textContent = selectedIngredients.size;
}

// 카테고리 뱃지 업데이트
function updateCategoryBadge(itemEl) {
    const section = itemEl.closest('.category-section');
    if (!section) return;
    const allItems = section.querySelectorAll('.ingredient-item');
    const selectedItems = section.querySelectorAll('.ingredient-item.selected');
    const badge = section.querySelector('.cat-count-badge');
    if (badge) badge.textContent = `${selectedItems.length}/${allItems.length}`;
}

// normalize / filterIngredients / toggleCategory → utils.js

// 이미지 미리보기
function handleImageChange(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById('imagePreview');
    const wrapper = document.getElementById('imagePreviewWrapper');
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.add('visible');
        wrapper.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// 폼 제출
async function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    const name = document.getElementById('cocktailName').value.trim();
    const categoryId = document.getElementById('categorySelect').value;
    const recipe = document.getElementById('recipe').value.trim();

    if (!name || !categoryId) {
        showMessage('error', '칵테일 이름과 카테고리는 필수입니다.');
        return;
    }

    if (selectedIngredients.size === 0) {
        showMessage('error', '재료를 최소 1개 이상 선택해주세요.');
        return;
    }

    // 양 유효성 검사 (미입력 or 0 이하 or 숫자 아님)
    const invalidAmount = [...selectedIngredients.values()].find(ing => {
        const num = parseFloat(ing.amount);
        return !ing.amount || isNaN(num) || num <= 0;
    });
    if (invalidAmount) {
        showMessage('error', `"${invalidAmount.name}"의 양을 올바르게 입력해주세요. (0보다 큰 숫자)`);
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';

    try {
        const formData = new FormData();
        formData.append('cocktail_name', name);
        formData.append('category_id', categoryId);
        formData.append('recipe', recipe);
        formData.append('ingredients', JSON.stringify(
            [...selectedIngredients.values()].map(ing => ({
                ingredient_id: ing.ingredient_id,
                amount: ing.amount
            }))
        ));

        const imageFile = document.getElementById('imageInput').files[0];
        if (imageFile) formData.append('image', imageFile);

        const res = await fetch('/api/cocktails', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showMessage('success', data.message);
            document.getElementById('uploadForm').reset();
            selectedIngredients.clear();
            updateSelectedCount();
            // 이미지 미리보기 초기화
            document.getElementById('imagePreview').classList.remove('visible');
            document.getElementById('imagePreviewWrapper').style.display = '';
            // 선택 상태 초기화
            document.querySelectorAll('.ingredient-item.selected').forEach(el => {
                el.classList.remove('selected');
                el.querySelector('.ingredient-checkbox').checked = false;
                el.querySelector('.amount-input').value = '';
            });
            document.querySelectorAll('.cat-count-badge').forEach(badge => {
                const total = badge.closest('.category-section').querySelectorAll('.ingredient-item').length;
                badge.textContent = `0/${total}`;
            });
        } else {
            showMessage('error', data.message);
        }
    } catch (err) {
        showMessage('error', '서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '칵테일 등록';
    }
}

// showMessage / clearMessages → utils.js
