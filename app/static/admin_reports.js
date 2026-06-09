// ============================================================
// admin_reports.js — 신고 관리 페이지 (관리자 전용)
// ============================================================

const _ar = {
    pending:  { page: 1, busy: false },
    resolved: { page: 1, busy: false },
};

let _resolveTarget = null;  // 처리 중인 report_id

const TARGET_TYPE_LABELS = {
    cocktail:   '칵테일',
    ingredient: '재료',
    comment:    '댓글',
    user:       '사용자',
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    loadPending(false);
});

// ── 탭 전환 ───────────────────────────────────────────────────

function switchReportTab(tab) {
    const isPending = tab === 'pending';
    document.getElementById('tabPending').classList.toggle('active', isPending);
    document.getElementById('tabResolved').classList.toggle('active', !isPending);
    document.getElementById('panelPending').style.display  = isPending ? '' : 'none';
    document.getElementById('panelResolved').style.display = isPending ? 'none' : '';

    // 처음 전환 시 로드
    if (!isPending && _ar.resolved.page === 1) {
        loadResolved(false);
    }
}

// ── 미처리 신고 로드 ──────────────────────────────────────────

async function loadPending(append = false) {
    const state = _ar.pending;
    if (state.busy) return;
    state.busy = true;

    const container = document.getElementById('pendingList');
    if (!append) {
        state.page = 1;
        container.innerHTML = '<div class="loading-state">불러오는 중...</div>';
    } else {
        removeLoadMoreBtn(container);
    }

    try {
        const res  = await fetch(`/api/admin/reports?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append) container.innerHTML = '';

        if (!append && data.reports.length === 0) {
            container.innerHTML = '<div class="report-empty">미처리 신고가 없습니다.</div>';
            document.getElementById('pendingBadge').textContent = '';
        } else {
            renderPendingTable(data.reports, append);
            if (!append) {
                document.getElementById('pendingBadge').textContent = `(${data.reports.length}${data.has_more ? '+' : ''})`;
            }
            if (data.has_more) {
                appendLoadMoreBtn(container, () => {
                    state.page++;
                    loadPending(true);
                });
            }
        }
    } catch (e) {
        if (!append) container.innerHTML = `<div class="report-empty">오류: ${escapeHtml(e.message)}</div>`;
    } finally {
        state.busy = false;
    }
}

function renderPendingTable(reports, append) {
    const container = document.getElementById('pendingList');

    // 기존 테이블이 없으면 생성
    let table = container.querySelector('.report-table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'report-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>대상</th>
                    <th>대상 ID</th>
                    <th>사유</th>
                    <th>신고자</th>
                    <th>신고일시</th>
                    <th>처리</th>
                </tr>
            </thead>
            <tbody id="pendingTbody"></tbody>`;
        container.prepend(table);
    }

    const tbody = document.getElementById('pendingTbody');
    reports.forEach(r => {
        const tr = document.createElement('tr');
        tr.id = `pending-row-${r.report_id}`;
        tr.innerHTML = `
            <td>${r.report_id}</td>
            <td><span class="target-badge target-${r.target_type}">${escapeHtml(TARGET_TYPE_LABELS[r.target_type] || r.target_type)}</span></td>
            <td>${makeTargetLink(r.target_type, r.target_id)}</td>
            <td>${escapeHtml(r.reason_label)}</td>
            <td>${escapeHtml(r.reporter_name)} <span class="reporter-id">(${escapeHtml(r.reporter_id)})</span></td>
            <td>${escapeHtml(r.created_at)}</td>
            <td><button class="btn-resolve" onclick="openResolveModal(${r.report_id}, ${escapeHtml(JSON.stringify(r.target_type))}, ${escapeHtml(JSON.stringify(String(r.target_id)))}, ${escapeHtml(JSON.stringify(r.reason_label))})">처리</button></td>`;
        tbody.appendChild(tr);
    });
}

// ── 처리된 신고 로드 ──────────────────────────────────────────

async function loadResolved(append = false) {
    const state = _ar.resolved;
    if (state.busy) return;
    state.busy = true;

    const container = document.getElementById('resolvedList');
    if (!append) {
        state.page = 1;
        container.innerHTML = '<div class="loading-state">불러오는 중...</div>';
    } else {
        removeLoadMoreBtn(container);
    }

    try {
        const res  = await fetch(`/api/admin/reports/resolved?page=${state.page}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        if (!append) container.innerHTML = '';

        if (!append && data.reports.length === 0) {
            container.innerHTML = '<div class="report-empty">처리된 신고가 없습니다.</div>';
        } else {
            renderResolvedTable(data.reports, append);
            if (data.has_more) {
                appendLoadMoreBtn(container, () => {
                    state.page++;
                    loadResolved(true);
                });
            }
        }
    } catch (e) {
        if (!append) container.innerHTML = `<div class="report-empty">오류: ${escapeHtml(e.message)}</div>`;
    } finally {
        state.busy = false;
    }
}

function renderResolvedTable(reports, append) {
    const container = document.getElementById('resolvedList');

    let table = container.querySelector('.report-table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'report-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>대상</th>
                    <th>대상 ID</th>
                    <th>사유</th>
                    <th>신고자</th>
                    <th>신고일시</th>
                    <th>처리 방식</th>
                    <th>처리자</th>
                    <th>처리일시</th>
                </tr>
            </thead>
            <tbody id="resolvedTbody"></tbody>`;
        container.prepend(table);
    }

    const tbody = document.getElementById('resolvedTbody');
    reports.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.report_id}</td>
            <td><span class="target-badge target-${r.target_type}">${escapeHtml(TARGET_TYPE_LABELS[r.target_type] || r.target_type)}</span></td>
            <td>${makeTargetLink(r.target_type, r.target_id)}</td>
            <td>${escapeHtml(r.reason_label)}</td>
            <td>${escapeHtml(r.reporter_name)} <span class="reporter-id">(${escapeHtml(r.reporter_id)})</span></td>
            <td>${escapeHtml(r.created_at)}</td>
            <td><span class="action-badge action-${r.action_taken}">${escapeHtml(r.action_label)}</span></td>
            <td>${escapeHtml(r.resolver_name)}</td>
            <td>${escapeHtml(r.resolved_at)}</td>`;
        tbody.appendChild(tr);
    });
}

// ── 대상 링크 생성 ────────────────────────────────────────────

function makeTargetLink(targetType, targetId) {
    const safeId = escapeHtml(targetId);
    switch (targetType) {
        case 'cocktail':
            return `<a class="target-link" href="/cocktail/${safeId}" target="_blank">#${safeId}</a>`;
        case 'ingredient':
            return `<a class="target-link" href="/ingredient/${safeId}" target="_blank">#${safeId}</a>`;
        case 'comment':
            return `<span class="target-id">댓글 #${safeId}</span>`;
        case 'user':
            return `<a class="target-link" href="/user/${safeId}" target="_blank">${safeId}</a>`;
        default:
            return `<span>${safeId}</span>`;
    }
}

// ── 처리 모달 ─────────────────────────────────────────────────

function openResolveModal(reportId, targetType, targetId, reasonLabel) {
    _resolveTarget = reportId;
    document.getElementById('resolveAction').value = '';
    document.getElementById('resolveError').textContent = '';
    document.getElementById('resolveInfo').innerHTML = `
        <p>신고 #${reportId}</p>
        <p>대상: <strong>${escapeHtml(TARGET_TYPE_LABELS[targetType] || targetType)}</strong> (ID: ${escapeHtml(targetId)})</p>
        <p>사유: <strong>${escapeHtml(reasonLabel)}</strong></p>`;
    document.getElementById('resolveModal').style.display = 'flex';
}

function closeResolveModal() {
    document.getElementById('resolveModal').style.display = 'none';
    _resolveTarget = null;
}

function closeResolveModalOutside(e) {
    if (e.target.id === 'resolveModal') closeResolveModal();
}

async function submitResolve() {
    if (!_resolveTarget) return;
    const action = document.getElementById('resolveAction').value;
    if (!action) {
        document.getElementById('resolveError').textContent = '처리 방식을 선택해주세요.';
        return;
    }

    const btn = document.querySelector('#resolveModal .btn-modal-submit');
    btn.disabled = true;

    try {
        const res  = await fetch(`/api/admin/reports/${_resolveTarget}/resolve`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action_taken: action }),
        });
        const data = await res.json();
        if (data.success) {
            // 처리된 행을 테이블에서 제거
            document.getElementById(`pending-row-${_resolveTarget}`)?.remove();
            closeResolveModal();
            alert(data.message);
            // 처리된 탭이 이미 로드됐으면 갱신
            if (_ar.resolved.page > 1 || document.getElementById('resolvedTbody')) {
                _ar.resolved.page = 1;
                loadResolved(false);
            }
        } else {
            document.getElementById('resolveError').textContent = data.message;
        }
    } catch {
        document.getElementById('resolveError').textContent = '서버 오류가 발생했습니다.';
    } finally {
        btn.disabled = false;
    }
}
