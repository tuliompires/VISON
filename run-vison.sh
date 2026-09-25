#!/usr/bin/env bash

DEFAULT_PORT=8000
read -r -p "Porta do Vison [${DEFAULT_PORT}]: " PORT
PORT="${PORT:-$DEFAULT_PORT}"

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo "Porta inválida: $PORT" >&2
  exit 1
fi

SERVER_PID=""
LOG_FILE="${TMPDIR:-/tmp}/vison-server-${PORT}.log"

start_server() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "O server ja esta em execucao (PID ${SERVER_PID})."
    return 0
  fi

  echo "Iniciando o Vison em http://127.0.0.1:${PORT}"
  PORT="$PORT" npm start >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  echo "Server iniciado (PID ${SERVER_PID}). Log: ${LOG_FILE}"
}

stop_server() {
  if [ -z "$SERVER_PID" ] || ! kill -0 "$SERVER_PID" 2>/dev/null; then
    SERVER_PID=""
    echo "O server nao esta em execucao."
    return 0
  fi

  echo "Parando o server (PID ${SERVER_PID})..."
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
  echo "Server parado."
}

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    stop_server
  fi
}

trap 'cleanup' EXIT
trap 'exit 130' INT TERM

while true; do
  echo
  echo "1) Iniciar server"
  echo "2) Parar server"
  echo "3) Reiniciar server"
  echo "4) Fechar"
  read -r -p "Escolha uma opcao: " OPTION

  case "$OPTION" in
    1) start_server ;;
    2) stop_server ;;
    3)
      stop_server
      start_server
      ;;
    4)
      stop_server
      exit 0
      ;;
    *) echo "Opcao invalida. Escolha 1, 2, 3 ou 4." ;;
  esac
done
