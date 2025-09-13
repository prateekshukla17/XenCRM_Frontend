'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }

    // Check for error in URL params
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [session, router, searchParams]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      setError('Failed to sign in. Please try again.');
    }
  };

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md max-w-md w-full'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Welcome to CRM</h1>

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
