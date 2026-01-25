@echo off
REM TalkPro 快速启动脚本 (Windows)

echo ========================================
echo 启动 TalkPro...
echo ========================================
echo.

REM 检查 Python
echo [1/5] 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装或不在 PATH 中
    pause
    exit /b 1
)
echo ✅ Python 已安装
echo.

REM 检查 Node.js
echo [2/5] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装或不在 PATH 中
    pause
    exit /b 1
)
echo ✅ Node.js 已安装
echo.

REM 启动后端
echo [3/5] 启动后端服务...
cd backend

if not exist ".venv" (
    echo 创建虚拟环境...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

if not exist ".env" (
    echo ⚠️  警告: .env 文件不存在
    echo 请复制 .env.example 到 .env 并填入你的 Claude API Key
    pause
    exit /b 1
)

echo 安装 Python 依赖...
pip install -r requirements.txt -q

echo 启动后端服务...
start "TalkPro Backend" cmd /k "python run.py"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 检查后端服务...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务启动失败
    pause
    exit /b 1
)
echo ✅ 后端服务正常
echo.

REM 启动前端
echo [4/5] 启动前端服务...
cd ..\frontend

if not exist "node_modules" (
    echo 安装前端依赖...
    npm install
)

echo 启动前端开发服务器...
start "TalkPro Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ TalkPro 启动成功！
echo ========================================
echo.
echo 📱 访问地址:
echo    前端: http://localhost:3000
echo    后端: http://localhost:8000
echo    API 文档: http://localhost:8000/docs
echo.
echo 按任意键关闭此窗口...
pause >nul
