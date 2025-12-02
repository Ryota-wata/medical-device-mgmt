'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }

    try {
      await login({ username, password });
      router.push('/menu');
    } catch (err) {
      setError('ログインに失敗しました');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center fixed top-0 left-0 right-0 bottom-0"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-5"
           style={{ padding: '48px' }}>
        {/* ロゴ */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8"
          style={{
            background: 'linear-gradient(135deg, #2ecc71, #27ae60)'
          }}
        >
          SHIP
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#2c3e50' }}>
          医療機器管理システム
        </h1>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* ユーザー名 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#5a6c7d' }}>
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full px-4 py-3 rounded-lg text-base transition-all"
              style={{
                border: '2px solid #e1e8ed'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* パスワード */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#5a6c7d' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full px-4 py-3 rounded-lg text-base transition-all"
              style={{
                border: '2px solid #e1e8ed'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all"
            style={{
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
            }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* フッター */}
        <div className="mt-6 text-center text-sm" style={{ color: '#5a6c7d' }}>
          <p>テスト用: 任意のユーザー名とパスワードでログイン可能</p>
        </div>
      </div>
    </div>
  );
}
