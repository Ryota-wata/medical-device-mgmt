'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, TEST_USERS } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  // ページ読み込み時に保存されたログイン情報を復元
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedRememberMe === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // テストアカウントをクリックしてメール欄に入力
  const handleTestAccountClick = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password'); // テスト用パスワード
  };

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
    <div className="min-h-dvh flex items-center justify-center fixed inset-0 bg-slate-100 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-5 p-12 my-auto">
        {/* ロゴ */}
        <div className="size-20 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 bg-emerald-500">
          SHIP
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-8 text-balance text-slate-800">
          医療機器管理システム
        </h1>

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
              placeholder="メールアドレスを入力"
              className="w-full px-4 py-3 rounded-lg text-base border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
            />
          </div>

          {/* パスワード */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-slate-500">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              className="w-full px-4 py-3 rounded-lg text-base border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
            />
          </div>

          {/* ログイン情報を記憶する */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-5 rounded cursor-pointer accent-emerald-500"
              />
              <span className="ml-2 text-sm text-slate-500">
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
            className="w-full text-white border-0 rounded-lg text-base font-semibold cursor-pointer py-3.5 px-6 bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* パスワードリセットリンク */}
        <div className="mt-4 text-center">
          <a
            href="#"
            onClick={handlePasswordReset}
            className="text-sm text-slate-500 hover:text-emerald-500 transition-colors"
          >
            パスワードをお忘れの方
          </a>
        </div>

        {/* テストアカウント一覧 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <span>テストアカウント一覧</span>
            <span className={`transition-transform ${showTestAccounts ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showTestAccounts && (
            <div className="mt-4 space-y-2">
              {/* SHIP側ユーザー */}
              <div className="text-xs text-slate-400 font-semibold mb-2">SHIP側</div>
              {TEST_USERS.filter(u => !u.email.includes('@hospital')).map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleTestAccountClick(user.email)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{user.roleLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{user.role}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{user.email}</div>
                </button>
              ))}

              {/* 病院側ユーザー */}
              <div className="text-xs text-slate-400 font-semibold mt-4 mb-2">病院側</div>
              {TEST_USERS.filter(u => u.email.includes('@hospital')).map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleTestAccountClick(user.email)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{user.roleLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-700">{user.role}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{user.email}</div>
                </button>
              ))}

              <p className="text-xs text-slate-400 mt-3 text-center text-pretty">
                クリックするとメール欄に入力されます（パスワード: password）
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
