"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  const getBasePath = () => {
    if (!currentUser) return "/";
    return currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
  }


  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push(getBasePath())}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push(getBasePath())}
            aria-label="Go to dashboard"
          >
            <BookOpenCheck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-headline font-semibold text-foreground">EnglishCourse</span>
          </div>
          
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCircle className="h-5 w-5" />
                <span>{currentUser.name} ({currentUser.role})</span>
              </div>
              {currentUser.role === 'student' && (
                <Button variant="ghost" size="sm" onClick={() => handleNavigation('/student/grades')}>My Grades</Button>
              )}
              {currentUser.role === 'teacher' && (
                 <Button variant="ghost" size="sm" onClick={() => handleNavigation('/teacher/grades')}>Manage Grades</Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
