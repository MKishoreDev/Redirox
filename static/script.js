const API_BASE = window.location.origin;

const themeToggle = document.getElementById('themeToggle');
const shortenForm = document.getElementById('shortenForm');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const urlInput = document.getElementById('urlInput');
const passwordInput = document.getElementById('passwordInput');
const passwordToggleBtn = document.getElementById('passwordToggleBtn');
const expDateTime = document.getElementById('expDateTime');
const shortUrlInput = document.getElementById('shortUrlInput');
const originalUrl = document.getElementById('originalUrl');
const qrCode = document.getElementById('qrCode');
const downloadQrBtn = document.getElementById('downloadQrBtn');
let expiryDatePickerInstance = null;
let selectedExpiryDate = null;
const copyBtn = document.getElementById('copyBtn');
const copyOriginalBtn = document.getElementById('copyOriginalBtn');
const shareBtn = document.getElementById('shareBtn');
const newLinkBtn = document.getElementById('newLinkBtn');

const savedTheme = localStorage.getItem('theme') || 'light';

function initTheme() {
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    updateThemeIcon();

    if (window.TuncxysDatePicker && expDateTime) {
        initExpiryPicker();
    }
}

function initExpiryPicker() {
    if (!window.TuncxysDatePicker || !expDateTime) return;
    if (expiryDatePickerInstance && typeof expiryDatePickerInstance.destroy === 'function') {
        expiryDatePickerInstance.destroy();
        expiryDatePickerInstance = null;
    }
    selectedExpiryDate = null;

    expiryDatePickerInstance = new TuncxysDatePicker('#expDateTime', {
        width: '100%',
        enableDate: true,
        enableTime: true,
        lang: 'en',
        enableLimit: true,
        enableDayLimit: true,
        minOffset: 0,
        theme: 'custom',
        colors: {
            background: 'var(--bg-primary)',
            border: 'var(--border-light)',
            borderFocus: 'var(--accent)',
            text: 'var(--text-primary)',
            placeholder: 'var(--text-tertiary)',
            icon: 'var(--accent)',
            iconHoverBg: 'rgba(56, 189, 248, 0.12)',
            selectionBg: 'var(--accent)',
            selectionText: '#ffffff',
            weekDayText: 'var(--text-tertiary)',
            passiveText: 'var(--text-tertiary)',
            hoverBg: 'var(--bg-tertiary)',
            selectedBg: 'var(--accent)',
            selectedText: '#ffffff',
            todayBg: 'rgba(56, 189, 248, 0.12)',
            todayText: 'var(--accent)',
            restricted: '#ef4444',
            error: '#ef4444',
            toastBg: '#ef4444',
            toastText: '#ffffff',
            timeHeader: 'var(--text-tertiary)',
            timeNum: 'var(--text-tertiary)',
            timeNumActive: 'var(--accent)',
            timeSeparator: 'var(--border-light)',
            timeGradStart: 'rgba(255, 255, 255, 1)',
            timeGradEnd: 'rgba(255, 255, 255, 0)'
        },
        onChange: (dateObj) => {
            selectedExpiryDate = dateObj;
        },
    });
}

function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function getTodayDate(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showToast(message) {
    const oldToast = document.querySelector('.redirox-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'redirox-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    toast.offsetHeight;
    toast.classList.add('visible');
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

let activeExpiryOption = 'never';
const expiryPills = document.querySelectorAll('.expiry-pill');
const customExpiryContainer = document.getElementById('customExpiryContainer');

expiryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        expiryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeExpiryOption = pill.dataset.value;
        if (activeExpiryOption === 'custom') {
            customExpiryContainer.style.display = 'block';
        } else {
            customExpiryContainer.style.display = 'none';
            selectedExpiryDate = null;
        }
    });
});

async function handleShortenSubmit(e) {
    e.preventDefault();
    hideError();
    
    const url = urlInput.value.trim();
    const password = passwordInput.value.trim();
    const generateQr = document.getElementById('generateQr').checked;
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showError('URL must start with http:// or https://');
        return;
    }
    
    const payload = {
        url,
        password: password || '',
        generate_qr: generateQr
    };
    
    let expiresAt = null;
    if (activeExpiryOption === '10m') {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 10);
        expiresAt = d.toISOString();
    } else if (activeExpiryOption === '1h') {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        expiresAt = d.toISOString();
    } else if (activeExpiryOption === '1d') {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        expiresAt = d.toISOString();
    } else if (activeExpiryOption === 'custom') {
        if (!selectedExpiryDate) {
            showError('Please select an expiration date and time');
            return;
        }
        if (selectedExpiryDate <= new Date()) {
            showError('Expiration date and time must be in the future.');
            return;
        }
        expiresAt = selectedExpiryDate.toISOString();
    }
    
    if (expiresAt) {
        if (new Date(expiresAt) <= new Date()) {
            showError('Expiration date and time must be in the future.');
            return;
        }
        payload.expires_at = expiresAt;
    }
    
    const shortenBtn = document.getElementById('shortenBtn') || shortenForm.querySelector('button[type="submit"]');
    const shortenBtnIcon = document.getElementById('shortenBtnIcon');
    const shortenBtnText = document.getElementById('shortenBtnText');

    if (shortenBtn) {
        shortenBtn.disabled = true;
        if (shortenBtnIcon) shortenBtnIcon.className = 'fas fa-circle-notch fa-spin';
        if (shortenBtnText) shortenBtnText.textContent = 'Shortening...';
    }

    try {
        const response = await fetch(`${API_BASE}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
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
            const errorMsg = (data && data.error) 
                ? data.error 
                : (response.status === 405 
                    ? 'Shortening is currently unavailable on this endpoint (HTTP 405).' 
                    : `Failed to shorten link (HTTP ${response.status})`);
            showError(errorMsg);
            return;
        }

        if (!data || !data.short_url) {
            showError('Invalid response received from server.');
            return;
        }

        displayResult(data);
        
    } catch (error) {
        showError('Unable to reach the service. Please check your internet connection and try again.');
        console.error(error);
    } finally {
        if (shortenBtn) {
            shortenBtn.disabled = false;
            if (shortenBtnIcon) shortenBtnIcon.className = 'fas fa-magic';
            if (shortenBtnText) shortenBtnText.textContent = 'Shorten Link';
        }
    }
}

function displayResult(data) {
    shortUrlInput.value = data.short_url;
    originalUrl.value = data.url;
    
    const qrSection = document.getElementById('qrSection');
    const qrSkeleton = document.getElementById('qrSkeleton');
    const resultLayout = document.querySelector('.result-layout');

    if (data.qr_code) {
        qrSection.style.display = 'flex';
        if (qrSkeleton) qrSkeleton.style.display = 'flex';
        qrCode.style.display = 'none';

        qrCode.onload = () => {
            if (qrSkeleton) qrSkeleton.style.display = 'none';
            qrCode.style.display = 'block';
        };
        qrCode.onerror = () => {
            if (qrSkeleton) qrSkeleton.style.display = 'none';
            qrCode.style.display = 'none';
        };

        qrCode.src = data.qr_code;

        if (downloadQrBtn) {
            downloadQrBtn.style.display = 'inline-flex';
        }
        if (resultLayout) resultLayout.classList.remove('no-qr');
    } else {
        qrCode.src = '';
        qrSection.style.display = 'none';
        if (downloadQrBtn) {
            downloadQrBtn.style.display = 'none';
        }
        if (resultLayout) resultLayout.classList.add('no-qr');
    }
    
    document.getElementById('form').style.display = 'none';
    resultSection.style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyToClipboard(input, button) {
    const text = (input && input.value !== undefined) ? input.value : (typeof input === 'string' ? input : '');
    copyTextToClipboard(text, button, 'Copied to clipboard!');
}

function copyTextToClipboard(text, button, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    
    const fallbackCopy = () => {
        try {
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.left = '-9999px';
            temp.style.top = '-9999px';
            temp.setAttribute('readonly', '');
            document.body.appendChild(temp);
            temp.select();
            temp.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(temp);
            return true;
        } catch (e) {
            console.error('Fallback copy failed:', e);
            return false;
        }
    };

    const triggerSuccess = () => {
        if (button) {
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check" style="color:#10b981;"></i>';
            button.classList.add('copied');
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('copied');
            }, 2000);
        }
        showToast(successMsg);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(triggerSuccess)
            .catch(() => {
                if (fallbackCopy()) {
                    triggerSuccess();
                } else {
                    showToast('Failed to copy');
                }
            });
    } else {
        if (fallbackCopy()) {
            triggerSuccess();
        } else {
            showToast('Failed to copy');
        }
    }
}

async function shareLink() {
    const url = shortUrlInput.value;

    const shareData = {
        title: 'Shortened Link | Redirox',
        text: '⚡ Shortened with Redirox – Smart, secure, lightning-fast links 🚀',
        url: url
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return; 
        } catch (err) {
            console.log("Share canceled or failed:", err);
        }
    }

    if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
    } else {
        shortUrlInput.select();
        document.execCommand('copy');
        showToast("Link copied!");
    }
}

function downloadQrCode() {
    if (!qrCode.src) {
        showError('QR code is not available to download.');
        return;
    }

    const link = document.createElement('a');
    link.href = qrCode.src;
    link.download = 'redirox_qr.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('QR code downloaded!');
}

function resetForm() {
    shortenForm.reset();
    resultSection.style.display = 'none';
    document.getElementById('form').style.display = 'block';
    
    expiryPills.forEach(p => p.classList.remove('active'));
    document.querySelector('[data-value="never"]').classList.add('active');
    activeExpiryOption = 'never';
    customExpiryContainer.style.display = 'none';
    selectedExpiryDate = null;
    if (expiryDatePickerInstance && typeof expiryDatePickerInstance.destroy === 'function') {
        expiryDatePickerInstance.destroy();
        expiryDatePickerInstance = null;
    }
    if (expDateTime) {
        initExpiryPicker();
    }
    if (downloadQrBtn) {
        downloadQrBtn.style.display = 'none';
    }
    document.getElementById('generateQr').checked = false;
    
    hideError();
    urlInput.focus();
}

function togglePasswordVisibility() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    passwordToggleBtn.innerHTML = type === 'password' 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
}

themeToggle.addEventListener('click', toggleTheme);
passwordToggleBtn.addEventListener('click', togglePasswordVisibility);
shortenForm.addEventListener('submit', handleShortenSubmit);
if (copyBtn) copyBtn.addEventListener('click', () => copyToClipboard(shortUrlInput, copyBtn));
if (copyOriginalBtn) copyOriginalBtn.addEventListener('click', () => copyToClipboard(originalUrl, copyOriginalBtn));
if (shareBtn) shareBtn.addEventListener('click', shareLink);
if (downloadQrBtn) downloadQrBtn.addEventListener('click', downloadQrCode);
if (newLinkBtn) newLinkBtn.addEventListener('click', resetForm);

// SDK pip install copy button handler
const copyPipBtn = document.getElementById('copyPipBtn');
if (copyPipBtn) {
    copyPipBtn.addEventListener('click', () => {
        const cmd = document.getElementById('pipInstallText')?.textContent?.trim() || 'pip install redirox';
        copyTextToClipboard(cmd, copyPipBtn, 'Copied pip command!');
    });
}

// Support any other .copy-install-btn
document.querySelectorAll('.copy-install-btn').forEach(btn => {
    if (btn !== copyPipBtn) {
        btn.addEventListener('click', () => {
            const container = btn.closest('.sdk-install-box');
            const cmd = container ? container.querySelector('code')?.textContent?.trim() : 'pip install redirox';
            copyTextToClipboard(cmd || 'pip install redirox', btn, 'Copied pip command!');
        });
    }
});

// Clickable code block to copy
const pipCodeEl = document.getElementById('pipInstallText');
if (pipCodeEl) {
    pipCodeEl.style.cursor = 'pointer';
    pipCodeEl.title = 'Click to copy';
    pipCodeEl.addEventListener('click', () => {
        const cmd = pipCodeEl.textContent?.trim() || 'pip install redirox';
        copyTextToClipboard(cmd, copyPipBtn, 'Copied pip command!');
    });
}

initTheme();
