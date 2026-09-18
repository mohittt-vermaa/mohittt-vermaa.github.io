#!/bin/bash
# Jarvis-IG Auto-Setup / Update Script
# Run: bash setup.sh
# Works for both first-time setup AND updating existing repo

set -e
echo "============================================"
echo "   Jarvis-IG Setup / Update"
echo "   by Mohit Verma | v1.2.0"
echo "============================================"
echo ""

# Step 1: Ask for GitHub token
echo "STEP 1: GitHub Personal Access Token"
echo "  -> Go to: github.com/settings/tokens?type=beta"
echo "  -> Generate new token (classic)"
echo "  -> Name: 'termux-push'"
echo "  -> Check 'repo' checkbox"
echo "  -> Generate & copy the token"
echo ""
read -sp "Paste your GitHub token (hidden): " GH_TOKEN
echo ""
if [ -z "$GH_TOKEN" ]; then
  echo "No token entered. Exiting."
  exit 1
fi

# Step 2: Clone or update Jarvis-IG repo
echo ""
echo "STEP 2: Getting Jarvis-IG repo..."
cd ~
if [ -d "Jarvis-IG" ]; then
  echo "  Existing repo found, pulling latest..."
  cd Jarvis-IG
  git pull origin main 2>/dev/null || true
else
  git clone "https://mohittt-vermaa:${GH_TOKEN}@github.com/mohittt-vermaa/Jarvis-IG.git"
  cd Jarvis-IG
fi
git config user.name "Mohit Verma"
git config user.email "mohitkumar190031@gmail.com"
# Set remote URL with token for push access
git remote set-url origin "https://mohittt-vermaa:${GH_TOKEN}@github.com/mohittt-vermaa/Jarvis-IG.git"

# Step 3: Download all files from portfolio repo
echo "STEP 3: Downloading latest bot files..."
BASE="https://raw.githubusercontent.com/mohittt-vermaa/mohittt-vermaa.github.io/main/tools/jarvis-ig"

for f in README.md CHANGELOG.md LICENSE .gitignore; do
  curl -sL "$BASE/$f" -o "$f"
  echo "  Updated: $f"
done

mkdir -p jarvis_ig
curl -sL "$BASE/jarvis_ig/ig_bot.py" -o "jarvis_ig/ig_bot.py"
echo "  Updated: jarvis_ig/ig_bot.py (v1.2.0)"

# Step 4: Commit and push
echo ""
echo "STEP 4: Pushing to GitHub..."
git add -A
CHANGES=$(git diff --cached --stat)
if [ -z "$CHANGES" ]; then
  echo "  Already up to date! No changes to push."
else
  git commit -m "v1.2.0: fix 'Instagram out of date' error — use latest instagrapi"
  git push origin main
  echo ""
  echo "============================================"
  echo "   DONE! Jarvis-IG updated on GitHub!"
  echo "   https://github.com/mohittt-vermaa/Jarvis-IG"
  echo "============================================"
fi

echo ""
echo "IMPORTANT: Revoke your token now:"
echo "  github.com/settings/tokens -> Delete the 'termux-push' token"
echo ""
echo "To run the bot:"
echo "  curl -o ig_bot.py https://raw.githubusercontent.com/mohittt-vermaa/Jarvis-IG/main/jarvis_ig/ig_bot.py"
echo "  python ig_bot.py"
echo ""
