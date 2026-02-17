'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 旧URLからリモデル見積明細へリダイレクト
    router.replace('/quotation-data-box/remodel-quotations');
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      リダイレクト中...
    </div>
  );
}
