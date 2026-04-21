#!/bin/bash
# SessionLens V3 — Agent Swarm Launcher
# Runs all 5 agents in dependency order to build the complete app

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
MASTER_LOG="$LOG_DIR/swarm-run-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "$1" | tee -a "$MASTER_LOG"
}

divider() {
    log "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

check_build() {
    log "${YELLOW}🔨 Running build check...${NC}"
    cd "$SCRIPT_DIR/app"
    if npm run build >> "$MASTER_LOG" 2>&1; then
        log "${GREEN}✅ Build passed${NC}"
        cd "$SCRIPT_DIR"
        return 0
    else
        log "${RED}❌ Build FAILED${NC}"
        cd "$SCRIPT_DIR"
        return 1
    fi
}

run_agent() {
    local agent_name="$1"
    local agent_file="$2"
    local agent_prompt="$3"
    local color="$4"

    divider
    log "${color}🤖 Starting agent: ${agent_name}${NC}"
    log "${color}   File: ${agent_file}${NC}"
    log "${color}   Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    divider

    local agent_log="$LOG_DIR/${agent_name}-$(date +%H%M%S).log"

    if claude --print "$agent_prompt" \
        --allowedTools "Edit,Write,Bash,Read,Glob,Grep" \
        2>&1 | tee "$agent_log"; then
        log "${GREEN}✅ ${agent_name} completed${NC}"
    else
        log "${RED}❌ ${agent_name} FAILED — check $agent_log${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════
# MAIN MENU
# ═══════════════════════════════════════════════════════════

show_menu() {
    echo ""
    divider
    log "${CYAN}  SessionLens V3 — Agent Swarm Controller${NC}"
    divider
    echo ""
    echo "  1) Run FULL swarm (all phases, sequential)"
    echo "  2) Run Phase 1 only (Foundation)"
    echo "  3) Run Phase 2 only (UI + Analysis in parallel)"
    echo "  4) Run Phase 3 only (Integration)"
    echo "  5) Run Phase 4 only (Polish)"
    echo "  6) Run single agent (pick one)"
    echo "  7) Build check"
    echo "  8) Status (check progress log)"
    echo "  9) Exit"
    echo ""
    read -p "  Choose [1-9]: " choice
}

run_phase_1() {
    log "${PURPLE}═══ PHASE 1: FOUNDATION ═══${NC}"
    run_agent "foundation" "agents/01-foundation.md" \
        "You are the Foundation Builder agent. Read the file agents/01-foundation.md in the current directory and execute EVERY step described in it. The project root is $(pwd). Create the Next.js app in the app/ subdirectory. After completion, log your work to logs/PROGRESS.md. Do not ask questions — just execute." \
        "$PURPLE"

    if check_build; then
        log "${GREEN}Phase 1 COMPLETE ✅${NC}"
    else
        log "${RED}Phase 1 build failed — attempting auto-fix...${NC}"
        run_agent "foundation-fix" "agents/01-foundation.md" \
            "The project at $(pwd)/app has build errors. Run 'cd app && npm run build', read the errors, and fix every single one. Keep fixing until 'npm run build' passes cleanly." \
            "$RED"
    fi
}

run_phase_2() {
    log "${CYAN}═══ PHASE 2: PARALLEL BUILD (UI + Analysis Engine) ═══${NC}"

    # Run UI and Analysis agents in parallel
    run_agent "ui-engineer" "agents/02-ui-engineer.md" \
        "You are the UI Engineer agent. Read the file agents/02-ui-engineer.md in the current directory and execute EVERY step. The Next.js app is at $(pwd)/app with types in src/types/index.ts and mock data in src/lib/mock-data/. Build all 6 tab components and UI primitives. Log to logs/PROGRESS.md." \
        "$CYAN" &
    UI_PID=$!

    run_agent "analysis-engine" "agents/03-analysis-engine.md" \
        "You are the Analysis Engine agent. Read the file agents/03-analysis-engine.md in the current directory and execute EVERY step. The Next.js app is at $(pwd)/app with types in src/types/index.ts and mock data in src/lib/mock-data/. Build the complete analysis pipeline. Log to logs/PROGRESS.md." \
        "$GREEN" &
    ANALYSIS_PID=$!

    # Wait for both
    wait $UI_PID
    UI_EXIT=$?
    wait $ANALYSIS_PID
    ANALYSIS_EXIT=$?

    if [ $UI_EXIT -ne 0 ]; then
        log "${RED}UI Engineer agent failed${NC}"
    fi
    if [ $ANALYSIS_EXIT -ne 0 ]; then
        log "${RED}Analysis Engine agent failed${NC}"
    fi

    if check_build; then
        log "${GREEN}Phase 2 COMPLETE ✅${NC}"
    else
        log "${YELLOW}Phase 2 has build errors — Integration agent will fix these${NC}"
    fi
}

run_phase_3() {
    log "${YELLOW}═══ PHASE 3: INTEGRATION ═══${NC}"
    run_agent "integrator" "agents/04-integrator.md" \
        "You are the Integration agent. Read the file agents/04-integrator.md in the current directory and execute EVERY step. The Next.js app is at $(pwd)/app. All components and the analysis engine have been built by other agents. Wire everything together, fix ALL bugs, ensure the complete 16-step user flow works. Log to logs/PROGRESS.md." \
        "$YELLOW"

    if check_build; then
        log "${GREEN}Phase 3 COMPLETE ✅${NC}"
    else
        log "${RED}Phase 3 build failed — running fix pass...${NC}"
        run_agent "integrator-fix" "agents/04-integrator.md" \
            "The project at $(pwd)/app has build errors after integration. Run 'cd app && npm run build', read every error, and fix them all. Then verify the app works with 'npm run dev'." \
            "$RED"
    fi
}

run_phase_4() {
    log "${GREEN}═══ PHASE 4: POLISH ═══${NC}"
    run_agent "polisher" "agents/05-polisher.md" \
        "You are the Polish agent. Read the file agents/05-polisher.md in the current directory and execute EVERY step. The Next.js app is at $(pwd)/app and should be functional. Do a complete visual, UX, responsive, accessibility, and performance audit. Fix everything. Log to logs/PROGRESS.md." \
        "$GREEN"

    if check_build; then
        log "${GREEN}Phase 4 COMPLETE ✅${NC}"
        divider
        log "${GREEN}🎉 SessionLens V3 BUILD COMPLETE!${NC}"
        log "${GREEN}   Run: cd app && npm run dev${NC}"
        log "${GREEN}   Open: http://localhost:3000/dashboard${NC}"
        divider
    else
        log "${RED}Final build has issues — manual review needed${NC}"
    fi
}

run_full_swarm() {
    log "${PURPLE}Starting FULL SWARM — all 4 phases${NC}"
    local start_time=$(date +%s)

    run_phase_1
    run_phase_2
    run_phase_3
    run_phase_4

    local end_time=$(date +%s)
    local duration=$(( (end_time - start_time) / 60 ))
    divider
    log "${GREEN}Total swarm time: ${duration} minutes${NC}"
    divider
}

run_single_agent() {
    echo ""
    echo "  a) Foundation (01)"
    echo "  b) UI Engineer (02)"
    echo "  c) Analysis Engine (03)"
    echo "  d) Integrator (04)"
    echo "  e) Polisher (05)"
    echo ""
    read -p "  Choose [a-e]: " agent_choice

    case $agent_choice in
        a) run_agent "foundation" "agents/01-foundation.md" \
            "Read agents/01-foundation.md and execute every step. Project root: $(pwd). Create app in app/. Log to logs/PROGRESS.md." "$PURPLE" ;;
        b) run_agent "ui-engineer" "agents/02-ui-engineer.md" \
            "Read agents/02-ui-engineer.md and execute. App at $(pwd)/app. Log to logs/PROGRESS.md." "$CYAN" ;;
        c) run_agent "analysis-engine" "agents/03-analysis-engine.md" \
            "Read agents/03-analysis-engine.md and execute. App at $(pwd)/app. Log to logs/PROGRESS.md." "$GREEN" ;;
        d) run_agent "integrator" "agents/04-integrator.md" \
            "Read agents/04-integrator.md and execute. App at $(pwd)/app. Log to logs/PROGRESS.md." "$YELLOW" ;;
        e) run_agent "polisher" "agents/05-polisher.md" \
            "Read agents/05-polisher.md and execute. App at $(pwd)/app. Log to logs/PROGRESS.md." "$GREEN" ;;
        *) echo "Invalid choice" ;;
    esac
}

check_status() {
    divider
    log "${CYAN}📋 Progress Log:${NC}"
    divider
    if [ -f "$LOG_DIR/PROGRESS.md" ]; then
        cat "$LOG_DIR/PROGRESS.md"
    else
        echo "  No progress logged yet. Run Phase 1 to start."
    fi
    echo ""
}

# ═══════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════

# If argument provided, run that phase directly
case "${1:-}" in
    --full)     run_full_swarm; exit 0 ;;
    --phase1)   run_phase_1; exit 0 ;;
    --phase2)   run_phase_2; exit 0 ;;
    --phase3)   run_phase_3; exit 0 ;;
    --phase4)   run_phase_4; exit 0 ;;
    --status)   check_status; exit 0 ;;
esac

# Interactive menu
while true; do
    show_menu
    case $choice in
        1) run_full_swarm ;;
        2) run_phase_1 ;;
        3) run_phase_2 ;;
        4) run_phase_3 ;;
        5) run_phase_4 ;;
        6) run_single_agent ;;
        7) check_build ;;
        8) check_status ;;
        9) log "Exiting."; exit 0 ;;
        *) echo "Invalid choice" ;;
    esac
done
