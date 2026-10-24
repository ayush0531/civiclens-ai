#!/usr/bin/env bash
# CivicLens AI - Universal Production Build Script (Render / VPS / PaaS)
set -o errexit

echo "=========================================================="
echo " Starting CivicLens AI Production Build"
echo "=========================================================="

# 1. Build React + TypeScript Frontend
echo "--> [1/3] Building Frontend SPA..."
cd frontend
npm install --include=dev
npm run build
cd ..

# 2. Install Python Dependencies
echo "--> [2/3] Installing Backend Python Packages..."
python3 -m pip install --upgrade pip
python3 -m pip install -r backend/requirements.txt

# 3. Seed Database (Safe: skips if already populated)
echo "--> [3/3] Initializing and Seeding Database..."
python3 backend/seed.py

echo "=========================================================="
echo " CivicLens AI Production Build Completed Successfully!"
echo "=========================================================="
