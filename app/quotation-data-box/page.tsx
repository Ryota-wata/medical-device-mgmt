'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /quotation-data-box にアクセスした場合は /quotation-data-box/purchase-management にリダイレクト
export default function QuotationDataBoxRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotation-data-box/purchase-management');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: '#f5f5f5'
    }}>
      <p>リダイレクト中...</p>
    </div>
  );
}
