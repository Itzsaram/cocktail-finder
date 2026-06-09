let ingredientData = null;
let isInCabinet    = false;

document.addEventListener('DOMContentLoaded', function () {
    initIngredientPage();
});

async function initIngredientPage() {
    if (CURRENT_USER_ID) await loadMyReports();
    const canEdit = IS_ADMIN || CURRENT_USER_ID !== null;
    const tasks = [loadIngredientDetail()];
    if (canEdit) tasks.push(loadCategories());
    if (CURRENT_USER_ID) tasks.push(loadCabinetState());
    await Promise.all(tasks);
    if (CURRENT_USER_ID) updateCabinetBtn();
}

// ── 캐비닛 담기 ───────────────────────────────────────────────

async function loadCabinetState() {
    try {
        const res  = await fetch('/api/cabinet');
        const data = await res.json();
        if (data.success && data.ingredient_ids.includes(INGREDIENT_ID)) isInCabinet = true;
    } catch {}
}

async function toggleCabinet() {
    const btn = document.getElementById('cabinetBtn');
    btn.disabled = true;
    const method = isInCabinet ? 'DELETE' : 'POST';
    try {
        const res  = await fetch(`/api/cabinet/${INGREDIENT_ID}`, { method });
        const data = await res.json();
        if (data.success) { isInCabinet = !isInCabinet; updateCabinetBtn(); }
    } catch {} finally {
        btn.disabled = false;
    }
}

function updateCabinetBtn() {
    const btn  = document.getElementById('cabinetBtn');
    const icon = document.getElementById('cabinetIcon');
    const text = document.getElementById('cabinetText');
    if (!btn) return;
    if (isInCabinet) {
        btn.classList.add('in-cabinet');
        icon.textContent = '✅';
        text.textContent = '캐비닛에 있음';
    } else {
        btn.classList.remove('in-cabinet');
        icon.textContent = '🗄️';
        text.textContent = '캐비닛에 담기';
    }
}

// ── 상세 로드 ─────────────────────────────────────────────────

async function loadIngredientDetail() {
    try {
        const res  = await fetch(`/api/ingredients/${INGREDIENT_ID}`);
        const data = await res.json();

        if (!data.success) {
            document.getElementById('loadingState').textContent = '재료를 찾을 수 없습니다.';
            return;
        }

        ingredientData = data.ingredient;
        renderDetail();
    } catch {
        document.getElementById('loadingState').textContent = '데이터를 불러오는 중 오류가 발생했습니다.';
    }
}

function renderDetail() {
    const i = ingredientData;

    document.getElementById('ingCategory').textContent = i.category_name;
    document.getElementById('ingName').textContent     = i.ingredient_name;
    document.getElementById('ingUnit').textContent     = i.unit;
    document.getElementById('ingDesc').textContent     = i.description || '';
    document.title = `${i.ingredient_name} - COCKTAIL FINDER`;

    const authorEl = document.getElementById('ingAuthor');
    if (authorEl) {
        if (i.author && i.user_id) {
            authorEl.innerHTML = `by <a class="author-link" href="/user/${encodeURIComponent(i.user_id)}">${escapeHtml(i.author)}</a>`;
        } else {
            authorEl.textContent = '';
        }
    }

    // 사용 칵테일
    const list  = document.getElementById('cocktailList');
    const count = document.getElementById('usageCount');
    count.textContent = `(${i.cocktails.length}개)`;

    if (i.cocktails.length === 0) {
        list.innerHTML = '<p class="usage-empty">이 재료를 사용하는 칵테일이 없습니다.</p>';
    } else {
        const unitEsc = escapeHtml(ingredientData.unit);
        list.innerHTML = i.cocktails.map(c => {
            const cName = escapeHtml(c.cocktail_name);
            const cCat  = escapeHtml(c.category_name);
            const cAmt  = escapeHtml(c.amount);
            const img   = c.image_path
                ? `<img src="${escapeHtml(imgUrl(c.image_path))}" alt="${cName}">`
                : '<span class="result-img-placeholder">🍹</span>';
            return `
            <div class="result-card" onclick="window.location.href='/cocktail/${c.cocktail_id}'">
                <div class="result-img">${img}</div>
                <div class="result-info">
                    <div class="result-name">${cName}</div>
                    <div class="result-category">${cCat}</div>
                    <div class="result-ingredients">사용량: ${cAmt} ${unitEsc}</div>
                </div>
            </div>
            `;
        }).join('');
    }

    // 소유자 또는 관리자일 때 수정/삭제 버튼 표시
    const ownerActions = document.getElementById('ownerActions');
    if (ownerActions && (IS_ADMIN || (CURRENT_USER_ID && i.user_id === CURRENT_USER_ID))) {
        ownerActions.style.display = 'flex';
    }

    // 로그인 + 비소유자 + 비관리자 + 미신고 시 신고 버튼 표시
    const reportBtn = document.getElementById('ingReportBtn');
    if (reportBtn && IS_LOGGED_IN && !IS_ADMIN && CURRENT_USER_ID !== i.user_id
            && !isReported('ingredient', INGREDIENT_ID)) {
        reportBtn.style.display = 'inline-flex';
    }

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('detailContent').style.display = 'block';
}

// ── 관리자: 카테고리 로드 ──────────────────────────────────────

async function loadCategories() {
    try {
        const res  = await fetch('/api/ingredient-categories');
        const data = await res.json();
        if (!data.success) return;

        const sel = document.getElementById('editCategory');
        if (!sel) return;
        sel.innerHTML = data.categories.map(c =>
            `<option value="${c.ingredient_category_id}">${escapeHtml(c.category_name)}</option>`
        ).join('');
    } catch {}
}

// ── 관리자: 수정 모달 ─────────────────────────────────────────

function openEditModal() {
    if (!ingredientData) return;
    const i = ingredientData;

    document.getElementById('editName').value  = i.ingredient_name;
    document.getElementById('editUnit').value  = i.unit;
    document.getElementById('editDesc').value  = i.description || '';
    document.getElementById('editError').classList.remove('show');

    const sel = document.getElementById('editCategory');
    if (sel) sel.value = i.ingredient_category_id;

    document.getElementById('editModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
    document.body.style.overflow = '';
}

function closeEditModalOutside(e) {
    if (e.target === document.getElementById('editModal')) closeEditModal();
}

async function submitEdit() {
    const name        = document.getElementById('editName').value.trim();
    const categoryId  = document.getElementById('editCategory').value;
    const unit        = document.getElementById('editUnit').value;
    const description = document.getElementById('editDesc').value.trim();
    const errorEl     = document.getElementById('editError');

    errorEl.classList.remove('show');

    if (!name || !categoryId || !unit) {
        errorEl.textContent = '재료명, 카테고리, 단위는 필수입니다.';
        errorEl.classList.add('show');
        return;
    }

    const submitBtn = document.querySelector('.btn-modal-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    try {
        const res  = await fetch(`/api/ingredients/${INGREDIENT_ID}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ingredient_name:        name,
                ingredient_category_id: parseInt(categoryId),
                unit:                   unit,
                description:            description
            })
        });
        const data = await res.json();

        if (data.success) {
            closeEditModal();
            await loadIngredientDetail();   // 화면 갱신
        } else {
            errorEl.textContent = data.message;
            errorEl.classList.add('show');
        }
    } catch {
        errorEl.textContent = '서버 오류가 발생했습니다.';
        errorEl.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '저장';
    }
}

// ── 관리자: 삭제 ──────────────────────────────────────────────

async function deleteIngredient() {
    if (!confirm(`"${ingredientData?.ingredient_name}" 재료를 삭제하시겠습니까?\n이 재료가 포함된 칵테일 레시피에서도 제거됩니다.`)) return;

    try {
        const res  = await fetch(`/api/ingredients/${INGREDIENT_ID}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            alert('재료가 삭제되었습니다.');
            window.location.href = '/';
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}
