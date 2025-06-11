"use client";

import React from 'react';
import GradeManagement from '@/components/teacher/GradeManagement';
import { users as allUsers } from '@/lib/data';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAppData } from '@/contexts/AppDataContext'; // For loadingData state

export default function TeacherGradesPage() {
  const students = allUsers.filter(user => user.role === 'student').map(s => ({id: s.id, name: s.name}));
  const { loadingData } = useAppData();

  if (loadingData) {
    return <LoadingSpinner text="Loading grade management..." />;
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Manage Offline Test Grades</h1>
        <p className="text-lg text-muted-foreground mt-1">Assign and review grades for student offline tests.</p>
      </div>
      <GradeManagement students={students} />
    </div>
  );
}
