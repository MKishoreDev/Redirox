const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';

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

        themeToggle.addEventListener('click', toggleTheme);
        initTheme();