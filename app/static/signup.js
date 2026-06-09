// ── 회원가입 ──────────────────────────────────────────────────
// validateEmail / showAuthMessage / hideAuthMessage → utils.js

document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleSignupSubmit();
});

function handleSignupSubmit() {
    const userId          = document.getElementById('userId').value.trim();
    const userName        = document.getElementById('userName').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const errorEl         = document.getElementById('errorMessage');
    const successEl       = document.getElementById('successMessage');

    hideAuthMessage(errorEl);
    hideAuthMessage(successEl);

    if (!userId || !userName || !email || !password || !confirmPassword) {
        showAuthMessage(errorEl, '모든 필드를 입력해주세요.');
        return;
    }
    if (userId.length < 3) {
        showAuthMessage(errorEl, '사용자 ID는 최소 3자 이상이어야 합니다.');
        return;
    }
    if (userName.length < 2) {
        showAuthMessage(errorEl, '닉네임은 최소 2자 이상이어야 합니다.');
        return;
    }
    if (!validateEmail(email)) {
        showAuthMessage(errorEl, '유효한 이메일 주소를 입력해주세요.');
        return;
    }
    if (password.length < 6) {
        showAuthMessage(errorEl, '비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    if (password !== confirmPassword) {
        showAuthMessage(errorEl, '비밀번호가 일치하지 않습니다.');
        return;
    }

    performSignup(userId, userName, email, password);
}

async function performSignup(userId, userName, email, password) {
    const signupBtn = document.querySelector('.btn-submit');
    const errorEl   = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');

    signupBtn.disabled    = true;
    signupBtn.textContent = '회원가입 중...';

    try {
        const res  = await fetch('/signup', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ userId, userName, email, password })
        });
        const data = await res.json();

        if (data.success) {
            showAuthMessage(successEl, data.message);
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        } else {
            showAuthMessage(errorEl, data.message);
            signupBtn.disabled    = false;
            signupBtn.textContent = '회원가입';
        }
    } catch {
        showAuthMessage(errorEl, '서버 연결 오류가 발생했습니다.');
        signupBtn.disabled    = false;
        signupBtn.textContent = '회원가입';
    }
}
