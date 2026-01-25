#!/bin/bash

# TalkPro 快速启动脚本

echo "🚀 启动 TalkPro..."
echo ""

# 检查 Python 版本
echo "检查 Python 版本..."
python3 --version || { echo "❌ Python 3 未安装"; exit 1; }
echo "✅ Python 已安装"
echo ""

# 检查 Node.js
echo "检查 Node.js 版本..."
node --version || { echo "❌ Node.js 未安装"; exit 1; }
echo "✅ Node.js 已安装"
echo ""

# 启动后端
echo "📦 启动后端服务..."
cd backend

if [ ! -d ".venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv .venv
fi

echo "激活虚拟环境..."
source .venv/bin/activate

if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "请复制 .env.example 到 .env 并填入你的 Claude API Key"
    echo ""
    read -p "是否现在创建 .env 文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo "✅ .env 文件已创建"
        echo "请编辑 backend/.env 并填入 ANTHROPIC_API_KEY"
        echo "然后重新运行此脚本"
        exit 1
    else
        exit 1
    fi
fi

echo "安装 Python 依赖..."
pip install -r requirements.txt -q

echo "启动后端服务（后台运行）..."
python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "后端日志: backend.log"
echo ""

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 检查后端健康状态
echo "检查后端服务..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务启动失败，请查看 backend.log"
    exit 1
fi
echo ""

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

echo "启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo ""

echo "================================"
echo "✅ TalkPro 启动成功！"
echo "================================"
echo ""
echo "📱 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
echo ""
echo "📝 日志文件:"
echo "   后端日志: backend/backend.log"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   或按 Ctrl+C"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '🛑 服务已停止'; exit 0" INT

wait
