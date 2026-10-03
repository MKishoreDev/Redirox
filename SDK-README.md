<p align="center">
  <img src="https://raw.githubusercontent.com/MKishoreDev/redirox-pypi/refs/heads/main/banner-rediox.png" alt="Redirox Banner">
</p>

<h1 align="center">Redirox</h1>

<h3 align="center">
🚀 Smart Links. Clean Routes.
</h3>

<p align="center">
  Modern Python SDK for the Redirox URL Shortener
</p>

<p align="center">
  <a href="https://pypi.org/project/redirox/">
    <img src="https://img.shields.io/pypi/v/redirox?style=for-the-badge&color=7c3aed" alt="PyPI">
  </a>

  <a href="https://pypi.org/project/redirox/">
    <img src="https://img.shields.io/pypi/pyversions/redirox?style=for-the-badge&color=2563eb" alt="Python Versions">
  </a>

  <a href="https://github.com/MKishoreDev/redirox-pypi/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/MKishoreDev/redirox-pypi?style=for-the-badge&color=111827" alt="License">
  </a>
</p>

<p align="center">
  <a href="https://redirox.pages.dev">
    <img src="https://img.shields.io/badge/Website-Redirox-111827?style=flat-square&logo=cloudflare">
  </a>

  <a href="https://github.com/MKishoreDev/redirox-pypi">
    <img src="https://img.shields.io/badge/GitHub-redirox--pypi-111827?style=flat-square&logo=github">
  </a>

  <a href="https://github.com/MKishoreDev/Redirox">
    <img src="https://img.shields.io/badge/Open%20Source-Redirox%20Website-7c3aed?style=flat-square&logo=github">
  </a>

  <img src="https://img.shields.io/badge/Made%20With-Python-7c3aed?style=flat-square&logo=python">
</p>

---

# 🌌 About

Redirox is a lightweight and modern URL shortener built for developers.

I always wondered:

> “Can a URL shortener be both powerful and minimal?”

So I built Redirox with one goal:

- ⚡ Fast
- 🎯 Minimal
- 🔒 Secure
- 🧩 Developer friendly

The platform is live at:

🔗 https://redirox.pages.dev

The complete Redirox website is also fully open source.

💻 Website Repository:
https://github.com/MKishoreDev/Redirox

After building the platform, I decided to create an official PyPI package so developers can integrate Redirox directly into Python applications, scripts, automation workflows, and Telegram bots.

---

# ✨ Features

- 🔗 Smart URL shortening
- 🔒 Password protected links
- ⏳ Expiration support
- 📱 QR code generation
- ⚡ Fast redirects
- 🪶 Lightweight SDK
- 🐍 Pythonic API
- 🤖 Telegram bot support using Pyrogram
- 🌐 Clean developer experience

---

# 📦 Installation

## Basic Installation

```bash
pip install redirox
```

---

## Install with Telegram Bot Support

```bash
pip install pyrogram tgcrypto
```

---

# ⚡ Quick Start

```python
from redirox import Redirox

client = Redirox()

result = client.shorten(
    "https://google.com"
)

print(result)
```

---

# 🔗 Shorten URLs

```python
from redirox import Redirox

client = Redirox()

result = client.shorten(
    "https://example.com"
)

print("Short URL:", result["short_url"])
```

---

# 🔒 Password Protected Links

```python
from redirox import Redirox

client = Redirox()

result = client.shorten(
    "https://example.com",
    password="mypassword"
)

print(result)
```

---

# ⏳ Expiring Links

```python
from redirox import Redirox
from datetime import datetime, timedelta, timezone

client = Redirox()

expires_at = (
    datetime.now(timezone.utc) + timedelta(hours=1)
).isoformat()

result = client.shorten(
    "https://example.com",
    expires_at=expires_at
)

print(result["expires_at"])
```

---

# 📱 Generate QR Codes

```python
from redirox import Redirox

client = Redirox()

result = client.shorten(
    "https://github.com",
    generate_qr=True
)

print(result["qr_code"])
```

---

# 💾 Save QR Code as PNG

```python
import base64

qr_data = result["qr_code"].split(",")[1]

with open("qr.png", "wb") as f:
    f.write(base64.b64decode(qr_data))

print("QR Code saved!")
```

---

# 📊 Get Link Information

```python
from redirox import Redirox

client = Redirox()

info = client.info("abc123")

print("Original URL:", info["url"])
print("Total visits:", info["visits"])
print("Has password:", info["has_password"])
```

---

# 🔑 Verify Link Password

Verify passwords for protected links programmatically:

```python
from redirox import Redirox, RediroxAuthError

client = Redirox()

try:
    check = client.verify("abc123", "mypassword")
    print("Password verified successfully! Destination:", check.get("url"))
except RediroxAuthError:
    print("Incorrect password!")
```

---

# ⚙️ Configuration & Custom Base URL

```python
from redirox import Redirox

# Custom base URL and custom request timeout (in seconds)
client = Redirox(
    base_url="https://redirox.pages.dev",
    timeout=20
)
```

---

# ⚠️ Error Handling & Custom Exceptions

The Redirox SDK provides dedicated exception classes so your applications can catch and handle specific errors gracefully:

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
    # 1. Shorten a link
    result = client.shorten("https://example.com", password="secretpassword")
    print("Created:", result["short_url"])

    # 2. Look up link metadata
    info = client.info(result["code"])
    print("Visits:", info["visits"])

    # 3. Verify link password
    client.verify(result["code"], "wrongpassword")

except RediroxValidationError as e:
    print("Validation error:", e)
except RediroxAuthError as e:
    print("Incorrect password:", e)
except RediroxNotFoundError as e:
    print("Link not found or expired:", e)
except RediroxConnectionError as e:
    print("Could not reach Redirox service:", e)
except RediroxAPIError as e:
    print(f"API Error ({e.status_code}):", e)
```

---

# 🤖 Telegram Bot Example (Pyrogram)

```python
import base64

from pyrogram import Client, filters
from redirox import Redirox

app = Client(
    "redirox-bot",
    api_id=12345,
    api_hash="YOUR_API_HASH",
    bot_token="YOUR_BOT_TOKEN"
)

redirox = Redirox()


@app.on_message(filters.text & filters.private)
async def shorten_link(client, message):
    url = message.text.strip()

    try:
        result = redirox.shorten(
            url,
            generate_qr=True
        )

        short_url = result["short_url"]
        qr_code = result["qr_code"]

        # Decode QR Code
        qr_data = qr_code.split(",")[1]

        with open("qr.png", "wb") as f:
            f.write(base64.b64decode(qr_data))

        # Send QR Code Image
        await message.reply_photo(
            photo="qr.png",
            caption=(
                f"🔗 **Short URL:**\n"
                f"{short_url}"
            )
        )

    except Exception as e:
        await message.reply_text(
            f"❌ Error:\n{e}"
        )


app.run()
```

---

# 📩 Example Telegram Bot Response

The Telegram bot will:

- 🔗 Shorten the URL
- 📱 Generate a QR code
- 🖼 Send the QR code as an image
- ⚡ Return the shortened link instantly

Perfect for:

- Telegram utility bots
- Channel management tools
- Automation workflows
- Link sharing bots

---

# 📄 Example Response

```python
{
    "code": "abc123",
    "short_url": "https://redirox.pages.dev/abc123",
    "url": "https://google.com",
    "qr_code": None,
    "expires_at": None,
    "has_password": False
}
```

---

# 🎯 Philosophy

Redirox focuses on simplicity.

No bloated dashboards.  
No forced signups.  
No unnecessary friction.

Just fast redirects, clean APIs, and developer-first workflows.

---

# 🌍 Open Source

Contributions are welcome!

You can help by:

- Fixing bugs
- Improving documentation
- Suggesting features
- Enhancing the SDK
- Creating integrations

Feel free to open issues or submit pull requests.

---

# 🔗 Links

| Platform | Link |
|---|---|
| 🌐 Website | https://redirox.pages.dev |
| 💻 Website Source | https://github.com/MKishoreDev/Redirox |
| 📦 PyPI | https://pypi.org/project/redirox/ |
| 🐍 SDK Repository | https://github.com/MKishoreDev/redirox-pypi |

---

# 📄 License

MIT License © Kishore M

---

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Passion-7c3aed?style=for-the-badge">
</p>

<p align="center">
  ❤️ Made with passion by Kishore M
</p>
