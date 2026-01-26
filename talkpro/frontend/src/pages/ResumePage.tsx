import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { uploadResume, parseResume, deleteResume, getResume } from '../services/api';

interface ResumeData {
  basic_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: {
    programming_languages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    cloud_platforms?: string[];
  };
  work_experience?: Array<{
    company?: string;
    position?: string;
    start_time?: string;
    end_time?: string;
    description?: string;
    achievements?: string[];
  }>;
  projects?: Array<{
    name?: string;
    role?: string;
    tech_stack?: string[];
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    school?: string;
    major?: string;
    degree?: string;
    graduation_time?: string;
  }>;
}

export default function ResumePage() {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadResume();
  }, [isAuthenticated]);

  const loadResume = async () => {
    if (!token) return;

    try {
      const data = await getResume(token);
      setResumeData(data.resume_data);
      setResumeUrl(data.resume_url);
    } catch (err: any) {
      console.error('Failed to load resume:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 验证文件类型
      if (!selectedFile.name.endsWith('.pdf')) {
        setError('请上传PDF格式的简历');
        return;
      }
      // 验证文件大小（5MB）
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await uploadResume(token, formData);
      setSuccess('简历上传成功！正在解析...');
      setFile(null);

      // 自动解析
      setTimeout(async () => {
        await handleParse();
      }, 1000);
    } catch (err: any) {
      setError(err.message || '上传失败，请稍后重试');
      setUploading(false);
    }
  };

  const handleParse = async () => {
    if (!token) return;

    setParsing(true);
    setError('');

    try {
      const data = await parseResume(token);
      setResumeData(data.data);
      setSuccess('简历解析成功！');
      setParsing(false);
      setUploading(false);
    } catch (err: any) {
      setError(err.message || '解析失败，请稍后重试');
      setParsing(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除简历吗？')) return;
    if (!token) return;

    try {
      await deleteResume(token);
      setResumeData(null);
      setResumeUrl(null);
      setSuccess('简历已删除');
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const renderSkills = () => {
    if (!resumeData?.skills) return null;

    const skillCategories = [
      { key: 'programming_languages', label: '编程语言', color: 'bg-blue-100 text-blue-700' },
      { key: 'frameworks', label: '框架', color: 'bg-green-100 text-green-700' },
      { key: 'databases', label: '数据库', color: 'bg-purple-100 text-purple-700' },
      { key: 'tools', label: '工具', color: 'bg-yellow-100 text-yellow-700' },
      { key: 'cloud_platforms', label: '云平台', color: 'bg-pink-100 text-pink-700' },
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">技能栈</h3>
        {skillCategories.map((category) => {
          const skills = resumeData.skills![category.key as keyof ResumeData['skills']] as string[];
          if (!skills || skills.length === 0) return null;
          return (
            <div key={category.key} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">{category.label}</div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className={`px-3 py-1 rounded-full text-sm ${category.color}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWorkExperience = () => {
    if (!resumeData?.work_experience || resumeData.work_experience.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">工作经历</h3>
        {resumeData.work_experience.map((work, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-gray-900">{work.company}</div>
                <div className="text-sm text-gray-600">{work.position}</div>
              </div>
              <div className="text-sm text-gray-500">{work.start_time} - {work.end_time}</div>
            </div>
            {work.description && (
              <p className="text-gray-700 text-sm mb-2">{work.description}</p>
            )}
            {work.achievements && work.achievements.length > 0 && (
              <ul className="text-sm text-gray-600 space-y-1">
                {work.achievements.map((achievement, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProjects = () => {
    if (!resumeData?.projects || resumeData.projects.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">项目经验</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumeData.projects.map((project, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">{project.name}</div>
              <div className="text-sm text-gray-600 mb-2">{project.role}</div>
              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.tech_stack.map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {project.description && (
                <p className="text-gray-700 text-sm mb-2">{project.description}</p>
              )}
              {project.achievements && project.achievements.length > 0 && (
                <ul className="text-sm text-gray-600">
                  {project.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-1">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/')}>
            TalkPro
          </h1>
          <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-gray-900">
            ← 返回个人资料
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">我的简历</h1>
            <p className="text-gray-600 mb-6">
              上传简历后，AI会自动解析你的技能栈、项目经验和工作经历，
              为你提供更精准的训练推荐。
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            {!resumeData ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mb-4">
                  <label className="cursor-pointer">
                    <span className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                      选择PDF文件
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {file && (
                  <div className="text-sm text-gray-600 mb-4">
                    已选择: {file.name}
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  支持PDF格式，文件大小不超过5MB
                </p>
                {file && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {uploading ? '上传中...' : '开始上传'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold text-gray-900">简历已解析</span>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  删除简历
                </button>
              </div>
            )}
          </div>

          {/* Parsed Data */}
          {resumeData && (
            <>
              {/* Basic Info */}
              {resumeData.basic_info && resumeData.basic_info.name && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">基本信息</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">姓名</span>
                      <div className="font-medium text-gray-900">{resumeData.basic_info.name}</div>
                    </div>
                    {resumeData.basic_info.email && (
                      <div>
                        <span className="text-sm text-gray-600">邮箱</span>
                        <div className="font-medium text-gray-900">{resumeData.basic_info.email}</div>
                      </div>
                    )}
                    {resumeData.basic_info.phone && (
                      <div>
                        <span className="text-sm text-gray-600">电话</span>
                        <div className="font-medium text-gray-900">{resumeData.basic_info.phone}</div>
                      </div>
                    )}
                    {resumeData.basic_info.location && (
                      <div>
                        <span className="text-sm text-gray-600">居住地</span>
                        <div className="font-medium text-gray-900">{resumeData.basic_info.location}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {renderSkills()}

              {/* Work Experience */}
              {renderWorkExperience()}

              {/* Projects */}
              {renderProjects()}

              {/* Education */}
              {resumeData.education && resumeData.education.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">教育背景</h2>
                  <div className="space-y-3">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-900">{edu.school}</div>
                            <div className="text-sm text-gray-600">{edu.major} - {edu.degree}</div>
                          </div>
                          <div className="text-sm text-gray-500">{edu.graduation_time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
