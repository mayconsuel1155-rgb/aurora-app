import os
import sys
import time
import subprocess
import threading
import urllib.request

# Garantir codificação UTF-8 para o stdout no Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "aurora-backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "aurora-frontend")
BACKEND_PORT = int(os.getenv("AURORA_BACKEND_PORT", "8001"))
FRONTEND_PORT = int(os.getenv("AURORA_FRONTEND_PORT", "5174"))
BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"
FRONTEND_URL = f"http://127.0.0.1:{FRONTEND_PORT}"


VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    # Fallback para ambientes Linux/Mac ou sem venv específico
    VENV_PYTHON = sys.executable

def safe_print(msg):
    try:
        print(msg)
    except UnicodeEncodeError:
        try:
            print(msg.encode('ascii', errors='ignore').decode('ascii'))
        except Exception:
            pass

def stream_output(process, prefix, color_code=""):
    """Lê a saída do processo linha a linha e imprime com prefixo."""
    reset_code = "\033[0m" if color_code else ""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                safe_print(f"{color_code}[{prefix}]{reset_code} {line.strip()}")
    except Exception:
        pass


def check_port_open(url, timeout=2):
    """Verifica se uma URL está respondendo."""
    try:
        req = urllib.request.urlopen(url, timeout=timeout)
        return req.status == 200
    except Exception:
        return False

def print_status():
    safe_print("=" * 60)
    safe_print("📊 VERIFICAÇÃO DE STATUS DOS SERVIÇOS AURORA")
    safe_print("=" * 60)
    backend_up = check_port_open(f"{BACKEND_URL}/")
    frontend_up = check_port_open(f"{FRONTEND_URL}/")

    if backend_up:
        safe_print(f"✅ Backend FastAPI: RODANDO ({BACKEND_URL})")
    else:
        safe_print(f"❌ Backend FastAPI: PARADO ({BACKEND_URL})")

    if frontend_up:
        safe_print(f"✅ Frontend React Vite: RODANDO ({FRONTEND_URL})")
    else:
        safe_print(f"❌ Frontend React Vite: PARADO ({FRONTEND_URL})")

    safe_print("=" * 60)
    return backend_up and frontend_up

def main():
    if "--status" in sys.argv or "--check" in sys.argv:
        all_ok = print_status()
        sys.exit(0 if all_ok else 1)

    safe_print("=" * 60)
    safe_print("🌅 PROJETO AURORA - INICIALIZADOR AUTOMÁTICO DE SERVIÇOS")
    safe_print("=" * 60)
    safe_print(f"📁 Diretório Raiz: {ROOT_DIR}")

    # Verificação do Backend
    if not os.path.exists(BACKEND_DIR):
        safe_print(f"❌ Erro: Diretório do backend não encontrado: {BACKEND_DIR}")
        sys.exit(1)

    # Verificação do Frontend
    if not os.path.exists(FRONTEND_DIR):
        safe_print(f"❌ Erro: Diretório do frontend não encontrado: {FRONTEND_DIR}")
        sys.exit(1)

    backend_proc = None
    if check_port_open(f"{BACKEND_URL}/"):
        safe_print(f"ℹ️ Backend já está rodando em {BACKEND_URL}/")
    else:
        safe_print(f"\n🚀 Iniciando Backend (FastAPI - {BACKEND_URL})...")
        backend_cmd = [VENV_PYTHON, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", str(BACKEND_PORT)]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

    frontend_proc = None
    if check_port_open(f"{FRONTEND_URL}/"):
        safe_print(f"ℹ️ Frontend já está rodando em {FRONTEND_URL}/")
    else:
        safe_print(f"🚀 Iniciando Frontend (Vite React - {FRONTEND_URL})...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", str(FRONTEND_PORT)],
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

    # Threading para stream de logs
    # Cores ANSI
    GREEN = "\033[92m"
    CYAN = "\033[96m"

    if backend_proc:
        t1 = threading.Thread(target=stream_output, args=(backend_proc, "BACKEND", CYAN), daemon=True)
        t1.start()
    if frontend_proc:
        t2 = threading.Thread(target=stream_output, args=(frontend_proc, "FRONTEND", GREEN), daemon=True)
        t2.start()

    safe_print("\n⏳ Aguardando serviços ficarem prontos...")
    backend_ready = False
    frontend_ready = False

    for attempt in range(15):
        time.sleep(1)
        if not backend_ready and check_port_open(f"{BACKEND_URL}/"):
            backend_ready = True
            safe_print(f"✅ Backend respondendo em {BACKEND_URL}/")

        if not frontend_ready and check_port_open(f"{FRONTEND_URL}/"):
            frontend_ready = True
            safe_print(f"✅ Frontend respondendo em {FRONTEND_URL}/")

        if backend_ready and frontend_ready:
            break

    safe_print("\n" + "=" * 60)
    safe_print("✨ PROJETO AURORA EXECUTANDO COM SUCESSO!")
    safe_print(f"  ► Frontend:  {FRONTEND_URL}/")
    safe_print(f"  ► Backend:   {BACKEND_URL}/")
    safe_print(f"  ► Docs API:  {BACKEND_URL}/docs")
    safe_print("=" * 60)
    safe_print("Pressione Ctrl+C a qualquer momento para encerrar ambos os serviços.\n")

    try:
        while True:
            # Checar se algum processo morreu inesperadamente
            b_code = backend_proc.poll() if backend_proc else None
            f_code = frontend_proc.poll() if frontend_proc else None

            if backend_proc and b_code is not None:
                safe_print(f"\n⚠️ Backend encerrou inesperadamente com código {b_code}.")
                break
            if frontend_proc and f_code is not None:
                safe_print(f"\n⚠️ Frontend encerrou inesperadamente com código {f_code}.")
                break

            time.sleep(1)

    except KeyboardInterrupt:
        safe_print("\n🛑 Encerrando serviços do Aurora...")
    finally:
        # Finalização garantida dos processos filhos
        for proc, name in [(backend_proc, "Backend"), (frontend_proc, "Frontend")]:
            if proc and proc.poll() is None:
                try:
                    if os.name == "nt":
                        subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        proc.terminate()
                except Exception:
                    pass
        safe_print("🟢 Todos os serviços foram desligados com sucesso.")


if __name__ == "__main__":
    main()
