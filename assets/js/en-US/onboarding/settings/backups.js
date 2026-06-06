document.addEventListener('DOMContentLoaded', () => {
    const backup_s3_toggle = document.getElementById('backup_s3_toggle');
    const backup_s3_container = document.getElementById('backup_s3_container');
    backup_s3_toggle.addEventListener('change', () => {
        backup_s3_container.classList.toggle('d-none', !backup_s3_toggle.checked);
    });

    const backup_sftp_toggle = document.getElementById('backup_sftp_toggle');
    const backup_sftp_container = document.getElementById('backup_sftp_container');
    backup_sftp_toggle.addEventListener('change', () => {
        backup_sftp_container.classList.toggle('d-none', !backup_sftp_toggle.checked);
    });

    const backup_interval_minutes = document.getElementById('backup_interval_minutes');

    const backup_s3_bucket = document.getElementById('backup_s3_bucket');
    const backup_s3_endpoint = document.getElementById('backup_s3_endpoint');
    const backup_s3_region = document.getElementById('backup_s3_region');
    const backup_s3_access_key_id = document.getElementById('backup_s3_access_key_id');
    const backup_s3_secret_access_key = document.getElementById('backup_s3_secret_access_key');
    const show_backup_s3_secret_btn = document.getElementById('show_backup_s3_secret_btn');
    const backup_s3_remote_path = document.getElementById('backup_s3_remote_path');
    const backup_s3_keep_days = document.getElementById('backup_s3_keep_days');
    const backup_s3_keep_hours = document.getElementById('backup_s3_keep_hours');
    const backup_s3_force_path_style = document.getElementById('backup_s3_force_path_style');

    const backup_sftp_host = document.getElementById('backup_sftp_host');
    const backup_sftp_port = document.getElementById('backup_sftp_port');
    const backup_sftp_username = document.getElementById('backup_sftp_username');
    const backup_sftp_private_key = document.getElementById('backup_sftp_private_key');
    const backup_sftp_remote_path = document.getElementById('backup_sftp_remote_path');
    const backup_sftp_keep_days = document.getElementById('backup_sftp_keep_days');
    const backup_sftp_keep_hours = document.getElementById('backup_sftp_keep_hours');

    show_backup_s3_secret_btn.addEventListener('click', () => {
        if (backup_s3_secret_access_key.type === 'text') {
            backup_s3_secret_access_key.type = 'password';
        } else {
            backup_s3_secret_access_key.type = 'text';
        }
    });

    const confirm_settings_btn = document.getElementById('confirm_settings_btn');
    confirm_settings_btn.addEventListener('click', async () => {
        const body = new FormData();
        body.set('interval_minutes', backup_interval_minutes.value);
        body.set('s3_toggle', backup_s3_toggle.checked);
        body.set('sftp_toggle', backup_sftp_toggle.checked);

        if (backup_s3_toggle.checked) {
            body.set('s3_bucket', backup_s3_bucket.value);
            body.set('s3_endpoint', backup_s3_endpoint.value);
            body.set('s3_region', backup_s3_region.value);
            body.set('s3_access_key_id', backup_s3_access_key_id.value);
            body.set('s3_secret_access_key', backup_s3_secret_access_key.value);
            body.set('s3_remote_path', backup_s3_remote_path.value);
            body.set('s3_keep_days', backup_s3_keep_days.value);
            body.set('s3_keep_hours', backup_s3_keep_hours.value);
            body.set('s3_force_path_style', backup_s3_force_path_style.checked);
        }

        if (backup_sftp_toggle.checked) {
            if (!backup_sftp_private_key.files[0]) {
                return toast(`Please upload a SSH private key.`, 'warning');
            }

            body.set('sftp_host', backup_sftp_host.value);
            body.set('sftp_port', backup_sftp_port.value);
            body.set('sftp_username', backup_sftp_username.value);
            body.set('sftp_private_key', backup_sftp_private_key.files[0]);
            body.set('sftp_remote_path', backup_sftp_remote_path.value);
            body.set('sftp_keep_days', backup_sftp_keep_days.value);
            body.set('sftp_keep_hours', backup_sftp_keep_hours.value);
        }

        const res = await fetch('https://10.0.0.3/api/staff/settings/backups/update', {
            method: 'POST',
            body: body
        });
        if (!res.ok) return;
        
        const data = await res.json();

        if (data.success) {
            window.location.href = '/onboarding/account';
        }
    });
});