"use client";

import React from 'react';
import Link from 'next/link';
import { users as allUsers, units } from '@/lib/data';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { User, Users, LineChart } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function TeacherDashboardPage() {
  const { getStudentAttempts, loadingData } = useAppData();
  const students = allUsers.filter(user => user.role === 'student');

  if (loadingData) {
    return <LoadingSpinner text="Loading teacher dashboard..." />;
  }
  
  const calculateOverallProgress = (studentId: string) => {
    const attempts = getStudentAttempts(studentId);
    if (attempts.length === 0) return 0;
    
    const totalRounds = units.reduce((sum, unit) => sum + unit.rounds.length, 0);
    if (totalRounds === 0) return 0;

    // Consider only unique rounds completed
    const uniqueCompletedRounds = new Set(attempts.map(a => `${a.unitId}-${a.roundId}`)).size;
    
    return Math.round((uniqueCompletedRounds / totalRounds) * 100);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight">Teacher Dashboard</h1>
        <p className="text-xl text-muted-foreground mt-2">Monitor your students' progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled in the course.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for students.
            </p>
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Student Progress Overview</CardTitle>
          <CardDescription>Click on a student to view detailed progress and errors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.map(student => {
            const overallProgress = calculateOverallProgress(student.id);
            return (
              <Link key={student.id} href={`/teacher/student/${student.id}/progress`} passHref>
                <div className="flex items-center p-4 border border-border/70 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(student.name)}`} alt={student.name} data-ai-hint="avatar person" />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-foreground">{student.name}</h3>
                    <Progress value={overallProgress} className="w-full h-2 my-1" />
                    <p className="text-sm text-muted-foreground">Overall Completion: {overallProgress}%</p>
                  </div>
                  <Button variant="ghost" size="sm">View Details</Button>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
