"use client";

import React from 'react';
import Link from 'next/link';
import { units } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Edit3 } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function StudentDashboardPage() {
  const { currentUser } = useAuth();
  const { getStudentAttempt, loadingData: appDataLoading } = useAppData();

  if (!currentUser || appDataLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight">Welcome, {currentUser.name}!</h1>
        <p className="text-xl text-muted-foreground mt-2">Ready to learn some English?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <Card key={unit.id} className="flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{unit.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              {unit.rounds.map((round) => {
                const attempt = getStudentAttempt(currentUser.id, unit.id, round.id);
                const score = attempt ? attempt.score : 0;
                const isCompleted = !!attempt;

                return (
                  <div key={round.id} className="p-4 border border-border/70 rounded-lg bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{round.name}</h3>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <Link href={`/student/unit/${unit.id}/round/${round.id}/learn`} passHref>
                      <Button variant="outline" size="sm" className="w-full mb-2">
                        <Edit3 className="mr-2 h-4 w-4" /> Study & Test
                      </Button>
                    </Link>
                    {isCompleted && (
                       <div className="text-sm text-muted-foreground">
                        <Progress value={score} className="w-full h-2 mb-1" />
                        <p>Score: {score}%</p>
                       </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">{unit.rounds.length} rounds in this unit.</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
