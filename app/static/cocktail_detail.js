let cocktailData = null;   // 원본 칵테일 데이터
let serving = 1;           // 현재 인분
let isSaved = false;       // 관심등록 여부
let isLoggedIn = false;

// 관리자용: 전체 재료 목록 { ingredient_id -> {name, unit} }
let allIngredients = [];
// 수정 모달 재료 행 목록 [{ingredient_id, name, unit, amount}]
let editIngredients = [];

document.addEventListener('DOMContentLoaded', function () {
    initDetailPage();
});

async function initDetailPage() {
    const profileRes  = await fetch('/user/profile');
    const profileData = await profileRes.json();
    isLoggedIn = profileData.success;

    // 신고 상태를 먼저 로드하여 renderDetail/renderCommentItem에서 참조 가능하게 함
    if (IS_LOGGED_IN) await loadMyReports();

    const tasks = [loadCocktailDetail(), loadComments()];
    if (isLoggedIn) {
        tasks.push(loadSavedState());
        // 수정 모달은 소유자/관리자 모두에게 열리므로, 로그인 상태라면 미리 로드
        tasks.push(loadAllIngredients(), loadCategoriesForEdit());
    }
    await Promise.all(tasks);

    // loadSavedState와 loadCocktailDetail이 모두 완료된 후 버튼 재렌더
    if (isLoggedIn) updateSaveBtn();
}

// ── 관심등록 ──────────────────────────────────────────────────

async function loadSavedState() {
    try {
        const res  = await fetch('/api/saved-cocktails');
        const data = await res.json();
        if (data.success && data.cocktail_ids.includes(COCKTAIL_ID)) isSaved = true;
    } catch {}
}

async function toggleSave() {
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    const method = isSaved ? 'DELETE' : 'POST';
    try {
        const res  = await fetch(`/api/saved-cocktails/${COCKTAIL_ID}`, { method });
        const data = await res.json();
        if (data.success) { isSaved = !isSaved; updateSaveBtn(); }
    } catch {}
}

function updateSaveBtn() {
    const btn  = document.getElementById('saveBtn');
    const icon = document.getElementById('saveIcon');
    const text = document.getElementById('saveText');
    if (isSaved) {
        btn.classList.add('saved');
        icon.textContent = '❤️';
        text.textContent = '관심등록됨';
    } else {
        btn.classList.remove('saved');
        icon.textContent = '🤍';
        text.textContent = '관심등록';
    }
}

// ── 상세 로드 / 렌더 ──────────────────────────────────────────

async function loadCocktailDetail() {
    try {
        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}`);
        const data = await res.json();
        if (!data.success) {
            document.getElementById('loadingState').textContent = '칵테일을 찾을 수 없습니다.';
            return;
        }
        cocktailData = data.cocktail;
        renderDetail();
    } catch {
        document.getElementById('loadingState').textContent = '데이터를 불러오는 중 오류가 발생했습니다.';
    }
}

function renderDetail() {
    const c = cocktailData;

    const imgWrap = document.getElementById('detailImgWrap');
    if (c.image_path) {
        imgWrap.innerHTML = `<img src="${escapeHtml(imgUrl(c.image_path))}" alt="${escapeHtml(c.cocktail_name)}">`;
    }

    document.getElementById('detailCategory').textContent = c.category_name;
    document.getElementById('detailName').textContent     = c.cocktail_name;
    const authorEl = document.getElementById('detailAuthor');
    if (c.author && c.user_id) {
        authorEl.innerHTML = `by <a class="author-link" href="/user/${encodeURIComponent(c.user_id)}">${escapeHtml(c.author)}</a>`;
    } else {
        authorEl.textContent = c.author ? `by ${c.author}` : '';
    }
    document.title = `${c.cocktail_name} - COCKTAIL FINDER`;

    updateSaveBtn();
    if (!isLoggedIn) document.getElementById('saveBtn').style.display = 'none';

    // 소유자 또는 관리자일 때 수정/삭제 버튼 표시
    const ownerActions = document.getElementById('ownerActions');
    if (ownerActions && (IS_ADMIN || (CURRENT_USER_ID && c.user_id === CURRENT_USER_ID))) {
        ownerActions.style.display = 'flex';
    }

    // 로그인 + 비소유자 + 비관리자 + 미신고 시 신고 버튼 표시
    const reportBtn = document.getElementById('cocktailReportBtn');
    if (reportBtn && IS_LOGGED_IN && !IS_ADMIN && CURRENT_USER_ID !== c.user_id
            && !isReported('cocktail', COCKTAIL_ID)) {
        reportBtn.style.display = 'inline-flex';
    }

    renderIngredients();

    const recipeSection = document.getElementById('recipeSection');
    if (c.recipe) {
        document.getElementById('recipeText').textContent = c.recipe;
    } else {
        recipeSection.style.display = 'none';
    }

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('detailContent').style.display = 'block';
}

function renderIngredients() {
    const ingredients = cocktailData.ingredients || [];
    const list = document.getElementById('ingredientList');
    list.innerHTML = ingredients.map(ing => {
        const base   = parseFloat(ing.amount);
        const scaled = isNaN(base) ? escapeHtml(ing.amount) : formatAmount(base * serving);
        return `
            <li class="ingredient-row">
                <a class="ing-name ing-name-link"
                   href="/ingredient/${ing.ingredient_id}"
                   title="${escapeHtml(ing.ingredient_name)} 상세 보기">
                    ${escapeHtml(ing.ingredient_name)}
                </a>
                <span class="ing-amount">${scaled} ${escapeHtml(ing.unit)}</span>
            </li>
        `;
    }).join('');
}

function formatAmount(n) {
    return Number.isInteger(n) ? n : parseFloat(n.toFixed(1));
}

function changeServing(delta) {
    const next = serving + delta;
    if (next < 1 || next > 20) return;
    serving = next;
    document.getElementById('servingCount').textContent = serving;
    renderIngredients();
}

// ── 관리자: 데이터 프리로드 ───────────────────────────────────

async function loadAllIngredients() {
    try {
        const res  = await fetch('/api/ingredients');
        const data = await res.json();
        if (!data.success) return;

        // 카테고리 → 재료 flat 배열로 변환
        data.categories.forEach(cat => {
            cat.ingredients.forEach(ing => allIngredients.push(ing));
        });

        // datalist 채우기
        const dl = document.getElementById('ingredientDatalist');
        if (!dl) return;
        dl.innerHTML = allIngredients.map(i =>
            `<option value="${escapeHtml(i.ingredient_name)}" data-id="${i.ingredient_id}" data-unit="${escapeHtml(i.unit)}">`
        ).join('');
    } catch {}
}

async function loadCategoriesForEdit() {
    try {
        const res  = await fetch('/api/cocktail-categories');
        const data = await res.json();
        if (!data.success) return;

        const sel = document.getElementById('editCategory');
        if (!sel) return;
        sel.innerHTML = data.categories.map(c =>
            `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`
        ).join('');
    } catch {}
}

// ── 관리자: 수정 모달 ─────────────────────────────────────────

function openEditModal() {
    if (!cocktailData) return;
    const c = cocktailData;

    document.getElementById('editName').value    = c.cocktail_name;
    document.getElementById('editRecipe').value  = c.recipe || '';
    document.getElementById('editError').classList.remove('show');
    document.getElementById('editImage').value   = '';
    document.getElementById('editImagePreview').innerHTML = c.image_path
        ? `<img src="${imgUrl(c.image_path)}" alt="현재 이미지">`
        : '';

    // 카테고리 선택
    const sel = document.getElementById('editCategory');
    if (sel) sel.value = c.category_id;

    // 재료 목록 초기화
    editIngredients = (c.ingredients || []).map(i => ({
        ingredient_id: i.ingredient_id,
        name:          i.ingredient_name,
        unit:          i.unit,
        amount:        i.amount
    }));
    renderEditIngredients();

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

// 이미지 미리보기
document.addEventListener('DOMContentLoaded', function () {
    const imgInput = document.getElementById('editImage');
    if (!imgInput) return;
    imgInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('editImagePreview').innerHTML =
                `<img src="${e.target.result}" alt="미리보기">`;
        };
        reader.readAsDataURL(file);
    });
});

// ── 재료 행 렌더링 ────────────────────────────────────────────

function renderEditIngredients() {
    const container = document.getElementById('editIngredientList');
    if (!container) return;

    container.innerHTML = editIngredients.map((ing, idx) => `
        <div class="edit-ing-row" data-idx="${idx}">
            <span class="edit-ing-name">${escapeHtml(ing.name)}</span>
            <span class="edit-ing-unit">(${escapeHtml(ing.unit)})</span>
            <input type="text"
                   class="edit-ing-amount"
                   value="${escapeHtml(ing.amount)}"
                   onchange="updateIngredientAmount(${idx}, this.value)"
                   placeholder="양">
            <button class="btn-remove-ing" onclick="removeIngredientRow(${idx})">✕</button>
        </div>
    `).join('');
}

function updateIngredientAmount(idx, value) {
    editIngredients[idx].amount = value;
}

function removeIngredientRow(idx) {
    editIngredients.splice(idx, 1);
    renderEditIngredients();
}

// 재료 추가 (datalist에서 선택)
function addIngredientRow() {
    const nameInput   = document.getElementById('addIngName');
    const amountInput = document.getElementById('addIngAmount');
    const name   = nameInput.value.trim();
    const amount = amountInput.value.trim();

    if (!name || !amount) {
        alert('재료명과 양을 모두 입력해주세요.');
        return;
    }

    // datalist에서 ingredient_id, unit 찾기
    const found = allIngredients.find(i => i.ingredient_name === name);
    if (!found) {
        alert('목록에 없는 재료입니다. 재료 검색 목록에서 선택해주세요.');
        return;
    }

    // 중복 체크
    if (editIngredients.some(i => i.ingredient_id === found.ingredient_id)) {
        alert('이미 추가된 재료입니다.');
        return;
    }

    editIngredients.push({
        ingredient_id: found.ingredient_id,
        name:          found.ingredient_name,
        unit:          found.unit,
        amount:        amount
    });
    renderEditIngredients();
    nameInput.value = '';
    amountInput.value = '';
}

// ── 수정 제출 ─────────────────────────────────────────────────

async function submitEdit() {
    const name       = document.getElementById('editName').value.trim();
    const categoryId = document.getElementById('editCategory').value;
    const recipe     = document.getElementById('editRecipe').value.trim();
    const errorEl    = document.getElementById('editError');

    errorEl.classList.remove('show');

    if (!name || !categoryId) {
        errorEl.textContent = '칵테일 이름과 카테고리는 필수입니다.';
        errorEl.classList.add('show');
        return;
    }
    if (editIngredients.length === 0) {
        errorEl.textContent = '재료를 최소 1개 이상 추가해주세요.';
        errorEl.classList.add('show');
        return;
    }

    const submitBtn = document.querySelector('.btn-modal-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    try {
        const form = new FormData();
        form.append('cocktail_name', name);
        form.append('category_id',   categoryId);
        form.append('recipe',        recipe);
        form.append('ingredients',   JSON.stringify(
            editIngredients.map(i => ({ ingredient_id: i.ingredient_id, amount: i.amount }))
        ));

        const imageFile = document.getElementById('editImage').files[0];
        if (imageFile) form.append('image', imageFile);

        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}`, {
            method: 'PUT',
            body: form
        });
        const data = await res.json();

        if (data.success) {
            closeEditModal();
            await loadCocktailDetail();   // 화면 갱신
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

// ── 댓글 ──────────────────────────────────────────────────────

async function loadComments() {
    try {
        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}/comments`);
        const data = await res.json();
        if (!data.success) return;
        renderComments(data.comments);
    } catch {}
}

function renderComments(comments) {
    const list  = document.getElementById('commentList');
    const count = document.getElementById('commentCount');
    if (!list) return;

    count.textContent = `(${comments.length})`;

    if (comments.length === 0) {
        list.innerHTML = '<p class="comment-empty">첫 번째 댓글을 남겨보세요.</p>';
        return;
    }

    list.innerHTML = comments.map(c => renderCommentItem(c)).join('');
}

function renderCommentItem(c) {
    const name      = escapeHtml(c.user_name);
    const content   = escapeHtml(c.content);
    const time      = escapeHtml(c.created_at);
    const canDelete = IS_ADMIN || (CURRENT_USER_ID && c.user_id === CURRENT_USER_ID);
    const deleteBtn = canDelete
        ? `<button class="btn-comment-delete" onclick="deleteComment(${c.comment_id})">삭제</button>`
        : '';
    // 신고 버튼: 로그인 + 비관리자 + 댓글 작성자 본인 아닌 경우 + 미신고
    const canReport = IS_LOGGED_IN && !IS_ADMIN && CURRENT_USER_ID !== c.user_id
                      && !isReported('comment', c.comment_id);
    const reportBtn = canReport
        ? `<button class="btn-report btn-report-comment" onclick="openReportModal('comment', ${c.comment_id}, this)">🚨</button>`
        : '';
    const avatar = c.profile_image
        ? `<div class="comment-avatar" style="background-image:url('${escapeHtml(imgUrl(c.profile_image))}')"></div>`
        : `<div class="comment-avatar comment-avatar--default">🍹</div>`;
    return `
        <div class="comment-item" id="comment-${c.comment_id}">
            <div class="comment-avatar-col">${avatar}</div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${name}</span>
                    <span class="comment-time">${time}</span>
                    ${deleteBtn}
                    ${reportBtn}
                </div>
                <div class="comment-content">${content}</div>
            </div>
        </div>
    `;
}

// 신고 모달 함수: utils.js의 openReportModal / closeReportModal /
// closeReportModalOutside / submitReport 사용

async function submitComment() {
    const input   = document.getElementById('commentInput');
    const content = input.value.trim();
    if (!content) return;

    const btn = document.getElementById('commentSubmitBtn');
    btn.disabled = true;

    try {
        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}/comments`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ content })
        });
        const data = await res.json();
        if (data.success) {
            input.value = '';
            document.getElementById('charCount').textContent = '0';
            // 새 댓글을 목록 하단에 추가
            const list = document.getElementById('commentList');
            const empty = list.querySelector('.comment-empty');
            if (empty) empty.remove();
            list.insertAdjacentHTML('beforeend', renderCommentItem(data));
            adjustCountBadge('commentCount', +1);
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
    }
}

async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}/comments/${commentId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            document.getElementById(`comment-${commentId}`)?.remove();
            adjustCountBadge('commentCount', -1);
            const next = parseInt(document.getElementById('commentCount').textContent.replace(/\D/g, '') || '0');
            if (next === 0) {
                document.getElementById('commentList').innerHTML =
                    '<p class="comment-empty">첫 번째 댓글을 남겨보세요.</p>';
            }
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}

// 글자 수 카운터
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('commentInput');
    if (!input) return;
    input.addEventListener('input', function () {
        document.getElementById('charCount').textContent = this.value.length;
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment();
    });
});

// ── 삭제 ──────────────────────────────────────────────────────

async function deleteCocktail() {
    if (!confirm(`"${cocktailData?.cocktail_name}" 칵테일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
        const res  = await fetch(`/api/cocktails/${COCKTAIL_ID}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            alert('칵테일이 삭제되었습니다.');
            window.location.href = '/';
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}
