# 贡献指南

感谢你对 TalkPro 的关注！我们欢迎各种形式的贡献。

---

## 如何贡献

### 报告 Bug

请在 GitHub Issues 中报告 Bug，并包含：

1. **Bug 描述**
   - 清晰简洁的标题
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（OS、浏览器、Python 版本等）

2. **截图/日志**
   - 如果相关，附上截图
   - 复制错误日志

### 提出新功能

请在 GitHub Issues 中提出，并包含：

1. **功能描述**
   - 为什么需要这个功能
   - 使用场景
   - 预期效果

2. **实现建议**
   - 可能的实现方案
   - 技术挑战

### 提交代码

#### 开发流程

1. **Fork 项目**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   git clone https://github.com/your-username/talkpro.git
   cd talkpro
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发**
   - 遵循现有代码风格
   - 添加必要的注释
   - 更新相关文档

4. **测试**
   - 运行并确保测试通过
   - 手动测试相关功能

5. **提交**
   ```bash
   git add .
   git commit -m "feat: add some feature"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

6. **推送到 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

---

## 代码规范

### Python 代码风格

- 遵循 PEP 8
- 使用 Black 格式化
- 使用 isort 排序 import
- 添加类型提示（Type Hints）
- 添加文档字符串（Docstrings）

```python
def example_function(param1: str, param2: int) -> bool:
    """
    简短的函数描述。

    Args:
        param1: 参数1描述
        param2: 参数2描述

    Returns:
        返回值描述
    """
    return True
```

### TypeScript/React 代码风格

- 使用 ESLint + Prettier
- 使用函数组件 + Hooks
- 添加 TypeScript 类型
- 组件使用 PascalCase
- 变量使用 camelCase
- 常量使用 UPPER_SNAKE_CASE

```typescript
interface Props {
  title: string;
  count: number;
}

export function MyComponent({ title, count }: Props) {
  return <div>{title}: {count}</div>;
}
```

---

## 测试指南

在提交代码前，请确保：

### 后端测试

```bash
cd backend

# 运行测试（如果有）
pytest

# 手动测试
# 1. 启动服务
python run.py

# 2. 测试各个端点
# 参考 TESTING.md
```

### 前端测试

```bash
cd frontend

# 运行 linter
npm run lint

# 手动测试
# 1. 启动开发服务器
npm run dev

# 2. 测试各个页面
# 参考 TESTING.md
```

---

## 文档更新

如果你修改了功能，请同步更新文档：

1. **README.md** - 如果添加了新功能
2. **docs/** - 相关文档
3. **代码注释** - 复杂逻辑需要注释

---

## Pull Request 检查清单

提交 PR 前，请确认：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 通过了所有测试
- [ ] 提交信息清晰明确
- [ ] PR 描述说明了改动内容

---

## 代码审查准则

PR 通常会在几天内被审查。请确保：

1. **改动范围合理** - 不要一次改动太多
2. **提交历史清晰** - 每个提交是一个完整的逻辑单元
3. **响应评论** - 及时回复审查意见

---

## 社区行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或侮辱性评论
- 公开或私下骚扰
- 未经许可发布他人私人信息
- 其他不专业或不适当的行为

---

## 获取帮助

如果你有任何问题：

1. 查看 [README.md](README.md)
2. 查看 [TESTING.md](TESTING.md)
3. 查看 [DEPLOYMENT.md](DEPLOYMENT.md)
4. 在 GitHub Issues 中提问

---

## 许可证

通过贡献代码，你同意你的贡献将在与项目相同的 MIT 许可证下发布。

---

再次感谢你的贡献！🎉

*贡献指南 v1.0 - 2026-01-25*
