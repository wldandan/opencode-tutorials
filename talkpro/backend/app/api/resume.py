from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
import os
import uuid
from datetime import datetime

from ..core.database import async_session, User
from ..dependencies import get_current_user
from ..services.resume_parser import ResumeParser

router = APIRouter(prefix="/resume", tags=["resume"])
parser = ResumeParser()

# 配置文件上传目录
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """上传简历文件"""
    # 验证文件类型
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="只支持PDF格式的简历")

    # 验证文件大小（5MB限制）
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过5MB")

    # 生成唯一文件名
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)

    # 更新用户简历URL
    async with async_session() as db:
        await db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(
                resume_url=file_path,
                resume_uploaded_at=datetime.utcnow(),
                resume_data=None  # 清除旧的解析数据
            )
        )
        await db.commit()

    return {
        "message": "简历上传成功",
        "file_path": file_path,
        "filename": file.filename
    }


@router.post("/parse")
async def parse_resume(
    current_user: User = Depends(get_current_user)
):
    """解析已上传的简历"""
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user or not user.resume_url:
            raise HTTPException(status_code=400, detail="请先上传简历")

        try:
            # 从PDF提取文本
            resume_text = parser.extract_text_from_pdf(user.resume_url)

            # 使用AI解析简历
            resume_data = await parser.parse_resume(resume_text)

            # 更新用户简历数据
            await db.execute(
                update(User)
                .where(User.id == current_user.id)
                .values(resume_data=resume_data)
            )
            await db.commit()

            return {
                "message": "简历解析成功",
                "data": resume_data
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"简历解析失败: {str(e)}")


@router.get("")
async def get_resume(
    current_user: User = Depends(get_current_user)
):
    """获取简历数据"""
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "resume_url": user.resume_url,
            "resume_data": user.resume_data,
            "resume_uploaded_at": user.resume_uploaded_at.isoformat() if user.resume_uploaded_at else None
        }


@router.delete("")
async def delete_resume(
    current_user: User = Depends(get_current_user)
):
    """删除简历"""
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 删除文件
        if user.resume_url and os.path.exists(user.resume_url):
            try:
                os.remove(user.resume_url)
            except:
                pass  # 忽略删除失败

        # 清除数据库记录
        await db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(
                resume_url=None,
                resume_data=None,
                resume_uploaded_at=None
            )
        )
        await db.commit()

        return {"message": "简历已删除"}
