function loadTimeValues() {
    const load_time = document.querySelectorAll('#load_time');
    for (const lt of load_time) {
        const short = lt.dataset.short && lt.dataset.short === '1';
        const time = new Date(parseInt(lt.dataset.time, 10));
        if (short) {
            lt.textContent = time.toLocaleString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            lt.textContent = time.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}
document.addEventListener('DOMContentLoaded', loadTimeValues);