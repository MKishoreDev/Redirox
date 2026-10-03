(function () {
    const toggle = document.getElementById('themeToggle');
    
    function setTheme(theme) {
        document.documentElement.toggleAttribute('data-theme', false);
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        toggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    setTheme(localStorage.getItem('theme') || 'light');

    toggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(theme);
        localStorage.setItem('theme', theme);
    });

    document.querySelectorAll('.docs-copy').forEach(button => {
        button.addEventListener('click', async () => {
            const text = button.closest('.docs-code').querySelector('code').textContent;
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(button.closest('.docs-code').querySelector('code'));
                    selection.removeAllRanges();
                    selection.addRange(range);
                    if (!document.execCommand('copy')) throw new Error('Copy unavailable');
                    selection.removeAllRanges();
                }
                button.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(() => button.innerHTML = '<i class="fas fa-copy"></i> Copy', 1800);
            } catch (error) {
                button.innerHTML = 'Copy failed';
                setTimeout(() => button.innerHTML = '<i class="fas fa-copy"></i> Copy', 1800);
            }
        });
    });

    const links = [...document.querySelectorAll('.docs-nav a')];
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
                });
            }
        });
    }, { rootMargin: '-110px 0px -65% 0px' });

    document.querySelectorAll('.docs-main section').forEach(section => observer.observe(section));
})();