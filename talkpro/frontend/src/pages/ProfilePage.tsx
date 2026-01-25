import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { updateUserProfile } from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, logout, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    years_of_experience: '',
    current_company: '',
    current_role: '',
    target_role: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      name: user.name || '',
      years_of_experience: user.years_of_experience?.toString() || '',
      current_company: user.current_company || '',
      current_role: user.current_role || '',
      target_role: user.target_role || '',
    });
  }, [user, navigate]);

  const handleSave = async () => {
    if (!token || !user) return;

    setLoading(true);
    setError('');

    try {
      const updates: any = {
        name: formData.name.trim(),
      };

      if (formData.years_of_experience) {
        updates.years_of_experience = parseInt(formData.years_of_experience);
      }

      if (formData.current_company.trim()) {
        updates.current_company = formData.current_company.trim();
      }

      if (formData.current_role.trim()) {
        updates.current_role = formData.current_role.trim();
      }

      if (formData.target_role.trim()) {
        updates.target_role = formData.target_role.trim();
      }

      const updatedUser = await updateUserProfile(token, updates);
      setUser(updatedUser);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        years_of_experience: user.years_of_experience?.toString() || '',
        current_company: user.current_company || '',
        current_role: user.current_role || '',
        target_role: user.target_role || '',
      });
    }
    setEditing(false);
    setError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
              <p className="text-gray-600 mt-2">管理你的账户信息</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                编辑资料
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Account Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">账户信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">邮箱:</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">注册时间:</span>
                <span className="font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">个人信息</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工作年限
              </label>
              <input
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                disabled={!editing}
                placeholder="例如：3"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前公司
              </label>
              <input
                type="text"
                value={formData.current_company}
                onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                disabled={!editing}
                placeholder="例如：某某科技"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前职位
              </label>
              <input
                type="text"
                value={formData.current_role}
                onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                disabled={!editing}
                placeholder="例如：后端工程师"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标职位
              </label>
              <input
                type="text"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                disabled={!editing}
                placeholder="例如：高级工程师、架构师"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg font-semibold hover:bg-red-100 transition-colors"
            >
              退出登录
            </button>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
