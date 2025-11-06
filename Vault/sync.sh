#!/usr/bin/env bash
# /vault/sync.sh
# Daily vault sync script (macOS/Linux)

set -euo pipefail

timestamp="$(date +"%Y-%m-%d_%H-%M")"

# Resolve repo root (script is under repoRoot/vault)
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"

# Prefer AGI-CAD-Core/vault; fallback to root vault/
vault_a="$repo_root/AGI-CAD-Core/vault"
vault_b="$repo_root/vault"
if [ -d "$vault_a" ]; then
  vault_path="$vault_a"
elif [ -d "$vault_b" ]; then
  vault_path="$vault_b"
else
  echo "❌ Vault directory not found. Checked: $vault_a, $vault_b" >&2
  exit 1
fi

echo "🔄 AGI-CAD Vault Sync - ${timestamp}"
echo "📁 Using vault: $vault_path"

# 1) Detect changes under vault (scoped)
changes="$(git -C "$vault_path" diff --name-only -- . || true)"

if [ -n "$changes" ]; then
  echo "✅ Changes detected in vault:"
  echo "$changes"

  # 2) Auto-commit vault updates (scoped)
  git -C "$vault_path" add .
  git -C "$vault_path" commit -m "vault: auto-sync ${timestamp}" || true

  # 3) Update sync log (append NDJSON line, unified schema)
  if command -v jq >/dev/null 2>&1; then
    json_record=$(jq -n --arg ts "$timestamp" --arg ch "$changes" '{time:$ts, changes:$ch}')
  else
    # naive fallback; may not escape quotes/newlines
    json_record="{\"time\":\"$timestamp\",\"changes\":\"$changes\"}"
  fi
  echo "$json_record" >> "$vault_path/sync_log.json"
  echo "📝 Sync log updated (NDJSON)"
else
  echo "⏸️  No changes detected"
fi

# 4) Check if weekly audit is due
weekly_md="$vault_path/weekly_audit.md"
if [ -f "$weekly_md" ]; then
  # Get last modified epoch seconds (BSD vs GNU stat)
  if stat -f %m "$weekly_md" >/dev/null 2>&1; then
    last_epoch=$(stat -f %m "$weekly_md")
  else
    last_epoch=$(stat -c %Y "$weekly_md")
  fi
  now_epoch=$(date +%s)
  days_since=$(( (now_epoch - last_epoch) / 86400 ))
  if [ "$days_since" -ge 7 ]; then
    echo "⚠️  Weekly Claude audit is DUE (last run: ${days_since} days ago)"
    echo "→ Action: Open Claude and run 'deep-scan audit' command"
  fi
else
  echo "ℹ️  No weekly_audit.md found; skipping audit check"
fi

echo "✨ Sync complete"

# 5) Optional Gemini / Data Layer integration
if [ "${ENABLE_GEMINI_SYNC:-}" = "1" ]; then
  echo "🧠 Triggering Gemini data job (ENABLE_GEMINI_SYNC=1)"
  node "$repo_root/vault/gemini_trigger.js" || true
fi

# 6) Optional automated push
if [ "${ENABLE_VAULT_PUSH:-}" = "1" ]; then
  echo "📤 Pushing changes to origin/main (ENABLE_VAULT_PUSH=1)"
  git -C "$repo_root" push origin main || true
fi
