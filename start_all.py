"""
Global to Local — One-Command Startup
Starts Docker (Postgres + Redis), applies migrations, seeds DB,
starts FastAPI backend (port 8000), and starts Vite frontend (port 5173).
"""

import sys
import os
import time
import socket
import subprocess
import signal

def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, ConnectionRefusedError):
        return False

def wait_for_port(host: str, port: int, name: str, timeout: float = 30.0):
    start = time.time()
    sys.stdout.write(f"[*] Waiting for {name} ({host}:{port})... ")
    sys.stdout.flush()
    while time.time() - start < timeout:
        if is_port_open(host, port, 0.5):
            print("READY.")
            return True
        time.sleep(0.5)
    print("TIMEOUT.")
    return False

def wait_for_http_ready(url: str, name: str, timeout: float = 30.0) -> bool:
    import urllib.request
    import urllib.error
    start = time.time()
    sys.stdout.write(f"[*] Verifying {name}... ")
    sys.stdout.flush()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=2.0) as res:
                if res.status == 200:
                    print("PASSED.")
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    print("FAILED / TIMEOUT.")
    return False

def run_command(cmd, desc):
    print(f"[*] {desc}...")
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"[!] Warning: '{cmd}' returned exit code {res.returncode}")
    else:
        print(f"[+] {desc} complete.")

def main():
    print("=" * 65)
    print("  Global to Local — Goan Heritage Store Startup")
    print("=" * 65)

    # 1. Start Docker containers (PostgreSQL + Redis)
    if not is_port_open("127.0.0.1", 5432):
        run_command("docker compose up -d", "Starting PostgreSQL & Redis via Docker Compose")
        wait_for_port("127.0.0.1", 5432, "PostgreSQL", timeout=20.0)
    else:
        print("[+] PostgreSQL is already running on port 5432.")

    # 2. Database Migrations
    run_command("python -m alembic upgrade head", "Applying database migrations (Alembic)")

    # 3. Seed Database (Idempotent: 230 products, 13 shelves, content)
    run_command("python -m backend.seed", "Seeding database catalogue & content")

    # 4. Check / ensure single admin exists
    admin_check_cmd = (
        'python -c "'
        'from backend.database import SessionLocal; '
        'from backend.models import User, UserRole; '
        'db = SessionLocal(); '
        'admin = db.query(User).filter(User.role == UserRole.admin, User.is_active == True).first(); '
        'print(\'ADMIN_EXISTS\' if admin else \'NO_ADMIN\'); '
        'db.close()"'
    )
    admin_status = subprocess.check_output(admin_check_cmd, shell=True, text=True).strip()
    if "NO_ADMIN" in admin_status:
        admin_pw = os.environ.get("ADMIN_PASSWORD")
        if admin_pw:
            print("[*] Creating admin account from ADMIN_PASSWORD environment variable...")
            env = os.environ.copy()
            env.setdefault("ADMIN_EMAIL", "admin@globaltolocal.in")
            subprocess.run(["python", "-m", "backend.cli", "create-admin"], env=env)
        else:
            print("[*] Notice: No admin account found. Set ADMIN_EMAIL and ADMIN_PASSWORD in environment to create an admin account.")

    # 5. Launch FastAPI Backend and Vite Frontend concurrently
    print("\n" + "=" * 65)
    print("  LAUNCHING SERVERS")
    print("  -> Customer Store:    http://localhost:5173")
    print("  -> Complete Shop:     http://localhost:5173/shop")
    print("  -> Admin Back Office: http://localhost:5173/admin")
    print("  -> FastAPI Backend:   http://127.0.0.1:8000")
    print("  -> API Documentation: http://127.0.0.1:8000/docs")
    print("=" * 65)
    print("\nPress Ctrl+C at any time to gracefully shut down both servers.\n")

    # Start FastAPI
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
    )

    # Verify FastAPI Health & Readiness checks
    if not wait_for_http_ready("http://127.0.0.1:8000/api/v1/health", "FastAPI Liveness (/api/v1/health)", timeout=20.0):
        print("[!] ERROR: FastAPI failed health check at http://127.0.0.1:8000/api/v1/health")
        backend_proc.kill()
        sys.exit(1)

    if not wait_for_http_ready("http://127.0.0.1:8000/api/v1/ready", "FastAPI Readiness (/api/v1/ready)", timeout=20.0):
        print("[!] ERROR: FastAPI failed readiness check at http://127.0.0.1:8000/api/v1/ready")
        backend_proc.kill()
        sys.exit(1)

    print("[+] Backend is fully ready (PostgreSQL & Redis connected).")

    # Start Vite Frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
    )

    def shutdown(sig, frame):
        print("\n[*] Shutting down servers...")
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
        try:
            frontend_proc.terminate()
            frontend_proc.wait(timeout=3)
        except Exception:
            frontend_proc.kill()
        print("[+] All servers stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    # Wait for either process to terminate
    try:
        while True:
            if backend_proc.poll() is not None:
                print("[!] Backend server terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("[!] Frontend server terminated unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(None, None)

if __name__ == "__main__":
    main()
