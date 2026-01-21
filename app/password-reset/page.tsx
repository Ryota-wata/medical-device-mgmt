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
    <div className="min-h-dvh flex items-center justify-center fixed inset-0 bg-slate-100">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-5 p-12">
        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-4 text-balance text-slate-800">
          パスワード再設定
        </h1>

        {/* 説明文 */}
        <p className="text-center mb-8 text-sm text-pretty text-slate-500">
          登録されたメールアドレスにパスワード再設定用のリンクを送信します。
        </p>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-slate-500">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="登録メールアドレスを入力"
              className="w-full px-4 py-3 rounded-lg text-base border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
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
            className="w-full text-white border-0 rounded-lg text-base font-semibold cursor-pointer py-3.5 px-6 bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>

        {/* ログイン画面に戻るリンク */}
        <div className="mt-6 text-center">
          <a
            href="#"
            onClick={handleBackToLogin}
            className="text-sm text-slate-500 hover:text-emerald-500 transition-colors"
          >
            ログイン画面に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
