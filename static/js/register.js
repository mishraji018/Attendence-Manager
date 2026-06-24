/**
 * register.js — Registration Form Handling
 * Handles validation, password meter, and form submission.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const AUTOSAVE_KEY = 'facelock_register_draft';

    // ---- Form Autosave (localStorage) ----
    const SAVE_FIELDS = ['name', 'roll_no', 'email'];

    const saveFormDraft = () => {
        const draft = {};
        SAVE_FIELDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) draft[id] = el.value;
        });
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    };

    const restoreFormDraft = () => {
        try {
            const draft = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
            if (!draft) return;
            SAVE_FIELDS.forEach(id => {
                const el = document.getElementById(id);
                if (el && draft[id]) {
                    el.value = draft[id];
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        } catch (e) { /* ignore corrupt data */ }
    };

    const clearFormDraft = () => {
        localStorage.removeItem(AUTOSAVE_KEY);
    };

    restoreFormDraft();

    SAVE_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveFormDraft);
            el.addEventListener('change', saveFormDraft);
        }
    });

    // ---- Validation ----
    const setError = (field, message) => {
        const group = document.getElementById(field)?.closest('.input-group');
        if (group) {
            group.classList.add('has-error');
            const errorEl = document.getElementById(`${field}-error`);
            if (errorEl) errorEl.textContent = message;
        }
    };

    const clearError = (field) => {
        const group = document.getElementById(field)?.closest('.input-group');
        if (group) {
            group.classList.remove('has-error');
            const errorEl = document.getElementById(`${field}-error`);
            if (errorEl) errorEl.textContent = '';
        }
    };

    const clearAllErrors = () => {
        document.querySelectorAll('.input-group').forEach(g => g.classList.remove('has-error'));
        document.querySelectorAll('.error-text').forEach(e => e.textContent = '');
    };

    const validateForm = () => {
        let valid = true;
        clearAllErrors();

        const name = document.getElementById('name').value.trim();
        const rollNo = document.getElementById('roll_no').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (!name || name.length < 2) {
            setError('name', 'Name must be at least 2 characters.');
            valid = false;
        }
        if (!rollNo) {
            setError('roll_no', 'Roll number is required.');
            valid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('email', 'Please enter a valid email address.');
            valid = false;
        }
        if (!password || password.length < 8) {
            setError('password', 'Password must be at least 8 characters.');
            valid = false;
        }
        if (password !== confirmPassword) {
            setError('confirm_password', 'Passwords do not match.');
            valid = false;
        }

        return valid;
    };

    // ---- Password Strength Meter ----
    const passwordInput = document.getElementById('password');
    const meterFill = document.getElementById('meter-fill');
    const strengthLabel = document.getElementById('password-strength-label');

    const getStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 'weak', label: 'Weak' };
        if (score === 2) return { level: 'medium', label: 'Medium' };
        if (score === 3) return { level: 'strong', label: 'Strong' };
        return { level: 'very-strong', label: 'Very Strong' };
    };

    passwordInput?.addEventListener('input', () => {
        const val = passwordInput.value;
        if (!val) {
            meterFill.className = 'meter-fill';
            strengthLabel.textContent = '';
            strengthLabel.className = 'password-label';
            return;
        }
        const { level, label } = getStrength(val);
        meterFill.className = `meter-fill ${level}`;
        strengthLabel.textContent = label;
        strengthLabel.className = `password-label ${level}`;
    });

    // ---- Clear error on input ----
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('input', () => clearError(input.id));
        input.addEventListener('change', () => clearError(input.id));
    });

    // ---- Form Submission ----
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const btn = document.getElementById('btn-submit');
        btn.disabled = true;
        btn.textContent = 'Creating Account...';

        const payload = {
            name: document.getElementById('name').value.trim(),
            roll_no: document.getElementById('roll_no').value.trim(),
            email: document.getElementById('email').value.trim().toLowerCase(),
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm_password').value
        };

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                clearFormDraft();
                showToast(data.message || 'Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                if (data.errors) {
                    Object.entries(data.errors).forEach(([field, msg]) => {
                        setError(field, msg);
                    });
                }
                showToast(data.message || 'Registration failed. Please check your inputs.', 'error');
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });

    // ---- Toast ----
    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    };
});
