'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/navbar';

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
    <>
      <Navbar />
      <div className='min-h-screen bg-gradient-background'>
        <div className='p-8'>
          <h2 className='text-2xl mb-4 font-bold text-white'>
            Welcome to your CRM!
          </h2>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='font-bold mb-2'>Your Info:</h3>
            <p>Name: {session.user?.name}</p>
            <p>Email: {session.user?.email}</p>
          </div>
        </div>
      </div>
    </>
  );
}
