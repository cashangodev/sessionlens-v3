# SessionLens V3 — Agent Swarm Launcher (Windows PowerShell)
# Runs all 5 agents in dependency order to build the complete app

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Logging
$LogDir = Join-Path $ScriptDir "logs"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$MasterLog = Join-Path $LogDir "swarm-run-$Timestamp.log"

function Log($msg) {
    Write-Host $msg
    Add-Content -Path $MasterLog -Value $msg
}

function Divider() {
    Log "================================================================"
}

function Check-Build() {
    Log "Building project..."
    Push-Location (Join-Path $ScriptDir "app")
    try {
        $output = npm run build 2>&1
        $output | Add-Content -Path $MasterLog
        if ($LASTEXITCODE -eq 0) {
            Log "[OK] Build passed"
            return $true
        } else {
            Log "[FAIL] Build FAILED"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Run-Agent($AgentName, $AgentFile, $Prompt) {
    Divider
    Log "[AGENT] Starting: $AgentName"
    Log "[TIME]  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Divider

    $AgentLog = Join-Path $LogDir "$AgentName-$(Get-Date -Format 'HHmmss').log"

    try {
        claude --print $Prompt --allowedTools "Edit,Write,Bash,Read,Glob,Grep" 2>&1 | Tee-Object -FilePath $AgentLog
        if ($LASTEXITCODE -eq 0) {
            Log "[OK] $AgentName completed"
        } else {
            Log "[FAIL] $AgentName failed - check $AgentLog"
        }
    } catch {
        Log "[ERROR] $AgentName crashed: $_"
    }
}

function Run-Phase1() {
    Log ""
    Log "=== PHASE 1: FOUNDATION ==="
    Run-Agent "foundation" "agents/01-foundation.md" `
        "You are the Foundation Builder agent. Read the file agents/01-foundation.md in the current directory and execute EVERY step described in it. The project root is $ScriptDir. Create the Next.js app in the app/ subdirectory. After completion, log your work to logs/PROGRESS.md. Do not ask questions - just execute."

    if (Check-Build) {
        Log "Phase 1 COMPLETE"
    } else {
        Log "Phase 1 build failed - running fix pass..."
        Run-Agent "foundation-fix" "agents/01-foundation.md" `
            "The project at $ScriptDir/app has build errors. Run 'cd app; npm run build', read the errors, and fix every single one. Keep fixing until 'npm run build' passes cleanly."
    }
}

function Run-Phase2() {
    Log ""
    Log "=== PHASE 2: PARALLEL BUILD (UI + Analysis) ==="

    # Run UI Engineer
    $uiJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        claude --print "You are the UI Engineer agent. Read the file agents/02-ui-engineer.md in the current directory and execute EVERY step. The Next.js app is at $dir/app with types in src/types/index.ts and mock data in src/lib/mock-data/. Build all 6 tab components and UI primitives. Log to logs/PROGRESS.md." --allowedTools "Edit,Write,Bash,Read,Glob,Grep" 2>&1
    } -ArgumentList $ScriptDir

    # Run Analysis Engine
    $analysisJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        claude --print "You are the Analysis Engine agent. Read the file agents/03-analysis-engine.md in the current directory and execute EVERY step. The Next.js app is at $dir/app with types in src/types/index.ts and mock data in src/lib/mock-data/. Build the complete analysis pipeline. Log to logs/PROGRESS.md." --allowedTools "Edit,Write,Bash,Read,Glob,Grep" 2>&1
    } -ArgumentList $ScriptDir

    Log "Waiting for UI Engineer and Analysis Engine to finish..."
    $uiResult = Receive-Job -Job $uiJob -Wait
    $analysisResult = Receive-Job -Job $analysisJob -Wait

    $uiResult | Add-Content -Path (Join-Path $LogDir "ui-engineer.log")
    $analysisResult | Add-Content -Path (Join-Path $LogDir "analysis-engine.log")

    Remove-Job $uiJob, $analysisJob

    if (Check-Build) {
        Log "Phase 2 COMPLETE"
    } else {
        Log "Phase 2 has build errors - Integration agent will fix these"
    }
}

function Run-Phase3() {
    Log ""
    Log "=== PHASE 3: INTEGRATION ==="
    Run-Agent "integrator" "agents/04-integrator.md" `
        "You are the Integration agent. Read the file agents/04-integrator.md in the current directory and execute EVERY step. The Next.js app is at $ScriptDir/app. All components and the analysis engine have been built by other agents. Wire everything together, fix ALL bugs, ensure the complete 16-step user flow works. Log to logs/PROGRESS.md."

    if (Check-Build) {
        Log "Phase 3 COMPLETE"
    } else {
        Log "Phase 3 build failed - running fix pass..."
        Run-Agent "integrator-fix" "agents/04-integrator.md" `
            "The project at $ScriptDir/app has build errors after integration. Run 'cd app; npm run build', read every error, and fix them all."
    }
}

function Run-Phase4() {
    Log ""
    Log "=== PHASE 4: POLISH ==="
    Run-Agent "polisher" "agents/05-polisher.md" `
        "You are the Polish agent. Read the file agents/05-polisher.md in the current directory and execute EVERY step. The Next.js app is at $ScriptDir/app and should be functional. Do a complete visual, UX, responsive, accessibility, and performance audit. Fix everything. Log to logs/PROGRESS.md."

    if (Check-Build) {
        Divider
        Log "SessionLens V3 BUILD COMPLETE!"
        Log "Run: cd app; npm run dev"
        Log "Open: http://localhost:3000/dashboard"
        Divider
    } else {
        Log "Final build has issues - manual review needed"
    }
}

function Run-FullSwarm() {
    Log "Starting FULL SWARM - all 4 phases"
    $startTime = Get-Date

    Run-Phase1
    Run-Phase2
    Run-Phase3
    Run-Phase4

    $duration = ((Get-Date) - $startTime).TotalMinutes
    Divider
    Log "Total swarm time: $([math]::Round($duration, 1)) minutes"
    Divider
}

# ================================================================
# MAIN MENU
# ================================================================

function Show-Menu() {
    Write-Host ""
    Divider
    Write-Host "  SessionLens V3 - Agent Swarm Controller" -ForegroundColor Cyan
    Divider
    Write-Host ""
    Write-Host "  1) Run FULL swarm (all phases)"
    Write-Host "  2) Run Phase 1 only (Foundation)"
    Write-Host "  3) Run Phase 2 only (UI + Analysis in parallel)"
    Write-Host "  4) Run Phase 3 only (Integration)"
    Write-Host "  5) Run Phase 4 only (Polish)"
    Write-Host "  6) Build check"
    Write-Host "  7) Status (check progress log)"
    Write-Host "  8) Exit"
    Write-Host ""
}

# Handle command-line arguments
if ($args.Count -gt 0) {
    switch ($args[0]) {
        "--full"   { Run-FullSwarm; exit 0 }
        "--phase1" { Run-Phase1; exit 0 }
        "--phase2" { Run-Phase2; exit 0 }
        "--phase3" { Run-Phase3; exit 0 }
        "--phase4" { Run-Phase4; exit 0 }
        "--status" { if (Test-Path (Join-Path $LogDir "PROGRESS.md")) { Get-Content (Join-Path $LogDir "PROGRESS.md") } else { Write-Host "No progress yet." }; exit 0 }
    }
}

# Interactive menu loop
while ($true) {
    Show-Menu
    $choice = Read-Host "  Choose [1-8]"

    switch ($choice) {
        "1" { Run-FullSwarm }
        "2" { Run-Phase1 }
        "3" { Run-Phase2 }
        "4" { Run-Phase3 }
        "5" { Run-Phase4 }
        "6" { Check-Build }
        "7" {
            $progressFile = Join-Path $LogDir "PROGRESS.md"
            if (Test-Path $progressFile) { Get-Content $progressFile } else { Write-Host "No progress yet. Run Phase 1 to start." }
        }
        "8" { Log "Exiting."; exit 0 }
        default { Write-Host "Invalid choice" }
    }
}
