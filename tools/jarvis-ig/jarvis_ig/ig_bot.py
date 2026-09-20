#!/usr/bin/env python3
r"""
===========================================================
  Mohit's Instagram Auto-Reply Bot — TERMUX / ANDROID / PC
===========================================================
SUPER EASY SETUP — no editing required. When you run it for
the first time, it will ASK YOU for your username & password
right in the terminal, then save them so you don't have to
enter them again.

-----------------------------------------------------------
  COPY-PASTE THESE COMMANDS IN TERMUX (one by one):
-----------------------------------------------------------
    pkg update -y && pkg upgrade -y
    pkg install python python-pillow libjpeg-turbo -y
    rm -f ig_bot.py
    curl -o ig_bot.py https://raw.githubusercontent.com/mohittt-vermaa/mohittt-vermaa.github.io/main/tools/jarvis-ig/jarvis_ig/ig_bot.py
    python ig_bot.py

Then just answer the prompts it shows you. Done.
On PC/Mac/Linux it works the same way (just install Python + Pillow first).

VERSION: 1.3.0 — monkey-patches Instagram API version to avoid "out of date" error
"""

import sys, os, subprocess, getpass, json, time
from pathlib import Path

CONFIG_FILE = Path.home() / ".ig_bot_config.json"
SESSION_FILE = Path.home() / ".ig_session_mohit.json"
BOT_VERSION = "1.3.0"


# ---------- install missing dependencies automatically ----------
def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

def ensure_deps():
    # Pillow on Termux must come from pkg install python-pillow
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        print(">>> Pillow not found. On Termux run:")
        print("    pkg install python-pillow -y")
        print("    On PC: pip install Pillow")
        sys.exit(1)

    # Pure-Python helper libs
    for mod, pip_name in [
        ("requests", "requests"),
        ("socks", "PySocks"),
        ("Cryptodome", "pycryptodomex"),
        ("typing_extensions", "typing_extensions"),
    ]:
        try:
            __import__(mod)
        except ImportError:
            print(f">>> Installing {pip_name}...")
            install(pip_name)

    # pydantic — try v2 first (preferred), fall back to v1 if build fails
    try:
        import pydantic  # noqa: F401
    except ImportError:
        print(">>> Installing pydantic...")
        try:
            install("pydantic")
        except Exception:
            print(">>> pydantic v2 build failed, installing v1...")
            install("pydantic<2")

    # instagrapi — install pinned version (2.1.2 works with pydantic v1)
    # We'll monkey-patch the API version below to fix "out of date" error
    try:
        import instagrapi  # noqa: F401
    except ImportError:
        print(">>> Installing instagrapi...")
        # Try latest first, fall back to2.1.2 if it fails
        try:
            install("instagrapi")
        except Exception:
            print(">>> Latest instagrapi failed, installing compatible version...")
            install("instagrapi==2.1.2")


ensure_deps()

from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired,
    ChallengeRequired,
    TwoFactorRequired,
    PleaseWaitFewMinutes,
    UnknownError,
)


# ---------- monkey-patch Instagram API version ----------
# Instagram changes their required app version frequently.
# instagrapi 2.1.2 (May 2024) sends an old version that Instagram rejects.
# We override the device settings with a RECENT Instagram app version.
IG_APP_VERSION   = "448.0.0.5.84"   # Latest as of Sep 2026
IG_VERSION_CODE  = "497557863"      # Must match the app version
IG_ANDROID_VER   = 34
IG_ANDROID_REL   = "14"
IG_DPI           = "480dpi"
IG_RESOLUTION    = "1344x2992"
IG_MANUFACTURER  = "Google"
IG_DEVICE        = "husky"
IG_MODEL         = "Pixel 8 Pro"
IG_CPU           = "husky"
IG_LOCALE        = "en_US"
IG_BLOKS_ID      = "7189b949425f9bf80ea8bd880cf5a3080b292d9b1c4b38a18d112f7c4b71e7a8"

PATCHED_USER_AGENT = (
    f"Instagram {IG_APP_VERSION} Android "
    f"({IG_ANDROID_VER}/{IG_ANDROID_REL}; {IG_DPI}; {IG_RESOLUTION}; "
    f"{IG_MANUFACTURER}; {IG_DEVICE}; {IG_MODEL}; {IG_CPU}; "
    f"{IG_LOCALE}; {IG_VERSION_CODE})"
)


def patch_client_version(cl):
    """Override instagrapi's device settings with a recent Instagram app version."""
    try:
        cl.device_settings.update({
            "app_version": IG_APP_VERSION,
            "version_code": IG_VERSION_CODE,
            "android_version": IG_ANDROID_VER,
            "android_release": IG_ANDROID_REL,
            "dpi": IG_DPI,
            "resolution": IG_RESOLUTION,
            "manufacturer": IG_MANUFACTURER,
            "device": IG_DEVICE,
            "model": IG_MODEL,
            "cpu": IG_CPU,
            "bloks_versioning_id": IG_BLOKS_ID,
        })
        # Also patch the User-Agent in the session headers
        if hasattr(cl, "session") and hasattr(cl.session, "headers"):
            cl.session.headers["User-Agent"] = PATCHED_USER_AGENT
        if hasattr(cl, "user_agent"):
            cl._user_agent = PATCHED_USER_AGENT
    except Exception as e:
        print(f"[warn] Could not patch API version: {e}")
        print("       Bot may still work — trying anyway.")


# ---------- super easy credentials: ask in terminal on first run ----------
def load_config():
    if CONFIG_FILE.exists():
        try:
            cfg = json.loads(CONFIG_FILE.read_text())
            if cfg.get("username") and cfg.get("password"):
                return cfg
        except Exception:
            pass
    return {}


def ask_config():
    print()
    print("=" * 56)
    print("  FIRST TIME SETUP")
    print("  Please enter your Instagram login details.")
    print(f"  (Your password stays on YOUR phone — it is saved")
    print(f"   only to the hidden file ~/.ig_bot_config.json)")
    print("=" * 56)
    while True:
        username = input("Instagram username (without @): ").strip().lstrip("@")
        if username:
            break
        print("Please type your username.")
    while True:
        password = getpass.getpass("Instagram password: ").strip()
        if password:
            break
        print("Please type your password.")
    msg_default = (
        "Hey! Thanks for messaging me. "
        "This is Mohit's auto-reply bot — I'll get back to you personally very soon!"
    )
    print()
    print(f"Auto-reply message (press Enter to use the default):")
    print(f"  > {msg_default}")
    custom_msg = input("Custom message (or Enter for default): ").strip()
    message = custom_msg if custom_msg else msg_default

    cfg = {
        "username": username,
        "password": password,
        "auto_reply": message,
        "only_new_threads": True,
        "poll_interval": 20,
        "delay_min": 4,
        "delay_max": 12,
    }
    try:
        CONFIG_FILE.write_text(json.dumps(cfg, indent=2))
        print(f"\n>>> Saved! You can edit later by running: nano {CONFIG_FILE}")
    except Exception as e:
        print(f"\n>>> Note: could not save config ({e}); you'll be asked again next run.")
    return cfg


def reset_config():
    for f in [CONFIG_FILE, SESSION_FILE]:
        if f.exists():
            try:
                f.unlink()
            except Exception:
                pass


# If user passes --reset flag, wipe saved config first
if "--reset" in sys.argv or "-r" in sys.argv:
    reset_config()
    print(">>> Cleared saved login info AND old session. Will ask for fresh details.")

cfg = load_config()
if not cfg:
    cfg = ask_config()

USERNAME             = cfg["username"]
PASSWORD             = cfg["password"]
AUTO_REPLY_MESSAGE   = cfg.get("auto_reply")
REPLY_ONLY_NEW       = cfg.get("only_new_threads", True)
POLL_INTERVAL        = int(cfg.get("poll_interval", 20))
DELAY_MIN            = int(cfg.get("delay_min", 4))
DELAY_MAX            = int(cfg.get("delay_max", 12))

if not AUTO_REPLY_MESSAGE:
    AUTO_REPLY_MESSAGE = (
        "Hey! Thanks for messaging me. "
        "This is Mohit's auto-reply bot — I'll get back to you personally very soon!"
    )


cl = Client()
cl.delay_range = [DELAY_MIN, DELAY_MAX]
seen_threads: set = set()

# PATCH: Override the Instagram app version to avoid "out of date" error
patch_client_version(cl)
print(f"[patch] Instagram API version patched to {IG_APP_VERSION}")


def save_session():
    try:
        SESSION_FILE.write_text(cl.get_settings())
    except Exception:
        pass


def load_session():
    if SESSION_FILE.exists():
        try:
            cl.load_settings(str(SESSION_FILE))
            # Re-apply version patch after loading session (session may override it)
            patch_client_version(cl)
            return True
        except Exception:
            pass
    return False


def login():
    if load_session():
        try:
            cl.login(USERNAME, PASSWORD)
            print(f"[ok] Logged in as @{USERNAME} (saved session).")
            return
        except Exception:
            print("[session] Saved session expired; logging in fresh...")
            # Clear stale session so it doesn't keep failing
            if SESSION_FILE.exists():
                try:
                    SESSION_FILE.unlink()
                except Exception:
                    pass
    try:
        patch_client_version(cl)
        cl.login(USERNAME, PASSWORD)
    except TwoFactorRequired:
        code = input("[2fa] Enter the 6-digit code from SMS/Auth app: ").strip()
        cl.login(USERNAME, PASSWORD, verification_code=code)
    except ChallengeRequired:
        print("[challenge] Instagram needs a security check.")
        print("            Open Instagram app -> 'Was this you?' -> Approve it.")
        input("            Press Enter AFTER you approved, then I'll continue...")
        try:
            cl.login(USERNAME, PASSWORD)
        except Exception:
            pass
    except UnknownError as e:
        err_msg = str(e).lower()
        if "out of date" in err_msg or "upgrade" in err_msg:
            print()
            print("=" * 60)
            print("  Instagram is REJECTING the login even after version patch.")
            print("  This means Instagram changed their API protocol recently.")
            print()
            print("  WORKAROUND OPTIONS:")
            print("  1. Run on PC/laptop instead of Termux:")
            print("     pip install instagrapi && python ig_bot.py")
            print()
            print("  2. Use cloud hosting (PythonAnywhere / Render / Railway)")
            print()
            print("  3. Wait for instagrapi to release a fix for Termux")
            print("     (check: github.com/subzeroid/instagrapi/issues)")
            print("=" * 60)
        else:
            print(f"[login] UnknownError: {e}")
        print("         -> Try: python ig_bot.py --reset")
        sys.exit(1)
    except Exception as e:
        print(f"[login] {type(e).__name__}: {e}")
        print("         -> Wrong password/2FA code? Run with --reset to re-enter:")
        print("              python ig_bot.py --reset")
        sys.exit(1)
    save_session()
    print(f"[ok] Logged in as @{USERNAME}!")


def reply_loop():
    print()
    print("=" * 62)
    print("  Mohit's IG Auto-Reply is LIVE  (Ctrl+C to stop)")
    print(f"  Reply message    : {AUTO_REPLY_MESSAGE[:80]}{'...' if len(AUTO_REPLY_MESSAGE) > 80 else ''}")
    print(f"  New threads only : {REPLY_ONLY_NEW}")
    print(f"  Check interval   : {POLL_INTERVAL}s")
    print("  To change login later, run:  python ig_bot.py --reset")
    print("=" * 62)
    print()

    while True:
        try:
            threads = cl.direct_threads(amount=20)
            for t in threads:
                if not getattr(t, "messages", None):
                    continue
                last = t.messages[0]
                key = f"{t.id}:{last.id}"
                if key in seen_threads:
                    continue
                me_id = cl.user_id
                if str(getattr(last, "user_id", "")) == str(me_id):
                    seen_threads.add(key)
                    continue
                if REPLY_ONLY_NEW and len(t.messages) != 1:
                    seen_threads.add(key)
                    continue

                seen_threads.add(key)
                sender = last.user_id
                sender_name = "someone"
                try:
                    for u in t.users:
                        if str(u.pk) == str(sender):
                            sender_name = u.username
                            break
                except Exception:
                    pass
                preview = (last.text or "[media/sticker]")[:60]
                print(f"[dm] New DM from @{sender_name}: {preview}")
                try:
                    cl.direct_send(AUTO_REPLY_MESSAGE, thread_ids=[t.id])
                    print("     -> Auto-reply sent.")
                except Exception as e:
                    print(f"     !! Could not send reply: {e}")

            time.sleep(POLL_INTERVAL)
        except PleaseWaitFewMinutes:
            print("[rate] Instagram asked us to slow down; sleeping 10 minutes...")
            time.sleep(600)
        except LoginRequired:
            print("[auth] Session expired; logging back in...")
            # Clear stale session
            if SESSION_FILE.exists():
                try:
                    SESSION_FILE.unlink()
                except Exception:
                    pass
            patch_client_version(cl)
            try:
                login()
            except Exception:
                time.sleep(60)
        except KeyboardInterrupt:
            print("\n[stop] Bot stopped. Goodbye!")
            break
        except Exception as e:
            print(f"[error] {type(e).__name__}: {e}")
            time.sleep(30)


if __name__ == "__main__":
    print("=" * 62)
    print(f"   MOHIT's IG AUTO-REPLY BOT   v{BOT_VERSION}")
    print(f"   (Termux / Phone / PC)")
    print("=" * 62)
    login()
    reply_loop()
