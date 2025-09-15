'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function LoginSecContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router, searchParams]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Failed to sign in. Please try again.');
    }
  };

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-[hsl(220,30%,8%,0.8)] backdrop-blur-lg border border-[hsl(210,100%,50%,0.2)] rounded-2xl p-8 shadow-2xl'>
        <h2 className='text-3xl font-bold bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(45,93%,47%)] bg-clip-text text-transparent mb-2'>
          XenCRM SignIn
        </h2>
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors'
        >
          Sign in with Google
        </button>

        <div className='mt-4 text-sm text-gray-600'></div>
      </div>
    </div>
  );
}

export default function LoginSec() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginSecContent />
    </Suspense>
  );
}
