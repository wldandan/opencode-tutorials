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
    """获取个性化训练推荐"""
    async with async_session() as db:
        # 获取用户能力统计
        abilities = await get_abilities_stats(current_user)

        recommendations = []

        # 基于薄弱点推荐
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
