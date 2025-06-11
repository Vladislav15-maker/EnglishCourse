"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Star } from 'lucide-react';

export default function StudentGradesPage() {
  const { currentUser } = useAuth();
  const { getStudentOfflineGrades, loadingData } = useAppData();

  if (loadingData || !currentUser) {
    return <LoadingSpinner text="Loading grades..." />;
  }

  const grades = getStudentOfflineGrades(currentUser.id);

  const getGradeColor = (grade: number) => {
    if (grade === 5) return "text-green-500";
    if (grade === 4) return "text-blue-500";
    if (grade === 3) return "text-yellow-500";
    if (grade === 2) return "text-red-500";
    return "text-foreground";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline text-primary">My Offline Test Grades</h1>
      
      {grades.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">You have no offline test grades recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Grades</CardTitle>
            <CardDescription>Here are the grades for your offline tests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-right">Date Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.testName}</TableCell>
                    <TableCell className={`text-center font-bold text-xl ${getGradeColor(grade.grade)}`}>
                      <div className="flex items-center justify-center">
                        {grade.grade}
                        <Star className={`ml-1 h-5 w-5 fill-current ${getGradeColor(grade.grade)}`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{format(new Date(grade.assignedAt), 'PPP')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
