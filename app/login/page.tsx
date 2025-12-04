'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // ページ読み込み時に保存されたログイン情報を復元
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedRememberMe === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      await login({ username: email, password });

      // ログイン情報を記憶する場合はLocalStorageに保存
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      router.push('/main');
    } catch (err) {
      setError('ログインに失敗しました');
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/password-reset');
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
          {/* メールアドレス */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#5a6c7d' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
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

          {/* ログイン情報を記憶する */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer transition-all"
                style={{
                  accentColor: '#27ae60'
                }}
              />
              <span className="ml-2 text-sm" style={{ color: '#5a6c7d' }}>
                ログイン情報を記憶する
              </span>
            </label>
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

        {/* パスワードリセットリンク */}
        <div className="mt-4 text-center">
          <a
            href="#"
            onClick={handlePasswordReset}
            className="text-sm transition-colors"
            style={{ color: '#5a6c7d' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#27ae60';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#5a6c7d';
            }}
          >
            パスワードをお忘れの方
          </a>
        </div>
      </div>
    </div>
  );
}
