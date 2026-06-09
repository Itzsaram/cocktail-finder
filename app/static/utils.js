// ============================================================
// utils.js — 공통 유틸리티
// cabinet.js / cocktail_finder.js / upload_cocktail.js / profile.js
// ingredient_detail.js / cocktail_detail.js / user_profile.js
// login.js / signup.js 공유
// ============================================================

// ── CSRF 보호: POST/PUT/PATCH/DELETE에 자동으로 X-CSRFToken 헤더 삽입 ──
(function () {
    const _origFetch = window.fetch;
    window.fetch = function (url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const token = document.querySelector('meta[name="csrf-token"]')?.content;
            if (token) {
                if (options.headers instanceof Headers) {
                    options.headers.set('X-CSRFToken', token);
                } else {
                    options.headers = Object.assign({}, options.headers, { 'X-CSRFToken': token });
                }
            }
        }
        return _origFetch.call(this, url, options);
    };
})();

// ── 뒤로가기 (히스토리 없으면 홈으로) ────────────────────────────
function goBack() {
    if (history.length > 1) history.back();
    else location.href = '/';
}

// ── 신고 상태 캐시 ────────────────────────────────────────────
const _reportedSet = new Set();

async function loadMyReports() {
    try {
        const res  = await fetch('/api/reports/my');
        const data = await res.json();
        if (data.success) {
            data.reports.forEach(r => _reportedSet.add(`${r.target_type}:${String(r.target_id)}`));
        }
    } catch {}
}

function isReported(targetType, targetId) {
    return _reportedSet.has(`${targetType}:${String(targetId)}`);
}

// ── 문자열 정규화 ─────────────────────────────────────────────
function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// ── 카테고리 내 재료 실시간 검색 필터 ─────────────────────────
function filterIngredients(inputEl) {
    const keyword = normalize(inputEl.value);
    inputEl.closest('.category-section').querySelectorAll('.ingredient-item').forEach(item => {
        const name = normalize(item.querySelector('.ingredient-name').textContent);
        item.style.display = name.includes(keyword) ? 'flex' : 'none';
    });
}

// ── 아코디언 토글 (접을 때 검색어 초기화) ──────────────────────
function toggleCategory(headerEl) {
    const section = headerEl.closest('.category-section');
    const body    = section.querySelector('.accordion-body');
    const arrow   = headerEl.querySelector('.accordion-toggle');
    const isCollapsed = body.classList.contains('collapsed');
    body.classList.toggle('collapsed', !isCollapsed);
    arrow.classList.toggle('collapsed', !isCollapsed);

    if (!isCollapsed) {
        const input = section.querySelector('.category-search-input');
        if (input) { input.value = ''; filterIngredients(input); }
    }
}

// ── 인증 공통 유틸 (login.js / signup.js 공유) ────────────────────
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// .error-message / .success-message 엘리먼트에 텍스트를 표시/숨김
function showAuthMessage(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
}

function hideAuthMessage(el) {
    if (!el) return;
    el.classList.remove('show');
}

// ── XSS 방지: HTML 이스케이프 ────────────────────────────────────
// innerHTML 삽입 전 반드시 이 함수를 통해 사용자 입력을 이스케이프할 것
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ── 로그인 확인 (default.md: 클라이언트 보호) ──────────────────
// /user/profile 호출 → 비로그인 시 /login 리다이렉트 후 null 반환
// 로그인 상태이면 profileData 객체 반환
async function checkAuth() {
    const res  = await fetch('/user/profile');
    const data = await res.json();
    if (!data.success) {
        window.location.href = '/login';
        return null;
    }
    return data;
}

// ── 카운트 뱃지 증감 헬퍼 ────────────────────────────────────────
// elementId: 뱃지 요소 ID, delta: +1 또는 -1
// "(N)" 형식을 파싱해 delta를 더한 후 재기록
function adjustCountBadge(elementId, delta) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const cur = parseInt(el.textContent.replace(/\D/g, '') || '0');
    el.textContent = `(${Math.max(0, cur + delta)})`;
}

// ── 결과 카드 HTML 생성 ────────────────────────────────────────
// c: { cocktail_id, cocktail_name, category_name, image_path, ingredients }
function renderResultCard(c) {
    const name = escapeHtml(c.cocktail_name);
    const cat  = escapeHtml(c.category_name);
    const ings = escapeHtml(c.ingredients) || '재료 정보 없음';
    const img  = c.image_path
        ? `<img src="/static/${escapeHtml(c.image_path)}" alt="${name}">`
        : '<span class="result-img-placeholder">🍹</span>';

    return `
        <div class="result-card" onclick="window.location.href='/cocktail/${c.cocktail_id}'">
            <div class="result-img">${img}</div>
            <div class="result-info">
                <div class="result-name">${name}</div>
                <div class="result-category">${cat}</div>
                <div class="result-ingredients">${ings}</div>
            </div>
        </div>
    `;
}

// ── 재료 카드 HTML 생성 ────────────────────────────────────────
// i: { ingredient_id, ingredient_name, category_name, unit, description }
// extraClass: 추가 CSS 클래스 (예: 'my-item-card')
function renderIngCard(i, extraClass = '') {
    const name = escapeHtml(i.ingredient_name);
    const cat  = escapeHtml(i.category_name);
    const unit = escapeHtml(i.unit);
    const desc = escapeHtml(i.description || '');
    const cls  = extraClass ? ` ${extraClass}` : '';
    return `
        <div class="ing-card${cls}" onclick="window.location.href='/ingredient/${i.ingredient_id}'">
            <div class="ing-card-icon">🧪</div>
            <div class="ing-card-info">
                <div class="ing-card-name">${name}</div>
                <div class="ing-card-meta">
                    <span class="ing-card-cat">${cat}</span>
                    ${unit ? `<span class="ing-card-unit">${unit}</span>` : ''}
                </div>
                ${desc ? `<div class="ing-card-desc">${desc}</div>` : ''}
            </div>
        </div>`;
}

// ── 더 보기 버튼 헬퍼 ─────────────────────────────────────────
// profile.js / user_profile.js / cabinet_search.js / script.js 공유
function appendLoadMoreBtn(listEl, onClick) {
    const btn = document.createElement('button');
    btn.className   = 'btn-load-more';
    btn.textContent = '더 보기';
    btn.onclick     = onClick;
    listEl.appendChild(btn);
}

function removeLoadMoreBtn(listEl) {
    const old = listEl.querySelector('.btn-load-more');
    if (old) old.remove();
}

// ── 탭 전환 헬퍼 ──────────────────────────────────────────────
// profile.js / user_profile.js 공유
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });
}

// ── 업로드 페이지 메시지 헬퍼 ────────────────────────────────
// upload_cocktail.js / upload_ingredient.js 공유
function showMessage(type, text) {
    const id = type === 'error' ? 'errorMessage' : 'successMessage';
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
}

function clearMessages() {
    const errEl = document.getElementById('errorMessage');
    const sucEl = document.getElementById('successMessage');
    if (errEl) errEl.classList.remove('show');
    if (sucEl) sucEl.classList.remove('show');
}

// ── 신고 모달 공통 헬퍼 ───────────────────────────────────────
// ingredient_detail.js / cocktail_detail.js / user_profile.js 공유
// btnEl: 신고 버튼 DOM 요소 (신고 완료 후 숨김 처리)
let _reportTarget = null;

function openReportModal(targetType, targetId, btnEl = null) {
    _reportTarget = { type: targetType, id: targetId, btn: btnEl };
    document.getElementById('reportReason').value = '';
    const errEl = document.getElementById('reportError');
    if (errEl) errEl.textContent = '';
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    _reportTarget = null;
}

function closeReportModalOutside(e) {
    if (e.target.id === 'reportModal') closeReportModal();
}

async function submitReport() {
    if (!_reportTarget) return;
    const reason = document.getElementById('reportReason').value;
    const errEl  = document.getElementById('reportError');
    if (!reason) { errEl.textContent = '신고 사유를 선택해주세요.'; return; }

    const btn = document.querySelector('#reportModal .btn-modal-submit');
    btn.disabled = true;
    try {
        const res  = await fetch('/api/reports', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ target_type: _reportTarget.type, target_id: _reportTarget.id, reason }),
        });
        const data = await res.json();
        if (data.success) {
            if (_reportTarget.btn) _reportTarget.btn.style.display = 'none';
            // 신고 상태 캐시 즉시 반영
            _reportedSet.add(`${_reportTarget.type}:${String(_reportTarget.id)}`);
            closeReportModal();
            alert('신고가 접수되었습니다.');
        } else {
            errEl.textContent = data.message;
        }
    } catch {
        errEl.textContent = '서버 오류가 발생했습니다.';
    } finally {
        btn.disabled = false;
    }
}
