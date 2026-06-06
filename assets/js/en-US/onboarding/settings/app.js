const faviconInputs = Object.freeze([
    Object.freeze({ id: 'favicon_ico', field: 'favicon_ico', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-ico' }),
    Object.freeze({ id: 'favicon_16', field: 'favicon_16', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-16' }),
    Object.freeze({ id: 'favicon_32', field: 'favicon_32', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-32' }),
    Object.freeze({ id: 'favicon_apple', field: 'favicon_apple', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-apple' }),
    Object.freeze({ id: 'favicon_android_192', field: 'favicon_android_192', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-android-192' }),
    Object.freeze({ id: 'favicon_android_512', field: 'favicon_android_512', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/favicon-android-512' }),
]);

const logoInput = Object.freeze({ id: 'logo', field: 'logo', endpoint: 'https://10.0.0.3/api/staff/settings/app/upload/logo' });
const allUploadInputs = Object.freeze([logoInput, ...faviconInputs]);

async function uploadFile(endpoint, file) {
    try {
        if (allUploadInputs.findIndex(i => i.endpoint === endpoint) < 0) {
            console.error(`Blocked upload to disallowed endpoint: ${endpoint}`);
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) return null;

        const data = await res.json();

        return data.path;
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error);
        return null;
    }
}

async function uploadLogo(file) {
    return uploadFile('https://10.0.0.3/api/staff/settings/app/upload/logo', file);
}

async function uploadFavicons() {
    for (const { id, endpoint } of faviconInputs) {
        const input = document.getElementById(id);
        if (input?.files[0]) {
            await uploadFile(endpoint, input.files[0]);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const name = document.getElementById('name');
    const running_mode = document.getElementById('running_mode');
    const primary_colour = document.getElementById('primary_colour');
    const discord_invite_link = document.getElementById('discord_invite_link');

    const upload_font_name = document.getElementById('upload_font_name');
    const upload_font_files = document.getElementById('upload_font_files');
    const upload_font_btn = document.getElementById('upload_font_btn');
    upload_font_files.addEventListener('change', () => {
        if (upload_font_files.files[0]) {
            upload_font_btn.classList.remove('d-none');
        } else {
            upload_font_btn.classList.add('d-none');
        }
    });
    upload_font_btn.addEventListener('click', async () => {
        const body = new FormData();

        body.set('name', upload_font_name.value);
        for (const file of upload_font_files.files) {
            body.append('file', file);
        }

        const res = await fetch('https://10.0.0.3/api/staff/settings/app/upload/font', {
            method: 'POST',
            body: body
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success) return;
        
        window.location.reload();
    });

    const fonts_container = document.getElementById('fonts_container');
    const select_font = document.getElementById('select_font');
    select_font.addEventListener('change', () => {
        const allContainers = fonts_container.querySelectorAll('div');
        for (const c of allContainers) {
            c.classList.add('d-none');
        }
        const container = document.getElementById(`select_font_${select_font.value}`);
        container.classList.remove('d-none');
    });

    const confirm_settings_btn = document.getElementById('confirm_settings_btn');
    confirm_settings_btn.addEventListener('click', async () => {
        const select_font_regular_current = document.getElementById(`select_font_regular_${select_font.value}`);
        const select_font_bold_current = document.getElementById(`select_font_bold_${select_font.value}`);
        const select_font_light_current = document.getElementById(`select_font_light_${select_font.value}`);
        const select_font_medium_current = document.getElementById(`select_font_medium_${select_font.value}`);
        const select_font_semibold_current = document.getElementById(`select_font_semibold_${select_font.value}`);
        
        const res = await fetch('https://10.0.0.3/api/staff/settings/app/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.value,
                running_mode: running_mode.value,
                primary_colour: primary_colour.value,
                selected_font: select_font.value,
                selected_font_regular: select_font_regular_current.value,
                selected_font_bold: select_font_bold_current.value,
                selected_font_light: select_font_light_current.value,
                selected_font_medium: select_font_medium_current.value,
                selected_font_semibold: select_font_semibold_current.value,
                discord_invite_link: discord_invite_link.value,
            })
        });
        if (!res.ok) return;

        const data = await res.json();

        if (data.success) {
            const logo = document.getElementById('logo');
            if (logo.files[0]) {
                const image_path = await uploadLogo(logo.files[0]);
            }
            await uploadFavicons();

            window.location.href = '/onboarding/settings/discord';
        }
    });
});