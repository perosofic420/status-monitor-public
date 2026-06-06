document.addEventListener('DOMContentLoaded', () => {
    const discord_bot_toggle = document.getElementById('discord_bot_toggle');
    const discord_info_container = document.getElementById('discord_info_container');
    discord_bot_toggle.addEventListener('change', () => {
        discord_info_container.classList.toggle('d-none', !discord_bot_toggle.checked);
    });

    const client_id = document.getElementById('client_id');
    const client_token = document.getElementById('client_token');
    const show_client_token_btn = document.getElementById('show_client_token_btn');

    show_client_token_btn.addEventListener('click', () => {
        if (client_token.type === 'text') {
            client_token.type = 'password';
        } else {
            client_token.type = 'text';
        }
    });

    const confirm_settings_btn = document.getElementById('confirm_settings_btn');
    confirm_settings_btn.addEventListener('click', async () => {
        const res = await fetch('https://10.0.0.3/api/staff/settings/discord/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toggle: discord_bot_toggle.checked,
                client_id: client_id.value,
                client_token: client_token.value
            })
        });
        if (!res.ok) return;
        
        const data = await res.json();

        if (data.success) {
            window.location.href = '/onboarding/settings/firewall';
        }
    });
});