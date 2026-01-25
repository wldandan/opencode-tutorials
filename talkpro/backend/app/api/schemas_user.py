from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRegister(BaseModel):
    """用户注册请求"""
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    """用户登录请求"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    email: str
    name: str
    years_of_experience: int | None = None
    current_company: str | None = None
    current_role: str | None = None
    target_role: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """用户信息更新"""
    name: str | None = None
    years_of_experience: int | None = None
    current_company: str | None = None
    current_role: str | None = None
    target_role: str | None = None


class TokenResponse(BaseModel):
    """Token 响应"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
