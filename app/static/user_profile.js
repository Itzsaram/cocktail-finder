// ============================================================
// user_profile.js — 공개 사용자 프로필 페이지
// 비로그인 접근 가능 (auth 불필요)
// ============================================================

const _up = {
    cocktails:   { page: 1, busy: false },
    ingredients: { page: 1, busy: false },
};

document.addEventListener('DOMContentLoaded', initUserProfilePage);

async function initUserProfilePage() {
    // 신고 상태 먼저 로드 (renderUserInfo에서 참조)
    if (CURRENT_USER_ID) await loadMyReports();
    await Promise.all([
        loadUserInfo(),
        loadUserCocktails(false),
        loadUserIngredients(false)
    ]);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';
}

// ── 사용자 정보 ────────────────────────────────────────────────

async function loadUserInfo() {
    try {
        const res  = await fetch(`/api/users/${TARGET_USER_ID}/public`);
        const data = await res.json();
        if (!data.success) {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('notFound').style.display = 'block';
            return;
        }
        renderUserInfo(data.user);
    } catch {
        document.getElementById('loadingState').textContent = '정보를 불러오는 중 오류가 발생했습니다.';
    }
}

function renderUserInfo(u) {
    const avatar = document.getElementById('profileAvatar');
    if (u.profile_image) {
        avatar.style.backgroundImage = `url('${escapeHtml(imgUrl(u.profile_image))}')`;
        avatar.classList.add('has-image');
    }

    document.getElementById('profileName').textContent  = u.user_name;
    document.getElementById('profileId').textContent    = `@${u.user_id}`;
    document.getElementById('profileGrade').textContent = u.grade_name;
    document.getElementById('profileStats').innerHTML =
        `칵테일 <strong>${u.cocktail_count}</strong>개 &nbsp;·&nbsp; 재료 <strong>${u.ingredient_count}</strong>개`;

    // 로그인 + 타인 프로필 + 비관리자 + 대상이 admin 아님 + 미신고 → 신고 버튼 표시
    const reportBtn = document.getElementById('userReportBtn');
    if (reportBtn && CURRENT_USER_ID && !IS_ADMIN
            && CURRENT_USER_ID !== TARGET_USER_ID
            && u.grade_name !== 'admin'
            && !isReported('user', TARGET_USER_ID)) {
        reportBtn.style.display = 'inline-flex';
    }
}

// ── 칵테일 목록 ────────────────────────────────────────────────

async function loadUserCocktails(append = false) {
    const state = _up.cocktails;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('cocktailList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/users/${TARGET_USER_ID}/cocktails?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.cocktails.length === 0) {
            list.innerHTML = '<p class="list-empty">업로드한 칵테일이 없습니다.</p>';
            document.getElementById('cocktailsCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend', data.cocktails.map(c => renderResultCard(c)).join(''));
            const displayed = list.querySelectorAll('.result-card').length;
            document.getElementById('cocktailsCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadUserCocktails(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}

// ── 재료 목록 ─────────────────────────────────────────────────

async function loadUserIngredients(append = false) {
    const state = _up.ingredients;
    if (state.busy) return;
    state.busy = true;

    const list = document.getElementById('ingredientList');
    if (!append) {
        state.page = 1;
        list.innerHTML = '';
    } else {
        removeLoadMoreBtn(list);
    }

    try {
        const res  = await fetch(`/api/users/${TARGET_USER_ID}/ingredients?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append && data.ingredients.length === 0) {
            list.innerHTML = '<p class="list-empty">등록한 재료가 없습니다.</p>';
            document.getElementById('ingredientsCount').textContent = '(0)';
        } else {
            list.insertAdjacentHTML('beforeend', data.ingredients.map(i => renderIngCard(i)).join(''));
            const displayed = list.querySelectorAll('.ing-card').length;
            document.getElementById('ingredientsCount').textContent = `(${displayed}${data.has_more ? '+' : ''})`;
            if (data.has_more) {
                appendLoadMoreBtn(list, () => {
                    state.page++;
                    loadUserIngredients(true);
                });
            }
        }
    } catch {
        if (!append) list.innerHTML = '<p class="list-empty">불러오는 중 오류가 발생했습니다.</p>';
    } finally {
        state.busy = false;
    }
}
