document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-bs-theme', theme);
});