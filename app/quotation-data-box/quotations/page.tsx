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
    <div className="p-5 text-center text-content-sub">
      リダイレクト中...
    </div>
  );
}
