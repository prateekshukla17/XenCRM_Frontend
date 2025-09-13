'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') return <p>Loading...</p>;

  if (!session) return null;

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='bg-white shadow p-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold'>CRM Dashboard</h1>
        <div className='flex items-center gap-4'>
          <span>Welcome, {session.user?.name}</span>
          <button
            onClick={() => signOut()}
            className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className='p-8'>
        <h2 className='text-2xl mb-4'>Welcome to your CRM!</h2>
        <div className='bg-white p-6 rounded-lg shadow'>
          <h3 className='font-bold mb-2'>Your Info:</h3>
          <p>Name: {session.user?.name}</p>
          <p>Email: {session.user?.email}</p>
        </div>
      </div>
    </div>
  );
}
