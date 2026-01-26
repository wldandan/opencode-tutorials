from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any
from datetime import datetime, timedelta

from ..core.database import async_session, User
from ..models.interview import InterviewSession
from ..dependencies import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/abilities")
async def get_abilities_stats(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """获取用户各维度能力评分"""
    async with async_session() as db:
        # 算法面试统计
        algo_result = await db.execute(
            select(func.avg(InterviewSession.score['overall'].cast(float)))
            .where(InterviewSession.user_id == current_user.id)
            .where(InterviewSession.type == 'algorithm')
        )
        algo_avg = algo_result.scalar() or 0

        # 系统设计统计
        design_result = await db.execute(
            select(func.avg(InterviewSession.score['overall'].cast(float)))
            .where(InterviewSession.user_id == current_user.id)
            .where(InterviewSession.type == 'system_design')
        )
        design_avg = design_result.scalar() or 0

        # 总体统计
        all_result = await db.execute(
            select(func.count(InterviewSession.id))
            .where(InterviewSession.user_id == current_user.id)
        )
        total_sessions = all_result.scalar() or 0

        # 计算各维度得分（基于所有训练）
        communication_score = 0  # 可以从评分中提取
        project_score = 0  # 基于训练数量

        # 简单计算：项目经验基于训练次数
        if total_sessions > 0:
            project_score = min(100, total_sessions * 5)

        # 沟通表达基于平均分（暂设为算法和系统设计的平均）
        if algo_avg > 0 or design_avg > 0:
            communication_score = (algo_avg * 10 + design_avg * 10) / max(1, (algo_avg + design_avg))

        return {
            "algorithm": round(algo_avg * 10, 1),  # 转换为100分制
            "system_design": round(design_avg * 10, 1),
            "communication": round(communication_score, 1),
            "project": round(project_score, 1),
            "overall": round((algo_avg * 10 + design_avg * 10 + communication_score + project_score) / 4, 1),
            "total_sessions": total_sessions,
        }


@router.get("/growth")
async def get_growth_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """获取用户成长趋势数据"""
    async with async_session() as db:
        start_date = datetime.utcnow() - timedelta(days=days)

        # 按日期分组统计
        result = await db.execute(
            select(
                func.date(InterviewSession.created_at).label('date'),
                InterviewSession.type,
                func.avg(InterviewSession.score['overall'].cast(float)).label('avg_score')
            )
            .where(InterviewSession.user_id == current_user.id)
            .where(InterviewSession.created_at >= start_date)
            .group_by(func.date(InterviewSession.created_at), InterviewSession.type)
            .order_by(func.date(InterviewSession.created_at))
        )

        growth_data = []
        for row in result:
            growth_data.append({
                "date": row.date.strftime('%Y-%m-%d'),
                "type": row.type,
                "score": round(row.avg_score * 10, 1) if row.avg_score else 0,
            })

        # 找出关键节点
        milestones = await _find_milestones(db, current_user)

        return {
            "period_days": days,
            "growth_data": growth_data,
            "milestones": milestones,
        }


async def _find_milestones(db: AsyncSession, user: User) -> list:
    """找出关键节点"""
    milestones = []

    # 首次完成算法面试
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .where(InterviewSession.type == 'algorithm')
        .order_by(InterviewSession.created_at)
        .limit(1)
    )
    first_algo = result.scalar_one_or_none()
    if first_algo:
        milestones.append({
            "date": first_algo.created_at.strftime('%Y-%m-%d'),
            "title": "首次完成算法面试",
            "description": f"难度：{first_algo.difficulty}",
        })

    # 首次完成系统设计
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .where(InterviewSession.type == 'system_design')
        .order_by(InterviewSession.created_at)
        .limit(1)
    )
    first_design = result.scalar_one_or_none()
    if first_design:
        milestones.append({
            "date": first_design.created_at.strftime('%Y-%m-%d'),
            "title": "首次完成系统设计面试",
            "description": f"场景：{first_design.scenario}",
        })

    # 最高分记录
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.score['overall'].cast(float).desc())
        .limit(1)
    )
    best_session = result.scalar_one_or_none()
    if best_session:
        milestones.append({
            "date": best_session.created_at.strftime('%Y-%m-%d'),
            "title": "最高分记录",
            "description": f"{best_session.type}：{best_session.score['overall']}/10",
        })

    return sorted(milestones, key=lambda x: x['date'])


@router.get("/recommendations")
async def get_recommendations(
    limit: int = 3,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """获取个性化训练推荐（v2 - 基于简历和JD）"""
    async with async_session() as db:
        # 获取用户数据
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 获取用户能力统计
        abilities = await get_abilities_stats(current_user)

        recommendations = []

        # 1. 基于简历推荐（如果有）
        if user.resume_data and user.resume_data.get('skills'):
            skills = user.resume_data['skills']
            all_skills = (
                skills.get('programming_languages', []) +
                skills.get('frameworks', []) +
                skills.get('databases', []) +
                skills.get('tools', [])
            )

            # 识别薄弱技能（假设某些技能是热门但用户不具备）
            popular_skills = ['Go', 'Rust', 'Kubernetes', 'Spark', 'Flink']
            missing_popular = [s for s in popular_skills if s not in all_skills]

            if missing_popular:
                recommendations.append({
                    "type": "algorithm",
                    "title": f"学习{missing_popular[0]}",
                    "reason": f"你的简历中缺少{missing_popular[0]}技能，这是当前热门技术，建议学习",
                    "priority": 1,
                    "scenario": "learn_popular_skill",
                })

        # 2. 基于JD推荐（如果有）
        if user.target_jd_data:
            jd = user.target_jd_data

            # 提取JD要求的技能
            required_skills = jd.get('skills', {}).get('required', [])
            preferred_skills = jd.get('skills', {}).get('preferred', [])

            # 提取用户简历中的技能
            resume_skills = []
            if user.resume_data and user.resume_data.get('skills'):
                resume_skills = (
                    user.resume_data['skills'].get('programming_languages', []) +
                    user.resume_data['skills'].get('frameworks', []) +
                    user.resume_data['skills'].get('databases', [])
                )

            # 找出差距
            missing_skills = [s for s in required_skills if s not in resume_skills]
            matched_skills = [s for s in required_skills if s in resume_skills]

            if missing_skills:
                # 推荐学习缺失的技能
                skill = missing_skills[0]
                recommendations.append({
                    "type": "algorithm",
                    "title": f"加强{skill}学习",
                    "reason": f"目标岗位要求{skill}技能，但你的简历中未体现",
                    "priority": 1,
                    "scenario": "target_jd_gap",
                })

            # 基于JD要求推荐训练类型
            jd_responsibilities = jd.get('responsibilities', [])
            if any('架构' in r or '设计' in r for r in jd_responsibilities):
                recommendations.append({
                    "type": "system_design",
                    "title": "系统设计训练",
                    "reason": "目标岗位强调架构设计能力，建议加强系统设计训练",
                    "priority": 2,
                    "scenario": "design_weibo_feed",
                })

            # 基于JD软技能要求
            soft_skills = jd.get('requirements', {}).get('soft_skills', [])
            if soft_skills:
                recommendations.append({
                    "type": "workplace",
                    "title": "职场场景训练",
                    "reason": f"目标岗位强调软技能（{', '.join(soft_skills[:2])}）",
                    "priority": 2,
                    "scenario": "tech_proposal",
                })

        # 3. 基于历史表现推荐（原有逻辑）
        if abilities['algorithm'] < abilities['system_design']:
            recommendations.append({
                "type": "algorithm",
                "title": "算法面试训练",
                "reason": f"你的算法能力（{abilities['algorithm']}分）低于系统设计能力，建议加强练习",
                "priority": 1,
                "difficulty": "medium",
            })
        else:
            recommendations.append({
                "type": "system_design",
                "title": "系统设计训练",
                "reason": f"你的系统设计能力（{abilities['system_design']}分）有待提升",
                "priority": 1,
                "scenario": "design_weibo_feed",
            })

        # 基于历史表现推荐
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == current_user.id)
            .where(InterviewSession.type == 'algorithm')
            .order_by(InterviewSession.created_at.desc())
            .limit(5)
        )
        recent_algo = result.scalars().all()

        if recent_algo:
            avg_score = sum(s.score['overall'] for s in recent_algo if s.score) / len(recent_algo)
            if avg_score > 8:
                recommendations.append({
                    "type": "algorithm",
                    "title": "挑战困难算法题",
                    "reason": "你最近的表现很好，可以尝试更高难度的题目",
                    "priority": 2,
                    "difficulty": "hard",
                })
            else:
                recommendations.append({
                    "type": "algorithm",
                    "title": "巩固中等难度算法",
                    "reason": "建议先巩固基础，再挑战高难度",
                    "priority": 2,
                    "difficulty": "medium",
                })

        # 基于训练频率推荐
        result = await db.execute(
            select(func.count(InterviewSession.id))
            .where(InterviewSession.user_id == current_user.id)
            .where(InterviewSession.created_at >= datetime.utcnow() - timedelta(days=7))
        )
        week_count = result.scalar() or 0

        if week_count < 2:
            recommendations.append({
                "type": "any",
                "title": "保持训练频率",
                "reason": "本周你只完成了少量训练，建议保持每周至少2次的训练频率",
                "priority": 3,
            })

        # 按优先级排序并限制数量
        recommendations = sorted(recommendations, key=lambda x: x['priority'])[:limit]

        return {
            "recommendations": recommendations,
            "abilities": abilities,
        }
