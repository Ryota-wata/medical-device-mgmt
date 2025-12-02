'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { Button, Input } from '@/components/ui';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-2xl font-bold mb-4">
            SHIP
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            医療機器管理システム
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="ユーザー名"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザー名を入力"
            fullWidth
          />

          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            fullWidth
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>テスト用: 任意のユーザー名とパスワードでログイン可能</p>
        </div>
      </div>
    </div>
  );
}
