const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        const passwordForm = document.getElementById('passwordForm');
        const passwordField = document.getElementById('passwordField');
        const passwordToggle = document.getElementById('passwordToggle');
        const errorMessage = document.getElementById('errorMessage');

        function initTheme() {
            if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            themeToggle.innerHTML = isDark ? '<i class="fas fa-sun" style="color: inherit;"></i>' : '<i class="fas fa-moon" style="color: inherit;"></i>';
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            updateThemeIcon();
            localStorage.setItem('theme', newTheme);
        }

        function togglePasswordVisibility() {
            const type = passwordField.type === 'password' ? 'text' : 'password';
            passwordField.type = type;
            passwordToggle.innerHTML = type === 'password' 
                ? '<i class="fas fa-eye"></i>' 
                : '<i class="fas fa-eye-slash"></i>';
        }

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            passwordField.focus();
        }

        function hideError() {
            errorMessage.style.display = 'none';
        }

        async function handlePasswordSubmit(e) {
            e.preventDefault();
            hideError();

            let code = document.getElementById('codeHolder')?.dataset?.code || '';
            if (!code || code.startsWith('{{')) {
                const urlParams = new URLSearchParams(window.location.search);
                code = urlParams.get('code') || '';
            }
            if (!code) {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const last = pathParts[pathParts.length - 1];
                if (last && last !== 'password.html' && last !== 'password') {
                    code = last;
                }
            }

            if (!password) {
                showError('Please enter a password');
                return;
            }

            if (!code) {
                showError('Invalid link. No code provided.');
                return;
            }

            try {
                const response = await fetch(`${window.location.origin}/verify/${code}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });

                let data = null;
                const text = await response.text();
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (parseErr) {
                        data = null;
                    }
                }

                if (!response.ok) {
                    if (response.status === 401) {
                        showError('Incorrect password. Please try again.');
                    } else if (response.status === 404) {
                        window.location.href = '/404.html';
                    } else {
                        showError((data && data.error) ? data.error : `Request failed (HTTP ${response.status})`);
                    }
                    return;
                }

                const redirectUrl = `${window.location.origin}/${code}?password=${encodeURIComponent(password)}`;
                window.location.href = redirectUrl;

            } catch (error) {
                showError('Failed to verify password. Please try again.');
                console.error(error);
            }
        }

        themeToggle.addEventListener('click', toggleTheme);
        passwordToggle.addEventListener('click', togglePasswordVisibility);
        passwordForm.addEventListener('submit', handlePasswordSubmit);
        initTheme();