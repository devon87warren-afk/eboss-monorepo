@echo off
REM ANA EBOSS Planner - Development Environment Launcher (Windows)
REM This script starts Firebase emulators and a local HTTP server

echo ============================================
echo ANA EBOSS Planner - Development Mode
echo ============================================
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI not found!
    echo Please install it: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "functions\node_modules" (
    echo Installing function dependencies...
    cd functions
    call npm install
    cd ..
)

REM Create data directory for emulators
if not exist "\.firebase" mkdir .firebase

echo.
echo Starting Firebase Emulators...
echo   - Auth: http://127.0.0.1:9099
echo   - Firestore: http://127.0.0.1:8080
echo   - Functions: http://127.0.0.1:5001
echo   - Storage: http://127.0.0.1:9199
echo   - Hosting: http://127.0.0.1:5000
echo   - Emulator UI: http://127.0.0.1:4000
echo.
echo Starting local HTTP server on http://localhost:8080
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start Firebase emulators in background
start "Firebase Emulators" cmd /c "firebase emulators:start --import=.firebase --export-on-exit"

REM Wait for emulators to start
timeout /t 5 /nobreak >nul

REM Start Python HTTP server
echo Starting HTTP server...
python -m http.server 8080 2>nul || python3 -m http.server 8080 2>nul

REM If Python fails, try Node.js
if errorlevel 1 (
    echo Python not found, trying Node.js...
    npx http-server -p 8080 -c-1
)

echo.
echo Development server stopped.
pause
