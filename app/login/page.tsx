'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, TEST_USERS } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const isFormValid = email.trim() !== '' && password.trim() !== '';

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
    setPassword('あ');
    setEmailError('');
    setPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      hasError = true;
    }
    if (!password) {
      setPasswordError('パスワードを入力してください');
      hasError = true;
    }
    if (hasError) return;

    try {
      await login({ username: email, password });

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      router.push('/facility-select');
    } catch (_err) {
      setEmailError('アドレスが間違っています');
      setPasswordError('パスワードが間違ってます');
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/password-reset');
  };

  return (
    <div className="min-h-dvh flex items-center justify-center fixed inset-0 bg-gray-50 overflow-y-auto py-8">
      <div className="bg-white w-full max-w-md mx-5 p-12 my-auto rounded-xl shadow-md">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-center mb-8 text-balance text-gray-800">
          医療機器管理システム
        </h1>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1 text-gray-800">
              <span className="text-red-600">※</span>メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="入力してください"
              className={`w-full px-4 py-3 text-base rounded-lg border outline-none transition-colors ${
                emailError
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-800 focus:border-blue-400'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* パスワード */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1 text-gray-800">
              <span className="text-red-600">※</span>パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="・・・・・"
                className={`w-full px-4 py-3 pr-12 text-base rounded-lg border outline-none transition-colors ${
                  passwordError
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-800 focus:border-blue-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          {/* ログイン状態を記憶する */}
          <div className="mb-6 flex justify-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-5 rounded cursor-pointer accent-green-600"
              />
              <span className="ml-2 text-sm text-gray-500">
                ログイン状態を記憶する
              </span>
            </label>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full border-0 rounded-lg text-base font-semibold py-3.5 px-6 transition-colors ${
              isFormValid
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* パスワードリセットリンク */}
        <div className="mt-4 text-center">
          <a
            href="#"
            onClick={handlePasswordReset}
            className="text-sm underline text-blue-500 hover:text-blue-600 transition-colors"
          >
            パスワードをお忘れの方
          </a>
        </div>

        {/* テストアカウント一覧 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="w-full text-sm text-gray-500 flex items-center justify-center gap-2 transition-colors bg-transparent border-none cursor-pointer"
          >
            <span>テストアカウント一覧</span>
            <span className={`transition-transform ${showTestAccounts ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showTestAccounts && (
            <div className="mt-4 space-y-2">
              {/* SHIP側ユーザー */}
              <div className="text-xs text-gray-400 font-semibold mb-2">SHIP側</div>
              {TEST_USERS.filter(u => !u.email.includes('@hospital')).map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleTestAccountClick(user.email)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors bg-transparent cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{user.roleLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{user.role}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{user.email}</div>
                </button>
              ))}

              {/* 病院側ユーザー */}
              <div className="text-xs text-gray-400 font-semibold mt-4 mb-2">病院側</div>
              {TEST_USERS.filter(u => u.email.includes('@hospital')).map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleTestAccountClick(user.email)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-colors bg-transparent cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{user.roleLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-700">{user.role}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{user.email}</div>
                </button>
              ))}

              <p className="text-xs text-gray-400 mt-3 text-center text-pretty">
                クリックするとメール欄に入力されます（パスワード: あ）
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
