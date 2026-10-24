#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Starting CivicLens AI Fullstack Application"
echo " Final-Year B.Tech AI Capstone Engineering Project"
echo "=========================================================="

# Check if database exists, if not seed it
if [ ! -f "backend/civiclens.db" ]; then
    echo "[1/3] Database not found. Running seed script with Nagpur fixtures..."
    python3 backend/seed.py --force
else
    echo "[1/3] Database verified: backend/civiclens.db"
fi

echo "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000..."
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "[3/3] Starting Vite Frontend on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " CivicLens AI is Running!"
echo "   • Frontend Application: http://localhost:5173"
echo "   • Backend API & Docs:   http://localhost:8000/docs"
echo "   • Single-port SPA Mode: http://localhost:8000"
echo "=========================================================="
echo " Standard Demo Accounts (Password: DemoPass123!):"
echo "   • Citizen:    citizen@civiclens.ai"
echo "   • Authority:  authority@civiclens.ai"
echo "   • Admin:      admin@civiclens.ai"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM
wait
