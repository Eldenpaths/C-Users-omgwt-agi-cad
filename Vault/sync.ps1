# /vault/sync.ps1
# Daily vault sync script (Windows PowerShell)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"

# Resolve repo root and prefer AGI-CAD-Core/vault; fallback to root vault/
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$vaultCandidateA = Join-Path $repoRoot "AGI-CAD-Core\vault"
$vaultCandidateB = Join-Path $repoRoot "vault"

if (Test-Path $vaultCandidateA) { $vaultPath = $vaultCandidateA }
elseif (Test-Path $vaultCandidateB) { $vaultPath = $vaultCandidateB }
else { throw "Vault directory not found. Checked: $vaultCandidateA, $vaultCandidateB" }

Write-Host "🔄 AGI-CAD Vault Sync - $timestamp"
Write-Host "📁 Using vault: $vaultPath"

Push-Location $vaultPath

# 1) Check for changes scoped to the vault directory
$changes = git diff --name-only -- .

if ($changes) {
    Write-Host "✅ Changes detected in vault:"
    Write-Host $changes

    # 2) Auto-commit vault updates (scoped to this folder)
    git add .
    git commit -m "vault: auto-sync $timestamp" | Out-Null

    # 3) Update sync log (append NDJSON line, unified schema)
    $ndjson = "{""time"":""$timestamp"",""changes"":""$changes""}"
    Add-Content -Path "sync_log.json" -Value $ndjson
    Write-Host "📝 Sync log updated (NDJSON)"
} else {
    Write-Host "⏸️  No changes detected"
}

# 4) Check if weekly audit is due
$lastAuditItem = Get-Item "weekly_audit.md" -ErrorAction SilentlyContinue
if ($lastAuditItem) {
    $daysSince = ((Get-Date) - $lastAuditItem.LastWriteTime).Days
    if ($daysSince -ge 7) {
        Write-Host "⚠️  Weekly Claude audit is DUE (last run: $daysSince days ago)"
        Write-Host "→ Action: Open Claude and run 'deep-scan audit' command"
    }
} else {
    Write-Host "ℹ️  No weekly_audit.md found; skipping audit check"
}

Pop-Location

# 5) Optional Gemini / Data Layer integration
if ($Env:ENABLE_GEMINI_SYNC -eq "1") {
    Write-Host "🧠 Triggering Gemini data job (ENABLE_GEMINI_SYNC=1)"
    node "$repoRoot/vault/gemini_trigger.js" 2>&1 | Write-Host
}

# 6) Optional automated push
if ($Env:ENABLE_VAULT_PUSH -eq "1") {
    Write-Host "📤 Pushing changes to origin/main (ENABLE_VAULT_PUSH=1)"
    Push-Location $repoRoot
    git push origin main
    Pop-Location
}

Write-Host "✨ Sync complete"
