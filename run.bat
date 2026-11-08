@echo off
set NODE_PATH=C:\Users\lenovo\.box-agent-kanshan\box-agent-runtime\runtimes\node\versions\node-v24.15.0-win-x64
set PATH=%NODE_PATH%;%PATH%

cd /d "%~dp0"

if "%1"=="install" (
    echo Installing dependencies...
    node "%NODE_PATH%\node_modules\npm\bin\npm-cli.js" install
) else if "%1"=="dev" (
    echo Starting development server...
    node "%NODE_PATH%\node_modules\npm\bin\npx-cli.js" next dev
) else if "%1"=="build" (
    echo Building for production...
    node "%NODE_PATH%\node_modules\npm\bin\npx-cli.js" next build
) else (
    echo Usage: run.bat [install^|dev^|build]
    echo.
    echo   install  - Install dependencies
    echo   dev      - Start development server
    echo   build    - Build for production
)
