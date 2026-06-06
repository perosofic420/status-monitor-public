document.addEventListener('DOMContentLoaded', () => {
    const copy_text_btns = document.querySelectorAll('#copy-text-btn');
    copy_text_btns.forEach((btn) => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(btn.dataset.value);
        });
    });
});