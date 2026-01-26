from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from ..core.database import async_session, User
from ..dependencies import get_current_user
from ..services.resume_parser import ResumeParser

router = APIRouter(prefix="/jd", tags=["jd"])
parser = ResumeParser()


class JDAnalyzeRequest(BaseModel):
    jd_text: str
    company: Optional[str] = None
    position: Optional[str] = None
    url: Optional[str] = None


@router.post("/analyze")
async def analyze_jd(
    request: JDAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """分析职位描述(JD)"""

    system_prompt = """你是一位专业的招聘专家和职业顾问，擅长分析职位描述(JD)。
你的任务是深入分析JD内容，提取关键信息，识别岗位要求。"""

    user_prompt = f"""请分析以下职位描述(JD)，提取关键信息：

公司：{request.company or '未指定'}
职位：{request.position or '未指定'}

JD内容：
{request.jd_text}

请返回以下JSON格式：
{{
    "company": "公司名称",
    "position": "职位名称",
    "basic_requirements": {{
        "education": "学历要求",
        "experience": "经验要求",
        "location": "工作地点",
        "salary": "薪资范围"
    }},
    "skills": {{
        "required": ["必需技能1", "必需技能2"],
        "preferred": ["加分技能1", "加分技能2"]
    }},
    "responsibilities": ["职责1", "职责2", "职责3"],
    "requirements": {{
        "technical": ["技术要求1", "技术要求2"],
        "soft_skills": ["软技能要求1", "软技能要求2"],
        "certifications": ["认证要求"]
    }},
    "team_info": {{
        "team_size": "团队规模",
        "team_structure": "团队结构",
        "tech_stack": "技术栈"
    }},
    "highlights": ["亮点1", "亮点2", "亮点3"],
    "keywords": ["关键词1", "关键词2", "关键词3"]
}}

注意：
- 如果某项信息不存在，返回空数组或null
- 技能要区分必需和加分项
- 职责要具体可量化
- 提取所有关键技能
- 识别岗位亮点
- 只返回JSON，不要有其他文字"""

    try:
        response = await parser.claude.chat(
            messages=[{"role": "user", "content": user_prompt}],
            system_prompt=system_prompt
        )

        # 提取JSON
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            jd_data = json.loads(json_match.group(0))
        else:
            raise ValueError("No JSON found in response")

        # 确保所有字段存在
        jd_data.setdefault("basic_requirements", {})
        jd_data.setdefault("skills", {})
        jd_data["skills"].setdefault("required", [])
        jd_data["skills"].setdefault("preferred", [])
        jd_data.setdefault("responsibilities", [])
        jd_data.setdefault("requirements", {})
        jd_data["requirements"].setdefault("technical", [])
        jd_data["requirements"].setdefault("soft_skills", [])
        jd_data["requirements"].setdefault("certifications", [])
        jd_data.setdefault("team_info", {})
        jd_data.setdefault("highlights", [])
        jd_data.setdefault("keywords", [])

        # 保存到用户数据
        async with async_session() as db:
            await db.execute(
                update(User)
                .where(User.id == current_user.id)
                .values(
                    target_jd_data=jd_data,
                    target_jd_created_at=datetime.utcnow()
                )
            )
            await db.commit()

        return {
            "message": "JD分析成功",
            "data": jd_data
        }

    except Exception as e:
        print(f"Failed to analyze JD: {e}")
        raise HTTPException(status_code=500, detail=f"JD分析失败: {str(e)}")


@router.get("")
async def get_jd(current_user: User = Depends(get_current_user)):
    """获取用户的JD数据"""
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "jd_data": user.target_jd_data,
            "created_at": user.target_jd_created_at.isoformat() if user.target_jd_created_at else None
        }


@router.post("/compare")
async def compare_resume_jd(
    current_user: User = Depends(get_current_user)
):
    """对比简历和JD，生成差距分析"""
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        if not user.resume_data or not user.target_jd_data:
            raise HTTPException(status_code=400, detail="请先上传简历并分析JD")

        try:
            # 使用resume_parser中的对比功能
            gap_analysis = await parser.analyze_resume_against_jd(
                user.resume_data,
                user.target_jd_data
            )

            return {
                "message": "差距分析成功",
                "data": gap_analysis
            }

        except Exception as e:
            print(f"Failed to compare: {e}")
            raise HTTPException(status_code=500, detail=f"差距分析失败: {str(e)}")


@router.delete("")
async def delete_jd(
    current_user: User = Depends(get_current_user)
):
    """删除JD数据"""
    async with async_session() as db:
        await db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(
                target_jd_data=None,
                target_jd_created_at=None
            )
        )
        await db.commit()

        return {"message": "JD已删除"}
