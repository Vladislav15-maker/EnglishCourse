"use client";

import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser) ) {
    return <LoadingSpinner />;
  }
  
  return <LoginForm />;
}
