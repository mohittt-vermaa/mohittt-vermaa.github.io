# 🤖 Jarvis-IG — Instagram Auto-Reply Bot

<div align="center">

[![Version](https://img.shields.io/badge/version-1.2.0-6d28d9?style=for-the-badge)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/platform-Termux_%7C_Android_%7C_PC_%7C_Mac_%7C_Linux-EC4899?style=for-the-badge&logo=android&logoColor=white)](#-quick-start)
[![Made with](https://img.shields.io/badge/Made_with-❤️-ff6b9d?style=for-the-badge)](#-about)
[![Tutorial](https://img.shields.io/badge/📺_Setup_Tutorial-Watch_Now-22c55e?style=for-the-badge)](https://mohittt-vermaa.github.io/tools/tutorial.html)
[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-mohittt--vermaa.github.io-6d28d9?style=for-the-badge)](https://mohittt-vermaa.github.io/)

**A minimal, human-friendly Instagram DM auto-reply bot that runs on your own phone or laptop.** No servers, no accounts on third-party services, no code editing required — just run and answer a few prompts.

> *"Hey! 👋 Thanks for messaging me — I'll get back to you personally soon!"*

</div>

---

## ✨ Features

- 🔐 **Runs 100% on your own device** — your password never leaves your phone/laptop
- 🧠 **Interactive first-time setup** — no config files, no nano editing. Just run and answer prompts
- 💬 Auto-replies to **brand-new DMs** (won't interrupt ongoing conversations)
- ⚡ Saves your login session — no repeated 2FA / password prompts
- 🛡️ **2FA (Two-Factor) support** — prompts for 6-digit code when needed
- 🐢 **Human-like random delays** between actions to stay under the radar
- 🔄 Automatic rate-limit handling (sleeps when Instagram asks, then resumes)
- 📱 Runs on **Android via Termux**, Windows, Mac, Linux, Raspberry Pi, and cloud hosts
- 🔁 `--reset` flag to quickly change accounts / password
- 📏 **Polite-by-default reply** — ships with a friendly short message you can customise

---

## 🚀 Quick Start (Android / Termux — 30 seconds)

Copy-paste these **exact 3 commands** into Termux ([install Termux from F-Droid](https://f-droid.org/packages/com.termux/) — the Play Store version is outdated):

```bash
pkg update -y && pkg upgrade -y
pkg install python python-pillow libjpeg-turbo -y
rm -f ig_bot.py && curl -o ig_bot.py https://raw.githubusercontent.com/mohittt-vermaa/Jarvis-IG/main/jarvis_ig/ig_bot.py && python ig_bot.py
```

That's it. The bot will then ask you, right in the terminal:

1. Your Instagram username (without `@`)
2. Your Instagram password (hidden typing — no shoulder-surfing)
3. An optional custom auto-reply message (press Enter to use the friendly default)

It saves these to a hidden `~/.ig_bot_config.json` file on your device so you never have to type them again.

To change accounts/password later:
```bash
python ig_bot.py --reset
```

---

## 💻 Quick Start (PC / Mac / Linux)

Requires Python 3.9+ and [Pillow](https://pypi.org/project/Pillow/):

```bash
pip install Pillow instagrapi
curl -o ig_bot.py https://raw.githubusercontent.com/mohittt-vermaa/Jarvis-IG/main/jarvis_ig/ig_bot.py
python ig_bot.py
```

The same interactive prompts will appear on first run.

---

## ⚠️ Important Disclaimer

Instagram does **not** officially allow DM automation. This tool is designed for
**polite, low-volume personal auto-responses only** (e.g. "thanks for reaching out, I'll reply soon").
Do **not** use it for spam, marketing, mass messaging, or fast/aggressive replying — that risks
temporary or permanent action blocks on your account. The built-in delays (`4–12s` between actions,
`20s` polling) are safe defaults; please don't lower them.

### 🛡️ Safety Rules
1. **Never share your password** or the generated `~/.ig_session_mohit.json` / `~/.ig_bot_config.json` files with anyone.
2. Don't commit those files to GitHub (this repo's `.gitignore` blocks them).
3. Test with a secondary account first if you're unsure.
4. Keep the auto-reply short and friendly.

---

## 🔧 How It Works

Jarvis-IG polls your recent Instagram direct threads every 20 seconds. For each thread:
- It skips messages that **you** sent.
- By default (`only_new_threads = true`), it only replies to threads with exactly 1 unread message (i.e. a brand-new first DM), so it never jumps into the middle of an existing conversation.
- It sends your configured auto-reply once and remembers that thread so it doesn't double-reply.
- If Instagram rate-limits, it automatically sleeps 10 minutes and resumes.

Session saving means you only go through login/2FA once per device.

---

## 📁 Project Structure

```
Jarvis-IG/
├── jarvis_ig/
│   └── ig_bot.py          # The entire bot — single file, zero config needed
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT License
├── .gitignore             # Protects your credentials from being committed
└── README.md              # You are here
```

---

## 📱 Running 24/7 in the Background on Android

1. Run the bot once successfully so your session is saved.
2. Do **not** force-close Termux — just switch to another app.
3. Go to **Settings → Apps → Termux → Battery → Unrestricted** to disable battery optimization. Otherwise Android may kill the bot.

For true 24/7 even when your phone is off, host it on a free cloud:
- [PythonAnywhere](https://www.pythonanywhere.com/) (free tier works well)
- [Replit](https://replit.com/) (use Replit Secrets for credentials)
- [Render](https://render.com/) / [Railway](https://railway.app/) (~$5/month, rock solid)
- Raspberry Pi — perfect if you have one at home

---

## 🆘 Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'typing_extensions'` | Run `pip install typing_extensions` (first run of the latest bot does this automatically). |
| `pip install --upgrade pip` fails on Termux | Don't run it — Termux blocks it because it breaks the system pip. The bot doesn't need it. |
| "Challenge Required" / login fails | Open the Instagram app → *Settings → Security → Login activity* and approve the new login attempt, then re-run. |
| "Please wait a few minutes" | Instagram wants you to slow down. The bot automatically waits 10 minutes and resumes — just leave it running. |
| Bot stops when Termux is in background | Disable battery optimization (see Background section above). |
| Forgot my password / want to switch accounts | Run: `python ig_bot.py --reset` |
| Pillow fails to build on Termux | Use `pkg install python-pillow -y` (pre-compiled binary), not `pip install pillow`. |

---

## 🗺️ Roadmap

- [ ] Configurable reply templates (different messages for different keywords)
- [ ] Optional AI replies (GPT-style smart responses, opt-in)
- [ ] Discord/Telegram notification when a new DM arrives
- [ ] Web dashboard to see incoming DMs
- [ ] Better media/sticker handling

---

## 📬 Connect with Me

- 🌐 Portfolio: [mohittt-vermaa.github.io](https://mohittt-vermaa.github.io/)
- 💼 LinkedIn: [mohit-verma-a05570437](https://www.linkedin.com/in/mohit-verma-a05570437)
- 📸 Instagram: [@mohittt_vermaa0](https://www.instagram.com/mohittt_vermaa0/)
- 📝 Blog: [mohittt-vermaa.blogspot.com](https://mohittt-vermaa.blogspot.com/)
- ✍️ Hashnode: [@mohit-](https://hashnode.com/@mohit-)
- 📧 Email: mohitkumar190031@gmail.com

---

## 📜 License

Released under the [MIT License](LICENSE). Use it, modify it, ship it — just don't spam people with it. ❤️

<div align="center">
  <i>Built with ❤️ by Mohit Verma.</i><br>
  <i>Stay curious. Keep shipping. 🚀</i>
</div>
