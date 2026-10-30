#!/usr/bin/env bash
# ==============================================================================
# Global to Local - Backend Keepalive & Auto-Restart Watchdog
# Port: 127.0.0.1:8008
# Usage: Run via cPanel Cron Job every 5 minutes:
#   */5 * * * * /bin/bash /path/to/scripts/keepalive_8008.sh >> /tmp/gtl_keepalive.log 2>&1
# ==============================================================================

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
HEALTH_URL="http://127.0.0.1:8008/api/v1/health/live"
LOG_FILE="/tmp/gtl_keepalive.log"
UVICORN_LOG="/tmp/gtl_uvicorn_8008.log"

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# 1. Probe the liveness health check endpoint
HTTP_STATUS=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")

if [ "${HTTP_STATUS}" = "200" ]; then
    # Server is responsive and healthy
    exit 0
fi

echo "[$(timestamp)] Keepalive: Backend port 8008 is unresponsive (HTTP ${HTTP_STATUS}). Initiating restart..." >> "${LOG_FILE}"

# 2. Check if any stale uvicorn process is clinging to port 8008 and terminate it cleanly
EXISTING_PID=$(lsof -t -i :8008 2>/dev/null || fuser 8008/tcp 2>/dev/null || pgrep -f "uvicorn.*8008" || true)

if [ -n "${EXISTING_PID}" ]; then
    echo "[$(timestamp)] Terminating stale process(es): ${EXISTING_PID}" >> "${LOG_FILE}"
    kill -15 ${EXISTING_PID} 2>/dev/null || true
    sleep 2
    kill -9 ${EXISTING_PID} 2>/dev/null || true
fi

# 3. Locate Python executable & environment
cd "${APP_DIR}" || exit 1

PYTHON_BIN="python3"
if [ -d "${APP_DIR}/venv" ] && [ -x "${APP_DIR}/venv/bin/python" ]; then
    PYTHON_BIN="${APP_DIR}/venv/bin/python"
elif [ -d "${APP_DIR}/.venv" ] && [ -x "${APP_DIR}/.venv/bin/python" ]; then
    PYTHON_BIN="${APP_DIR}/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
fi

# 4. Launch uvicorn daemon on 127.0.0.1:8008
echo "[$(timestamp)] Spawning backend process using ${PYTHON_BIN}..." >> "${LOG_FILE}"
nohup "${PYTHON_BIN}" -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --workers 1 >> "${UVICORN_LOG}" 2>&1 &
NEW_PID=$!

sleep 3

# 5. Final verification of new process
VERIFY_STATUS=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")
if [ "${VERIFY_STATUS}" = "200" ]; then
    echo "[$(timestamp)] Backend successfully recovered (PID: ${NEW_PID}, HTTP 200)." >> "${LOG_FILE}"
else
    echo "[$(timestamp)] Warning: Backend launched (PID: ${NEW_PID}), but health endpoint returned HTTP ${VERIFY_STATUS}. Check ${UVICORN_LOG}." >> "${LOG_FILE}"
fi
