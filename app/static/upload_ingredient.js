document.addEventListener('DOMContentLoaded', function () {
    initUploadPage();
});

// initCabinet() 패턴 준수
async function initUploadPage() {
    if (!await checkAuth()) return;

    await loadCategories();

    document.getElementById('uploadForm').addEventListener('submit', handleSubmit);
}

// 카테고리 드롭다운 로드
async function loadCategories() {
    try {
        const res  = await fetch('/api/ingredient-categories');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const select = document.getElementById('categorySelect');
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.ingredient_category_id;
            option.textContent = cat.category_name;
            select.appendChild(option);
        });
    } catch (err) {
        showMessage('error', '카테고리를 불러오는 중 오류가 발생했습니다.');
    }
}

// 폼 제출 처리
async function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    const name        = document.getElementById('ingredientName').value.trim();
    const categoryId  = document.getElementById('categorySelect').value;
    const unit        = document.getElementById('unitSelect').value;
    const description = document.getElementById('description').value.trim();

    if (!name || !categoryId || !unit) {
        showMessage('error', '재료명, 카테고리, 단위는 필수입니다.');
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '추가 중...';

    try {
        const res  = await fetch('/api/ingredients', {
            method: 'POST',
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
            showMessage('success', data.message);
            document.getElementById('uploadForm').reset();
        } else {
            showMessage('error', data.message);
        }
    } catch {
        showMessage('error', '서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '재료 추가';
    }
}

// showMessage / clearMessages → utils.js
