"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { users as allUsers, units } from '@/lib/data';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import type { Word } from '@/lib/types';


export default function StudentProgressPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const { getStudentAttempt, loadingData } = useAppData();
  const student = allUsers.find(user => user.id === studentId);

  if (loadingData || !student) {
    return <LoadingSpinner text="Loading student progress..." />;
  }

  // Helper to find word details for error display
  const findWordById = (wordId: string): Word | undefined => {
    for (const unit of units) {
      for (const round of unit.rounds) {
        const foundWord = round.words.find(w => w.id === wordId);
        if (foundWord) return foundWord;
      }
    }
    return undefined;
  };


  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/teacher/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">Progress for {student.name}</h1>
      </div>

      {units.map(unit => (
        <Card key={unit.id} className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{unit.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {unit.rounds.map(round => {
                const attempt = getStudentAttempt(student.id, unit.id, round.id);
                return (
                  <AccordionItem value={`${unit.id}-${round.id}`} key={round.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex justify-between items-center w-full pr-2">
                        <span className="text-lg font-semibold">{round.name}</span>
                        {attempt ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              Score: {attempt.score}%
                            </span>
                            <Progress value={attempt.score} className="w-24 h-2" />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not Attempted</span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/20 rounded-md">
                      {attempt ? (
                        <div>
                          <p className="text-sm mb-2">Completed on: {new Date(attempt.completedAt).toLocaleDateString()}</p>
                          {attempt.errors.length > 0 ? (
                            <div>
                              <h4 className="font-semibold text-destructive mb-1">Errors Made:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {attempt.errors.map(error => {
                                  const wordDetails = findWordById(error.wordId);
                                  return (
                                    <li key={error.wordId} className="flex items-center">
                                      <XCircle className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
                                      <span>
                                        For "<strong>{wordDetails?.russian || 'Unknown word'}</strong>",
                                        answered: <span className="text-destructive font-medium">"{error.incorrectAnswer}"</span>.
                                        Correct: <span className="text-green-600 font-medium">"{wordDetails?.english}"</span>.
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : (
                             <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                <p>Perfect score! No errors.</p>
                             </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">This round has not been attempted yet.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
