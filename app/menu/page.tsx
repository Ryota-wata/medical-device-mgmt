'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts';
import { useAuthStore } from '@/lib/stores';

export default function MenuPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const menuItems = [
    {
      title: '資産検索',
      description: '資産情報を検索・表示',
      icon: '🔍',
      path: '/asset-search-result'
    },
    {
      title: '申請一覧',
      description: 'リモデル申請の一覧',
      icon: '📝',
      path: '/application-list'
    },
    {
      title: '見積書管理',
      description: '見積書データボックス',
      icon: '📦',
      path: '/quotation-data-box'
    },
    {
      title: 'QRコード発行',
      description: 'QRコードの発行と印刷',
      icon: '📱',
      path: '/qr-issue'
    },
    {
      title: '現有資産調査',
      description: '現有資産の調査',
      icon: '📊',
      path: '/asset-survey'
    }
  ];

  return (
    <MainLayout title="メニュー" showBackButton={false}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2c3e50' }}>
            ようこそ、{user?.username}さん
          </h2>
          <p style={{ color: '#5a6c7d' }}>
            {user?.department} {user?.section}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="bg-white rounded-lg text-left border-0 cursor-pointer transition-all"
              style={{
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#2c3e50' }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: '#5a6c7d' }}>
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
