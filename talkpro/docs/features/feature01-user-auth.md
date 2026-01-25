# Feature 01: 用户认证系统

**优先级**: P0（MVP 基础）
**状态**: 待开发
**依赖**: 无

---

## 功能描述

提供用户注册、登录、档案管理功能，作为整个系统的基础设施。

---

## 用户故事

作为一名用户，我想要：
- 注册账号并登录系统
- 管理我的个人档案
- 重置忘记的密码

---

## 功能需求

### 1.1 用户注册

**输入：**
- 邮箱（必填，作为唯一标识）
- 密码（必填，至少 8 位，包含字母和数字）
- 姓名（必填）

**处理：**
- 验证邮箱格式
- 验证密码强度
- 检查邮箱是否已注册
- 密码加密存储（bcrypt）
- 创建用户记录

**输出：**
- 用户基本信息
- JWT Access Token

### 1.2 用户登录

**输入：**
- 邮箱
- 密码

**处理：**
- 查找用户记录
- 验证密码
- 生成 JWT Token（30分钟有效期）

**输出：**
- Access Token
- 用户基本信息

### 1.3 获取当前用户

**输入：**
- JWT Token（Authorization Header）

**处理：**
- 验证 Token 有效性
- 从 Token 中提取用户标识
- 查询用户信息

**输出：**
- 用户完整信息

### 1.4 密码重置

**输入：**
- 注册邮箱

**处理：**
- 生成重置 Token（1小时有效期）
- 发送重置链接到邮箱
- 用户点击链接，设置新密码

**输出：**
- 密码重置成功

### 1.5 用户档案管理

**可编辑字段：**
- 姓名
- 工龄（0-1年，1-3年，3-5年，5-10年，10年以上）
- 当前公司（可选）
- 当前岗位
- 目标岗位

**只读字段：**
- 邮箱

---

## 技术实现

### 数据模型

```python
class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True, default=uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    years_of_experience = Column(Integer, nullable=True)
    current_company = Column(String, nullable=True)
    current_role = Column(String, nullable=True)
    target_role = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### API 端点

```
POST   /api/auth/register
       请求: { email, password, name }
       响应: { user: { id, email, name }, access_token }

POST   /api/auth/login
       请求: { email, password }
       响应: { access_token, token_type: "bearer", user }

GET    /api/auth/me
       请求头: Authorization: Bearer <token>
       响应: { user }

PUT    /api/auth/me
       请求头: Authorization: Bearer <token>
       请求: { name, years_of_experience, current_role, target_role }
       响应: { user }

POST   /api/auth/forgot-password
       请求: { email }
       响应: { success: true }

POST   /api/auth/reset-password
       请求: { token, new_password }
       响应: { success: true }
```

### 核心方法

```python
def hash_password(password: str) -> str:
    """使用 bcrypt 加密密码"""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    """生成 JWT Token"""
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {**data, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

async def get_current_user(token: str) -> User:
    """从 Token 获取当前用户"""
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    email = payload.get("sub")
    return await get_user_by_email(email)
```

---

## 验收标准

- [ ] 用户能成功注册，返回 Token
- [ ] 密码加密存储，数据库中不可见明文
- [ ] 用户能使用邮箱密码登录
- [ ] 错误的邮箱或密码返回 401
- [ ] Token 有效期 30 分钟
- [ ] 过期的 Token 返回 401
- [ ] 无 Token 访问受保护资源返回 401
- [ ] 用户能更新档案信息
- [ ] 密码重置流程正常工作
- [ ] 相同邮箱重复注册返回 400

---

## 安全考虑

1. **密码安全**：
   - 最小 8 位，包含字母和数字
   - bcrypt 加密（cost=12）
   - 前端 + 后端双重验证

2. **Token 安全**：
   - 有效期 30 分钟
   - 存储在 localStorage（考虑 httpOnly Cookie）
   - 支持 Refresh Token（Phase 2）

3. **HTTPS**：
   - 生产环境强制 HTTPS

4. **限流**：
   - 登录接口 5 次/分钟
   - 注册接口 3 次/小时

---

## 测试用例

```python
# 注册
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Test User"
}
→ 200 OK, { user, access_token }

# 重复注册
POST /api/auth/register
{ same email }
→ 400 Bad Request, "Email already registered"

# 登录
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
→ 200 OK, { access_token, user }

# 错误密码
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "wrong"
}
→ 401 Unauthorized, "Invalid email or password"

# 获取当前用户
GET /api/auth/me
Header: Authorization: Bearer <token>
→ 200 OK, { user }

# 无 Token
GET /api/auth/me
→ 401 Unauthorized, "Not authenticated"
```
