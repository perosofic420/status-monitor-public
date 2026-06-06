const strengthConfig = [
    { width: '20%', colour: 'bg-danger',  text: `Very weak` },
    { width: '40%', colour: 'bg-warning',  text: `Weak` },
    { width: '60%', colour: 'bg-info',     text: `Fair` },
    { width: '80%', colour: 'bg-primary',  text: `Strong` },
    { width: '100%', colour: 'bg-success', text: `Very strong` },
];

const eyeOn = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;
function togglePassword(input, btn, placeholderH, placeholderS) {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    input.placeholder = visible ? placeholderH : placeholderS;
    btn.innerHTML = visible ? eyeOn : eyeOff;
}

document.addEventListener('DOMContentLoaded', () => {
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const toggle_password_btn = document.getElementById('toggle_password_btn');
    const confirm_password = document.getElementById('confirm_password');
    const toggle_confirm_password_btn = document.getElementById('toggle_confirm_password_btn');
    const bar = document.getElementById('password-strength-bar');
    const label = document.getElementById('password-strength-label');
    const matchError = document.getElementById('password-match-error');

    password.addEventListener('input', () => {
        const val = password.value;
        if (!val) {
            bar.style.width = '0%';
            bar.className = 'progress-bar';
            label.textContent = '';
            return;
        }

        const result = zxcvbn(val, [username.value]);
        const config = strengthConfig[result.score];
        bar.style.width = config.width;
        bar.className = `progress-bar ${config.colour}`;
        label.textContent = config.text;

        if (confirm_password.value) checkMatch();
    });

    function checkMatch() {
        const mismatch = confirm_password.value !== password.value;
        matchError.classList.toggle('d-none', !mismatch);
    }
    confirm_password.addEventListener('input', checkMatch);

    toggle_password_btn.addEventListener('click', () => togglePassword(password, toggle_password_btn, `••••••••••••`, `4diqs&amp;Z33Q4z`));
    toggle_confirm_password_btn.addEventListener('click', () => togglePassword(confirm_password, toggle_confirm_password_btn, `••••••••••••`, `4diqs&amp;Z33Q4z`));

    const create_account = document.getElementById('create_account');
    create_account.addEventListener('click', async () => {
        create_account.innerHTML = `<span>Creating...</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle spinner ms-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

        try {
            const res = await fetch('https://10.0.0.3/api/staff/staff/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json ' },
                body: JSON.stringify({
                    username: username.value,
                    password: password.value,
                    confirm_password: confirm_password.value
                })
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
        
            const data = await res.json();
            if (!data.success) throw new Error(data?.error || 'Something went wrong');

            window.location.href = '/onboarding/finalize';
        } catch (error) {
            console.error('Error while creating account:', error);
            toast(`Error while creating account`, 'danger');
        } finally {
            create_account.innerHTML = '';
            create_account.textContent = `Create Account`;
        }
    });
});