'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RemodelQuotationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotation-management');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      リダイレクト中...
    </div>
  );
}
