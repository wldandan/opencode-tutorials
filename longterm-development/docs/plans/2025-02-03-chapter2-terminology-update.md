# 第2章术语统一更新实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将第2章所有文件中的术语更新为与第1章一致的"LLM应用项目"、"企业AI工程框架"、"1-2-3模型"等标准术语。

**架构：** 系统性遍历第2章9个文件，执行查找替换操作，确保术语一致性。

**技术栈：** bash grep, Edit工具

---

## 任务概述

第2章共9个文件需要更新：
- 2.1.1 需求收集三步法
- 2.1.2 需求分析四象限
- 2.1.3 技术需求转换
- 2.2.1 MVP思维
- 2.2.2 假设驱动开发
- 2.2.3 快速验证方法
- 2.3.1 用户故事地图
- 2.3.2 价值树分析
- 2.3.3 实战练习

**替换规则：**

| 原术语 | 新术语 |
|-------|-------|
| "AI项目" | "LLM应用项目" |
| "AI工程" | "LLM应用工程"（仅当指代整个领域时） |
| "AI工程实践框架" | "企业AI工程框架" 或 "企业AI工程框架（1-2-3模型）" |
| "六阶段" | "1-2-3模型（六阶段）" 或 "1-2-3模型" |
| "为了AI" | "为了LLM" |
| "AI很先进" | "LLM很先进" |
| "AI能力" | "LLM应用能力"（视语境） |

---

### Task 1: 更新文件 2.1.1 - 需求收集三步法

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.1-需求收集三步法：访谈→观察→数据.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程\|AI能力" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.1-需求收集三步法：访谈→观察→数据.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"
- "AI能力" → "LLM应用能力"（视上下文）

**Step 3: 验证更新**

Run: `grep "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.1-需求收集三步法：访谈→观察→数据.md" | grep -v "LLM"`
Expected: 无输出（或只有合理的"AI"用法，如"GenAI"）

**Step 4: 检查文件完整性**

确认文件结构正确，markdown格式无误

---

### Task 2: 更新文件 2.1.2 - 需求分析四象限

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.2-需求分析四象限：效率-体验-风险-收入.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.2-需求分析四象限：效率-体验-风险-收入.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.2-需求分析四象限：效率-体验-风险-收入.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 3: 更新文件 2.1.3 - 技术需求转换

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.3-技术需求转换：业务目标→技术指标→验收标准.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.3-技术需求转换：业务目标→技术指标→验收标准.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.1.3-技术需求转换：业务目标→技术指标→验收标准.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 4: 更新文件 2.2.1 - MVP思维

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.1-MVP思维：最小可行产品定义.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程\|为了AI" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.1-MVP思维：最小可行产品定义.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"
- "为了AI" → "为了LLM"

**Step 3: 验证更新**

Run: `grep "AI项目\|为了AI" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.1-MVP思维：最小可行产品定义.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 5: 更新文件 2.2.2 - 假设驱动开发

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.2-假设驱动开发：提出假设→设计实验→验证假设.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.2-假设驱动开发：提出假设→设计实验→验证假设.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.2-假设驱动开发：提出假设→设计实验→验证假设.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 6: 更新文件 2.2.3 - 快速验证方法

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.3-快速验证方法：原型、A_B测试、灰度发布.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.3-快速验证方法：原型、A_B测试、灰度发布.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.2.3-快速验证方法：原型、A_B测试、灰度发布.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 7: 更新文件 2.3.1 - 用户故事地图

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.1-用户故事地图：AI项目特化版.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.1-用户故事地图：AI项目特化版.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- 标题中的"AI项目特化版" → "LLM应用项目特化版"
- 内容中的"AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.1-用户故事地图：AI项目特化版.md" | grep -v "LLM"`
Expected: 无输出

**Step 4: 更新文件名（如果需要）**

如果标题更新，考虑是否需要重命名文件（可选）

---

### Task 8: 更新文件 2.3.2 - 价值树分析

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.2-价值树分析：量化业务价值.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.2-价值树分析：量化业务价值.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"

**Step 3: 验证更新**

Run: `grep "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.2-价值树分析：量化业务价值.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 9: 更新文件 2.3.3 - 实战练习

**Files:**
- Modify: `002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.3-实战练习：分析某企业的AI需求.md`

**Step 1: 查找需要更新的内容**

Run: `grep -n "AI项目\|AI工程\|AI需求" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.3-实战练习：分析某企业的AI需求.md"`
Expected: 显示包含待替换术语的行号

**Step 2: 执行替换操作**

使用Edit工具，将文件中：
- "AI项目" → "LLM应用项目"
- "AI需求" → "LLM应用需求"（视上下文）
- "某企业的AI需求" → "某企业的LLM应用需求"

**Step 3: 验证更新**

Run: `grep "AI项目\|AI需求" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/2.3.3-实战练习：分析某企业的AI需求.md" | grep -v "LLM"`
Expected: 无输出

---

### Task 10: 验证第2章整体更新

**Step 1: 全局搜索检查**

Run: `grep -r "AI项目" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/" | grep -v "LLM" | head -20`
Expected: 无输出或仅有合理的"AI"用法

**Step 2: 术语一致性检查**

Run: `grep -r "企业AI工程" "002-courses/003-实践级-AI工程实践：从POC到生产/chapter2/" | wc -l`
Expected: 显示使用"企业AI工程框架"的次数

**Step 3: 创建更新总结**

记录更新情况：
- 更新文件数：9个
- 主要替换："AI项目" → "LLM应用项目"
- 特殊处理：标题、文件名考虑

---

## 注意事项

1. **保留合理用法**：某些"AI"用法是合理的，如"GenAI"、"AI技术栈"等，不要盲目替换
2. **上下文判断**："AI能力"在某些上下文可能保留，如"AI基础设施"
3. **格式保持**：更新时保持markdown格式完整
4. **交叉引用**：注意章节间的交叉引用，确保链接正确
