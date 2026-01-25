#!/bin/bash

# TalkPro 健康检查脚本

echo "🔍 TalkPro 健康检查"
echo "=================="
echo ""

# 检查后端健康状态
echo "1. 检查后端服务..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ 后端服务正常"
    HEALTH=$(curl -s http://localhost:8000/health)
    echo "   响应: $HEALTH"
else
    echo "   ❌ 后端服务未运行"
    echo "   请先运行: cd backend && python run.py"
    exit 1
fi
echo ""

# 检查算法题库
echo "2. 检查算法题库..."
QUESTIONS=$(curl -s http://localhost:8000/api/algorithm/questions)
if [ $? -eq 0 ] && [ "$QUESTIONS" != "null" ]; then
    COUNT=$(echo "$QUESTIONS" | grep -o '"id"' | wc -l)
    echo "   ✅ 题库正常，共 $COUNT 道题"
else
    echo "   ❌ 题库加载失败"
fi
echo ""

# 检查系统设计场景
echo "3. 检查系统设计场景..."
SCENARIOS=$(curl -s http://localhost:8000/api/system-design/scenarios)
if [ $? -eq 0 ] && [ "$SCENARIOS" != "null" ]; then
    COUNT=$(echo "$SCENARIOS" | grep -o '"id"' | wc -l)
    echo "   ✅ 场景库正常，共 $COUNT 个场景"
else
    echo "   ❌ 场景库加载失败"
fi
echo ""

# 检查前端服务
echo "4. 检查前端服务..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ 前端服务正常"
else
    echo "   ⚠️  前端服务未运行"
    echo "   请先运行: cd frontend && npm run dev"
fi
echo ""

echo "=================="
echo "✅ 健康检查完成"
echo ""
echo "如需完整测试，请查看 TESTING.md"
