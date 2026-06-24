/**
 * login.js — Login form handler
 * Handles validation, submission, error shake animation, and redirect.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    // Clear error on input
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.input-group');
            group?.classList.remove('has-error');
            const errEl = document.getElementById(`${input.id}-error`);
            if (errEl) errEl.textContent = '';
            errorBox.classList.add('hidden');
            errorBox.textContent = '';
        });
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;

        // Basic validation
        let valid = true;
        if (!email) {
            showFieldError('email', 'Email is required.');
            valid = false;
        }
        if (!password) {
            showFieldError('password', 'Password is required.');
            valid = false;
        }
        if (!valid) return;

        const btn = document.getElementById('btn-submit');
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember })
            });

            const data = await res.json();

            if (data.success) {
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 800);
            } else {
                showServerError(data.message || 'Invalid credentials.');
                shakeForm();
                btn.disabled = false;
                btn.textContent = 'Login →';
            }
        } catch (err) {
            showServerError('Something went wrong. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Login →';
        }
    });

    // ---- Helpers ----
    const showFieldError = (field, msg) => {
        const group = document.getElementById(field)?.closest('.input-group');
        if (group) group.classList.add('has-error');
        const errEl = document.getElementById(`${field}-error`);
        if (errEl) errEl.textContent = msg;
    };

    const showServerError = (msg) => {
        errorBox.textContent = msg;
        errorBox.classList.remove('hidden');
    };

    const shakeForm = () => {
        const card = form.closest('.glass-card');
        card.classList.add('animate-shake');
        setTimeout(() => card.classList.remove('animate-shake'), 300);
    };

    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.offsetHeight; // reflow
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };
});
