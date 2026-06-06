document.addEventListener('DOMContentLoaded', () => {
    const firewall_toggle = document.getElementById('firewall_toggle');
    const firewall_info_container = document.getElementById('firewall_info_container');
    firewall_toggle.addEventListener('change', () => {
        if (firewall_toggle.checked) {
            firewall_info_container.classList.remove('d-none');
        } else {
            firewall_info_container.classList.add('d-none');
        }
    });

    const select_firewall_provider = document.getElementById('select_firewall_provider');

    const confirm_settings_btn = document.getElementById('confirm_settings_btn');
    confirm_settings_btn.addEventListener('click', async () => {
        const res = await fetch('https://10.0.0.3/api/staff/settings/firewall/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toggle: firewall_toggle.checked,
                firewall_provider: select_firewall_provider.value,
            })
        });
        if (!res.ok) return;
        
        const data = await res.json();

        if (data.success) {
            window.location.href = '/onboarding/settings/backups';
        }
    });
});