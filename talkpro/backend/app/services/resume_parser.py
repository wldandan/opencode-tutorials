import os
import json
from typing import Dict, Any, List
from ..core.claude import ClaudeClient


class ResumeParser:
    """简历解析器"""

    def __init__(self):
        self.claude = ClaudeClient()

    async def parse_resume(self, resume_text: str) -> Dict[str, Any]:
        """解析简历文本内容

        Args:
            resume_text: 简历的文本内容

        Returns:
            解析后的结构化简历数据
        """

        system_prompt = """你是一位专业的简历分析专家，擅长从简历中提取关键信息。
你的任务是分析简历内容，提取出以下信息并以JSON格式返回：

1. 基本信息：姓名、邮箱、电话、居住地
2. 技能栈：编程语言、框架、数据库、工具、中间件等
3. 工作经历：公司名称、职位、时间、职责描述、主要成果
4. 项目经验：项目名称、技术栈、项目描述、担任角色、项目成果
5. 教育背景：学校、专业、学历、毕业时间

请仔细分析简历，确保提取的信息准确完整。
对于技能，请按照熟练度分类：精通、熟练、了解。
对于工作经历和项目经验，请提取具体的成果和数据（如性能提升、用户量等）。"""

        user_prompt = f"""请分析以下简历内容，提取关键信息并以JSON格式返回：

简历内容：
{resume_text}

请返回以下JSON格式：
{{
    "basic_info": {{
        "name": "姓名",
        "email": "邮箱",
        "phone": "电话",
        "location": "居住地"
    }},
    "skills": {{
        "programming_languages": ["语言1", "语言2"],
        "frameworks": ["框架1", "框架2"],
        "databases": ["数据库1", "数据库2"],
        "tools": ["工具1", "工具2"],
        "cloud_platforms": ["云平台1"]
    }},
    "work_experience": [
        {{
            "company": "公司名称",
            "position": "职位",
            "start_time": "开始时间（如2020年1月）",
            "end_time": "结束时间（如2022年12月或至今）",
            "description": "职责描述",
            "achievements": ["成果1", "成果2"]
        }}
    ],
    "projects": [
        {{
            "name": "项目名称",
            "role": "担任角色",
            "tech_stack": ["技术1", "技术2"],
            "description": "项目描述",
            "achievements": ["成果1", "成果2"]
        }}
    ],
    "education": [
        {{
            "school": "学校名称",
            "major": "专业",
            "degree": "学历（本科/硕士/博士）",
            "graduation_time": "毕业时间"
        }}
    ]
}}

注意：
- 如果某项信息不存在，返回空数组或null
- 时间格式尽量统一
- 技能要分类清楚
- 工作经历按时间倒序排列
- 只返回JSON，不要有其他文字"""

        try:
            response = await self.claude.chat(
                messages=[{"role": "user", "content": user_prompt}],
                system_prompt=system_prompt
            )

            # 提取JSON
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                resume_data = json.loads(json_match.group(0))
            else:
                raise ValueError("No JSON found in response")

            # 确保所有必需字段存在
            resume_data.setdefault("basic_info", {})
            resume_data.setdefault("skills", {})
            resume_data.setdefault("skills", {})
            resume_data["skills"].setdefault("programming_languages", [])
            resume_data["skills"].setdefault("frameworks", [])
            resume_data["skills"].setdefault("databases", [])
            resume_data["skills"].setdefault("tools", [])
            resume_data["skills"].setdefault("cloud_platforms", [])
            resume_data.setdefault("work_experience", [])
            resume_data.setdefault("projects", [])
            resume_data.setdefault("education", [])

            return resume_data

        except Exception as e:
            print(f"Failed to parse resume: {e}")
            # 返回默认结构
            return {
                "basic_info": {},
                "skills": {
                    "programming_languages": [],
                    "frameworks": [],
                    "databases": [],
                    "tools": [],
                    "cloud_platforms": []
                },
                "work_experience": [],
                "projects": [],
                "education": []
            }

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """从PDF文件中提取文本

        Args:
            pdf_path: PDF文件路径

        Returns:
            提取的文本内容
        """
        try:
            import PyPDF2
            text = ""
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            # 如果PyPDF2不可用，尝试pdfplumber
            try:
                import pdfplumber
                text = ""
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() + "\n"
                return text
            except ImportError:
                raise Exception("PDF库未安装，请安装PyPDF2或pdfplumber")
        except Exception as e:
            raise Exception(f"PDF解析失败: {str(e)}")

    async def analyze_resume_against_jd(
        self,
        resume_data: Dict[str, Any],
        jd_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """对比简历和JD，生成差距分析

        Args:
            resume_data: 简历数据
            jd_data: JD数据

        Returns:
            差距分析结果
        """

        system_prompt = """你是一位专业的职业规划顾问，擅长分析简历和职位要求之间的差距。
你的任务是对比简历和JD，识别能力差距，并给出改进建议。"""

        user_prompt = f"""请对比以下简历和职位描述（JD），生成差距分析：

简历数据：
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

职位描述数据：
{json.dumps(jd_data, ensure_ascii=False, indent=2)}

请返回以下JSON格式：
{{
    "match_score": 匹配度评分（0-100），
    "matched_skills": ["匹配的技能1", "匹配的技能2"],
    "missing_skills": ["缺少的技能1", "缺少的技能2"],
    "gap_analysis": {{
        "technical_gap": "技术差距描述",
        "experience_gap": "经验差距描述",
        "education_gap": "学历差距描述"
    }},
    "improvement_suggestions": [
        "改进建议1",
        "改进建议2",
        "改进建议3"
    ],
    "recommended_training": [
        {{
            "type": "algorithm" | "system_design" | "workplace",
            "reason": "推荐理由",
            "priority": 1 | 2 | 3
        }}
    ]
}}

注意：
- 匹配度评分要客观（0-100分）
- 差距分析要具体
- 改进建议要可操作
- 推荐训练要基于实际需求
"""

        try:
            response = await self.claude.chat(
                messages=[{"role": "user", "content": user_prompt}],
                system_prompt=system_prompt
            )

            # 提取JSON
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                gap_analysis = json.loads(json_match.group(0))
            else:
                raise ValueError("No JSON found in response")

            # 确保所有字段存在
            gap_analysis.setdefault("match_score", 70)
            gap_analysis.setdefault("matched_skills", [])
            gap_analysis.setdefault("missing_skills", [])
            gap_analysis.setdefault("gap_analysis", {})
            gap_analysis.setdefault("improvement_suggestions", [])
            gap_analysis.setdefault("recommended_training", [])

            return gap_analysis

        except Exception as e:
            print(f"Failed to analyze gap: {e}")
            # 返回默认分析
            return {
                "match_score": 70,
                "matched_skills": [],
                "missing_skills": [],
                "gap_analysis": {
                    "technical_gap": "",
                    "experience_gap": "",
                    "education_gap": ""
                },
                "improvement_suggestions": ["建议加强技术深度", "建议积累更多项目经验"],
                "recommended_training": []
            }
