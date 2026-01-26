from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base
import uuid
from datetime import datetime


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    years_of_experience = Column(Integer, nullable=True)
    current_company = Column(String, nullable=True)
    current_role = Column(String, nullable=True)
    target_role = Column(String, nullable=True)

    # 简历相关字段
    resume_url = Column(String, nullable=True)  # 简历文件路径
    resume_data = Column(JSON, nullable=True)  # 解析后的简历数据
    resume_uploaded_at = Column(DateTime, nullable=True)  # 简历上传时间

    # JD相关字段
    target_jd_data = Column(JSON, nullable=True)  # 目标JD数据
    target_jd_created_at = Column(DateTime, nullable=True)  # JD创建时间

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
