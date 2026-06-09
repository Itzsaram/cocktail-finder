// ── 로그인 ────────────────────────────────────────────────────
// validateEmail / showAuthMessage / hideAuthMessage → utils.js

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleLoginSubmit();
});

function handleLoginSubmit() {
    const userId   = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl  = document.getElementById('errorMessage');

    hideAuthMessage(errorEl);

    if (!userId || !password) {
        showAuthMessage(errorEl, '모든 필드를 입력해주세요.');
        return;
    }

    if (password.length < 6) {
        showAuthMessage(errorEl, '비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }

    performLogin(userId, password);
}

async function performLogin(userId, password) {
    const loginBtn = document.querySelector('.btn-submit');
    const errorEl  = document.getElementById('errorMessage');

    loginBtn.disabled    = true;
    loginBtn.textContent = '로그인 중...';

    try {
        const res  = await fetch('/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ userId, password })
        });
        const data = await res.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            showAuthMessage(errorEl, data.message);
        }
    } catch {
        showAuthMessage(errorEl, '서버 연결 오류가 발생했습니다.');
    } finally {
        loginBtn.disabled    = false;
        loginBtn.textContent = '로그인';
    }
}
