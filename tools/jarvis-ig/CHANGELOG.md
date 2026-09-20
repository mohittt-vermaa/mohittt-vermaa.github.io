# Changelog

All notable changes to **Jarvis-IG** are documented here. Versioning follows [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`.

---

## [1.2.0] — 2026-09-18

### Fixed
- 🐛 **CRITICAL: Fixed "Your version of Instagram is out of date" login error.** The previous version pinned `instagrapi==2.1.2` (from May 2024), which sends outdated Instagram API version headers. Updated to use the **latest `instagrapi` (2.18.x+)** which is a pure Python wheel — installs on Termux without needing Rust or pydantic-core compilation.
- 🐛 Fixed missing `import time` that caused `NameError` when the reply loop started.
- 🐛 `--reset` flag now also clears the old session file (not just config), so stale sessions don't cause repeated "out of date" errors.
- 🐛 Added specific `UnknownError` handling with clear instructions to run `pip install --upgrade instagrapi` if the error persists.
- 🐛 Removed `pydantic<2` version pin — latest instagrapi handles its own pydantic dependency correctly.

### Changed
- ⬆️ Now installs **latest `instagrapi`** instead of pinning to `2.1.2` — automatically gets the correct Instagram API version.
- 📦 Version bumped to 1.2.0.
- 📝 Added `BOT_VERSION` constant and version display on startup.

---

## [1.1.0] — 2026-09-17

### Added
- 🧠 **Interactive first-time setup** — the bot now prompts for username, password, and custom auto-reply message directly in the terminal. No more editing config blocks in nano.
- 💾 Credentials are saved to `~/.ig_bot_config.json` and reused on subsequent runs.
- 🔁 `--reset` / `-r` CLI flag to wipe saved credentials and re-run the setup flow (useful for switching accounts or fixing a mistyped password).
- 📦 **Auto-install missing dependencies** on first run: `typing_extensions`, `PySocks`, `pycryptodomex`, `pydantic<2`, `instagrapi==2.1.2`.
- ⚠️ Clear error messages when Pillow is missing, with Termux-specific guidance (`pkg install python-pillow`).
- 📝 Full English README with badges, quick-start (3-command Termux install), PC setup, disclaimer, troubleshooting table, roadmap, and license.
- 🗂️ Added `CHANGELOG.md` (this file) and `.gitignore` protecting credentials.

### Fixed
- 🐛 Fixed `ModuleNotFoundError: No module named 'typing_extensions'` crash on Termux Python 3.13 — module is now auto-installed on first run.
- 🐛 Pin `pydantic<2` so `pydantic-core` (which requires a Rust compiler) is never pulled in — fixes Termux build failures caused by `instagrapi`'s pydantic v2 dependency.
- 🐛 Added Termux-compatible Pillow install instructions (use system package `python-pillow`, not `pip install pillow`, to avoid C compile errors).
- 🔧 Removed the `pip install --upgrade pip` step from setup instructions (blocked by Termux and unnecessary).

### Changed
- 📦 Pinned `instagrapi==2.1.2` for Termux/Python-3.13 compatibility.
- 🎨 Default auto-reply message polished to sound natural: *"Hey! Thanks for messaging me. This is Mohit's auto-reply bot — I'll get back to you personally very soon!"*
- ⏱️ Default polling interval set to **20 seconds** (was 15s) and action delay range to **4–12 seconds** for safer, more human-like behaviour.
- 🗂️ Project re-homed into its own standalone repository `mohittt-vermaa/Jarvis-IG` (removed from portfolio repo).

---

## [1.0.0] — 2026-09-16 (initial internal release, not publicly announced)

### Added
- ✅ Core auto-reply loop: polls recent DM threads, sends one auto-reply to brand-new incoming DMs.
- ✅ 2FA and Instagram challenge support.
- ✅ Session saving/loading to avoid repeated logins.
- ✅ Human-like random action delays.
- ✅ Rate-limit handling (auto-sleep 10 minutes on "Please wait a few minutes").
- ✅ Separate PC + Termux versions using `.env` / config blocks.
- ✅ Default polite short auto-reply.
