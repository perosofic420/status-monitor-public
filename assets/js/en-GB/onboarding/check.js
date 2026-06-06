
const responseCodes = {
    DISABLED: 0,
    MISSING_APP_SETTINGS: 1,
    MISSING_DISCORD_SETTINGS: 2,
    MISSING_FIREWALL_SETTINGS: 3,
    MISSING_BACKUP_SETTINGS: 4,
    MISSING_ACCOUNT: 5,
    ONBOARDING_ENABLED: 6
};
fetch('https://10.0.0.3/api/onboarding/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json ' }
}).then(res => {
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.json();
}).then(data => {
    if (!data.success) throw new Error('Request failed');
    switch (data.code) {
    case responseCodes.MISSING_APP_SETTINGS: {
        if (window.location.pathname !== '/onboarding/settings/app' && window.location.pathname !== '/onboarding/settings/app/') {
            window.location.href = '/onboarding/settings/app';
        }
        break;
    }
    case responseCodes.MISSING_DISCORD_SETTINGS: {
        if (window.location.pathname !== '/onboarding/settings/discord' && window.location.pathname !== '/onboarding/settings/discord/') {
            window.location.href = '/onboarding/settings/discord';
        }
        break;
    }
    case responseCodes.MISSING_FIREWALL_SETTINGS: {
        if (window.location.pathname !== '/onboarding/settings/firewall' && window.location.pathname !== '/onboarding/settings/firewall/') {
            window.location.href = '/onboarding/settings/firewall';
        }
        break;
    }
    case responseCodes.MISSING_BACKUP_SETTINGS: {
        if (window.location.pathname !== '/onboarding/settings/backups' && window.location.pathname !== '/onboarding/settings/backups/') {
            window.location.href = '/onboarding/settings/backups';
        }
        break;
    }
    case responseCodes.MISSING_ACCOUNT: {
        if (window.location.pathname !== '/onboarding/account' && window.location.pathname !== '/onboarding/account/') {
            window.location.href = '/onboarding/account';
        }
        break;
    }
    case responseCodes.ONBOARDING_ENABLED: {
        if (window.location.pathname !== '/onboarding/finalize' && window.location.pathname !== '/onboarding/finalize/') {
            window.location.href = '/onboarding/finalize';
        }
        break;
    }
    }
}).catch(error => {
    console.error('Error while checking onboarding status:', error);
});