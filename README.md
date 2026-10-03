<div align="center">

<img src="https://raw.githubusercontent.com/MKishoreDev/redirox-pypi/refs/heads/main/banner-rediox.png" alt="Redirox Banner" width="100%"/>

# 🚀 Redirox

### Smart Links. Clean Routes.

A minimal, modern, lightning-fast open-source URL shortener built with Flask and MongoDB.

[![Live Demo](https://img.shields.io/badge/Website-redirox.pages.dev-f38020?style=for-the-badge&logo=cloudflare)](https://redirox.pages.dev/)
[![PyPI](https://img.shields.io/pypi/v/redirox?style=for-the-badge&color=2563eb&logo=pypi)](https://pypi.org/project/redirox/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/redirox?style=for-the-badge&color=10b981)](https://pypi.org/project/redirox/)
[![Python Version](https://img.shields.io/pypi/pyversions/redirox?style=for-the-badge&color=f59e0b&logo=python)](https://pypi.org/project/redirox/)
[![License: MIT](https://img.shields.io/badge/License-MIT-111827?style=for-the-badge)](LICENSE)

<br/>

[🌐 Live Website](https://redirox.pages.dev) • [📖 Documentation](https://redirox.pages.dev/docs) • [📦 PyPI Package](https://pypi.org/project/redirox/) • [🐍 SDK Repo](https://github.com/MKishoreDev/redirox-pypi)

</div>

---

## ✨ Features

- 🔗 **Smart URL Shortening:** Generate clean, reliable short URLs instantly.
- 🔒 **Password Protection:** Secure sensitive links with bcrypt encryption.
- ⏳ **Custom Expiration:** Set auto-expiring links with standard ISO 8601 timestamps.
- 📱 **QR Code Generation:** Built-in downloadable high-resolution QR codes.
- 📊 **Link Analytics:** Track total visitor counts and metadata in real-time.
- 🌙 **Modern Dual Theme:** Refined Light and Dark mode UI with fluid responsive design.
- 🐍 **Official Python SDK:** Automate workflows and integrate directly with Python applications and Telegram bots.
- ⚡ **Zero Bloat:** No forced signups, no ads, and zero unnecessary friction.

---

## 🛠️ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=python,flask,mongodb,html,css,js" />

</div>

---

## ⚡ Quick Start with Python SDK

Redirox provides an official Python SDK published on [PyPI](https://pypi.org/project/redirox/).

### Installation

```bash
pip install redirox
```

### Usage

```python
from redirox import (
    Redirox,
    RediroxValidationError,
    RediroxAuthError,
    RediroxNotFoundError,
    RediroxConnectionError,
    RediroxAPIError,
)

client = Redirox()

try:
    # 1. Shorten a link with QR code & optional password
    result = client.shorten(
        "https://github.com/MKishoreDev/Redirox",
        password="mypassword",
        generate_qr=True
    )
    print("Short URL:", result["short_url"])

    # 2. Get link metadata & visit count
    info = client.info(result["code"])
    print(f"Total visits: {info['visits']}")

    # 3. Verify link password
    check = client.verify(result["code"], "mypassword")
    print("Password verified:", check["success"])

except RediroxValidationError as error:
    print("Invalid input:", error)
except RediroxAuthError as error:
    print("Incorrect password:", error)
except RediroxNotFoundError as error:
    print("Link not found / expired:", error)
except RediroxConnectionError as error:
    print("Connection error:", error)
except RediroxAPIError as error:
    print(f"API error ({error.status_code}):", error)
```

---

## 📡 REST API Reference

The Redirox backend exposes clean JSON endpoints for developers.

### 1. Shorten URL
`POST /shorten`

**Payload:**
```json
{
  "url": "https://example.com",
  "password": "optional_password",
  "expires_at": "2026-12-31T23:59:59Z",
  "generate_qr": true
}
```

**Response:** `200 OK`
```json
{
  "code": "aB3x9z",
  "short_url": "https://redirox.pages.dev/aB3x9z",
  "url": "https://example.com",
  "qr_code": "data:image/png;base64,...",
  "expires_at": "2026-12-31T23:59:59",
  "has_password": true
}
```

### 2. Get Link Information
`GET /info/<code>`

**Response:** `200 OK`
```json
{
  "code": "aB3x9z",
  "url": "https://example.com",
  "visits": 42,
  "created_at": "2026-10-01T10:00:00",
  "expires_at": "2026-12-31T23:59:59",
  "has_password": true
}
```

### 3. Verify Password
`POST /verify/<code>`

**Payload:**
```json
{
  "password": "mypassword"
}
```

---

## 💻 Local Development Setup

Clone the repository and run the application locally in 3 steps:

### 1. Clone the repository
```bash
git clone https://github.com/MKishoreDev/Redirox.git
cd Redirox
```

### 2. Install dependencies
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure and run
```bash
# Set your MongoDB connection string (or defaults to localhost:27017)
export MONGO_URI="mongodb://localhost:27017" # On Windows PowerShell: $env:MONGO_URI="mongodb://localhost:27017"

python app.py
```

The application will be running at `http://127.0.0.1:5000/`.

---

## 📂 Project Structure

```
Redirox/
├── app.py              # Main Flask application and REST API endpoints
├── requirements.txt    # Python package dependencies
├── vercel.json         # Vercel serverless deployment config
├── templates/
│   ├── index.html      # Landing page & shortener interface
│   ├── docs.html       # Official Python SDK documentation portal
│   ├── password.html   # Password authentication gate
│   └── 404.html        # Custom 404 error page
├── static/
│   ├── style.css       # Core design system & theme variables
│   ├── script.js       # Shortener frontend interactions
│   ├── docs.css        # Documentation stylesheet
│   ├── docs.js         # Docs copy buttons & scrollspy
│   ├── datepicker.js   # Date & time picker engine
│   ├── password.js     # Password verification logic
│   ├── 404.js          # 404 page script
│   └── redirox.png     # Brand logo asset
├── LICENSE             # MIT License (Kishore M)
└── SDK-README.md       # Python SDK standalone guide
```

---

## 🤝 Contributing

Contributions, feedback, and pull requests are welcome!

1. **Fork** the project
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

<div align="center">

⭐ **If you find Redirox useful, please consider giving it a star on GitHub!** ⭐

Made with ❤️ by [Kishore M](https://github.com/MKishoreDev)

</div>
