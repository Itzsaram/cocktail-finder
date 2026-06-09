let currentUser = null;

// 탭별 페이지 상태
const _p = {
    saved:          { page: 1, busy: false },
    mycocktails:    { page: 1, busy: false },
    myingredients:  { page: 1, busy: false },
    mycomments:     { page: 1, busy: false },
};

document.addEventListener('DOMContentLoaded', function () {
    initProfilePage();
});

// ── 초기화 ────────────────────────────────────────────────────

async function initProfilePage() {
    if (!await checkAuth()) return;
    await Promise.all([
        loadUserDetail(),
        loadSavedCocktails(false),
        loadMyCocktails(false),
        loadMyIngredients(false),
        loadMyComments(false)
    ]);

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    // Enter 키로 닉네임 변경
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'newNameInput') submitNameChange();
    });
}

// ── 사용자 정보 ────────────────────────────────────────────────

async function loadUserDetail() {
    try {
        const res  = await fetch('/api/user/me');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        currentUser = data.user;
        renderUserInfo(data.user);
    } catch {
        document.getElementById('loadingState').textContent = '정보를 불러오는 중 오류가 발생했습니다.';
    }
}

function renderUserInfo(user) {
    document.getElementById('profileName').textContent  = user.user_name;
    document.getElementById('profileId').textContent    = `ID: ${user.user_id}`;
    document.getElementById('profileEmail').textContent = `📧 ${user.email}`;
    document.getElementById('profileGrade').textContent = user.grade_name;
    document.getElementById('newNameInput').value       = user.user_name;
    document.title = `${user.user_name} - COCKTAIL FINDER`;
    renderAvatar(user.profile_image);
}

function renderAvatar(imagePath) {
    const el = document.getElementById('profileAvatar');
    if (!el) return;
    if (imagePath) {
        el.style.backgroundImage = `url('/static/${escapeHtml(imagePath)}')`;
        el.classList.add('has-image');
    } else {
        el.style.backgroundImage = '';
        el.classList.remove('has-image');
    }
}

async function uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB 이하여야 합니다.');
        input.value = '';
        return;
    }

    const form = new FormData();
    form.append('image', file);

    try {
        const res  = await fetch('/api/user/profile-image', { method: 'POST', body: form });
        const data = await res.json();
        if (data.success) {
            renderAvatar(data.profile_image);
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    } finally {
        input.value = '';
    }
}

// ── 닉네임 변경 ───────────────────────────────────────────────

async function submitNameChange() {
    const input   = document.getElementById('newNameInput');
    const newName = input.value.trim();
    clearNameMessages();

    if (!newName) { showNameMessage('error', '닉네임을 입력해주세요.'); return; }
    if (newName === currentUser?.user_name) { showNameMessage('error', '현재 닉네임과 동일합니다.'); return; }

    const btn = document.getElementById('nameSubmitBtn');
    btn.disabled = true;
    btn.textContent = '변경 중...';

    try {
        const res  = await fetch('/api/user/name', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_name: newName })
        });
        const data = await res.json();
        if (data.success) {
            currentUser.user_name = newName;
            document.getElementById('profileName').textContent = newName;
            showNameMessage('success', '닉네임이 변경되었습니다.');
        } else {
            showNameMessage('error', data.message);
        }
    } catch {
        showNameMessage('error', '서버 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
        btn.textContent = '변경';
    }
}

function showNameMessage(type, text) {
    const el = document.getElementById(type === 'error' ? 'nameError' : 'nameSuccess');
    el.textContent = text;
    el.classList.add('show');
}

function clearNameMessages() {
    document.getElementById('nameError').classList.remove('show');
    document.getElementById('nameSuccess').classList.remove('show');
}

// ── 관심 등록 칵테일 ──────────────────────────────────────────

async function loadSavedCocktails(append = false) {
    const state = _p.saved;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('savedCocktailList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/saved-cocktails/details?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.cocktails.length === 0) {
            list.innerHTML = '<p class="list-empty">관심 등록한 칵테일이 없습니다.</p>';
            document.getElementById('savedCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend',
                data.cocktails.map(c => renderResultCard(c)).join(''));
            const displayed = list.querySelectorAll('.result-card').length;
            document.getElementById('savedCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadSavedCocktails(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}

// ── 내 칵테일 ─────────────────────────────────────────────────

async function loadMyCocktails(append = false) {
    const state = _p.mycocktails;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('myCocktailList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/my/cocktails?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.cocktails.length === 0) {
            list.innerHTML = '<p class="list-empty">업로드한 칵테일이 없습니다.</p>';
            document.getElementById('mycocktailsCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend', data.cocktails.map(c => {
                const name = escapeHtml(c.cocktail_name);
                const cat  = escapeHtml(c.category_name);
                const ings = escapeHtml(c.ingredients) || '재료 정보 없음';
                const img  = c.image_path
                    ? `<img src="/static/${escapeHtml(c.image_path)}" alt="${name}">`
                    : '<span class="result-img-placeholder">🍹</span>';
                return `
                    <div class="my-item-row">
                        <div class="result-card my-item-card" onclick="window.location.href='/cocktail/${c.cocktail_id}'">
                            <div class="result-img">${img}</div>
                            <div class="result-info">
                                <div class="result-name">${name}</div>
                                <div class="result-category">${cat}</div>
                                <div class="result-ingredients">${ings}</div>
                            </div>
                        </div>
                        <div class="my-item-actions">
                            <button class="btn-item-edit"   onclick="event.stopPropagation(); editCocktail(${c.cocktail_id})">✏️ 수정</button>
                            <button class="btn-item-delete" onclick="event.stopPropagation(); deleteMyCocktail(${c.cocktail_id}, ${JSON.stringify(c.cocktail_name)})">🗑️ 삭제</button>
                        </div>
                    </div>`;
            }).join(''));
            const displayed = list.querySelectorAll('.my-item-row').length;
            document.getElementById('mycocktailsCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadMyCocktails(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}

function editCocktail(cocktailId) {
    window.location.href = `/cocktail/${cocktailId}`;
}

async function deleteMyCocktail(cocktailId, name) {
    if (!confirm(`"${name}" 칵테일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
        const res  = await fetch(`/api/cocktails/${cocktailId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            await loadMyCocktails(false);
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}

// ── 내 재료 ───────────────────────────────────────────────────

async function loadMyIngredients(append = false) {
    const state = _p.myingredients;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('myIngredientList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/my/ingredients?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.ingredients.length === 0) {
            list.innerHTML = '<p class="list-empty">등록한 재료가 없습니다.</p>';
            document.getElementById('myingredientsCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend', data.ingredients.map(i => {
                const name = escapeHtml(i.ingredient_name);
                return `
                    <div class="my-item-row">
                        ${renderIngCard(i, 'my-item-card')}
                        <div class="my-item-actions">
                            <button class="btn-item-edit"   onclick="event.stopPropagation(); editIngredient(${i.ingredient_id})">✏️ 수정</button>
                            <button class="btn-item-delete" onclick="event.stopPropagation(); deleteMyIngredient(${i.ingredient_id}, ${JSON.stringify(i.ingredient_name)})">🗑️ 삭제</button>
                        </div>
                    </div>`;
            }).join(''));
            const displayed = list.querySelectorAll('.my-item-row').length;
            document.getElementById('myingredientsCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadMyIngredients(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}

function editIngredient(ingredientId) {
    window.location.href = `/ingredient/${ingredientId}`;
}

async function deleteMyIngredient(ingredientId, name) {
    if (!confirm(`"${name}" 재료를 삭제하시겠습니까?\n이 재료가 포함된 칵테일 레시피에서도 제거됩니다.`)) return;
    try {
        const res  = await fetch(`/api/ingredients/${ingredientId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            await loadMyIngredients(false);
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}

// ── 내 댓글 ───────────────────────────────────────────────────

async function loadMyComments(append = false) {
    const state = _p.mycomments;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('myCommentList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/my/comments?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.comments.length === 0) {
            list.innerHTML = '<p class="list-empty">작성한 댓글이 없습니다.</p>';
            document.getElementById('mycommentsCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend', data.comments.map(c => {
                const cocktailName = escapeHtml(c.cocktail_name);
                const content      = escapeHtml(c.content);
                const time         = escapeHtml(c.created_at);
                return `
                    <div class="my-comment-item" id="my-comment-${c.comment_id}">
                        <div class="my-comment-cocktail"
                             onclick="window.location.href='/cocktail/${c.cocktail_id}'">
                            🍹 ${cocktailName}
                        </div>
                        <div class="my-comment-content">${content}</div>
                        <div class="my-comment-footer">
                            <span class="my-comment-time">${time}</span>
                            <button class="btn-item-delete"
                                    onclick="deleteMyComment(${c.comment_id}, ${c.cocktail_id})">🗑️ 삭제</button>
                        </div>
                    </div>`;
            }).join(''));
            const displayed = list.querySelectorAll('.my-comment-item').length;
            document.getElementById('mycommentsCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadMyComments(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}

async function deleteMyComment(commentId, cocktailId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
        const res  = await fetch(`/api/cocktails/${cocktailId}/comments/${commentId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            document.getElementById(`my-comment-${commentId}`)?.remove();
            adjustCountBadge('mycommentsCount', -1);
            const next = parseInt(document.getElementById('mycommentsCount').textContent.replace(/\D/g, '') || '0');
            if (next === 0) {
                document.getElementById('myCommentList').innerHTML =
                    '<p class="list-empty">작성한 댓글이 없습니다.</p>';
            }
        } else {
            alert(data.message);
        }
    } catch {
        alert('서버 오류가 발생했습니다.');
    }
}
