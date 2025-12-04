'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    // 簡易的なメールアドレスバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    // 実際のAPI呼び出しをシミュレート
    setTimeout(() => {
      setIsLoading(false);
      setMessage('パスワード再設定用のリンクを送信しました。メールをご確認ください。');
      setEmail('');
    }, 1500);
  };

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/login');
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
        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-4" style={{ color: '#2c3e50' }}>
          パスワード再設定
        </h1>

        {/* 説明文 */}
        <p className="text-center mb-8 text-sm" style={{ color: '#5a6c7d' }}>
          登録されたメールアドレスにパスワード再設定用のリンクを送信します。
        </p>

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
              placeholder="登録メールアドレスを入力"
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

          {/* 成功メッセージ */}
          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* 送信ボタン */}
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
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
            }}
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>

        {/* ログイン画面に戻るリンク */}
        <div className="mt-6 text-center">
          <a
            href="#"
            onClick={handleBackToLogin}
            className="text-sm transition-colors"
            style={{ color: '#5a6c7d' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#27ae60';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#5a6c7d';
            }}
          >
            ログイン画面に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
