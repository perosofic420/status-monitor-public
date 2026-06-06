document.addEventListener('DOMContentLoaded', () => {
    const complete_onboarding = document.getElementById('complete_onboarding');
    complete_onboarding.addEventListener('click', async () => {

        try {
            await fetch('https://10.0.0.3/api/onboarding/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json ' }
            });

            window.location.href = '/';
        } catch (error) {
            console.error('Error while completing onboarding:', error);
            toast('Error while completing onboarding', 'danger');
        }
    });
});