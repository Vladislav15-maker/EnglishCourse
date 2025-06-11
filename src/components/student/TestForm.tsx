
"use client";

import React, { useState, useEffect } from 'react';
import type { Word, StudentRoundAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestFormProps {
  unitId: string;
  roundId: string;
  words: Word[];
  onTestComplete: (score: number) => void;
}

const TestForm: React.FC<TestFormProps> = ({ unitId, roundId, words, onTestComplete }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errors, setErrors] = useState<{ wordId: string; incorrectAnswer: string }[]>([]);
  const [testFinished, setTestFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isTransitioningWord, setIsTransitioningWord] = useState(false); // New state

  const { saveStudentAttempt } = useAppData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    setInputValue('');
    setFeedback(null);
    setShowFeedback(false);
    setIsTransitioningWord(false); // Word is ready
    // Consider adding inputRef.current?.focus(); if you manage input focus manually
  }, [currentWordIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTransitioningWord) return; // Don't submit if transitioning

    if (inputValue.trim() === '' && !showFeedback) {
      toast({
        title: "Input Required",
        description: "Please type your answer before checking.",
        variant: "destructive"
      });
      return;
    }

    if (showFeedback || !currentUser) return;

    const isCorrect = inputValue.trim().toLowerCase() === currentWord.english.toLowerCase();
    setShowFeedback(true);
    if (isCorrect) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      setErrors(prev => [...prev, { wordId: currentWord.id, incorrectAnswer: inputValue.trim() }]);
    }
  };

  const handleNextWord = () => {
    setIsTransitioningWord(true); // Start transitioning
    setShowFeedback(false);
    setFeedback(null);
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Test finished
      const correctAnswers = words.length - errors.length;
      const calculatedScore = Math.round((correctAnswers / words.length) * 100);
      setScore(calculatedScore);
      setTestFinished(true);
      setIsTransitioningWord(false); // Finish transitioning
      
      if (currentUser) {
        const attemptData: StudentRoundAttempt = {
          unitId,
          roundId,
          score: calculatedScore,
          errors,
          completedAt: new Date().toISOString(),
        };
        saveStudentAttempt(currentUser.id, attemptData);
        onTestComplete(calculatedScore);
        toast({
          title: "Round Complete!",
          description: `You scored ${calculatedScore}%.`,
        });
      }
    }
  };

  if (testFinished) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Test Complete!</CardTitle>
          <CardDescription>Your score: {score}%</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Progress value={score} className="w-full h-4 mb-4" />
          {score === 100 ? (
            <p className="text-green-600 font-semibold text-lg">Excellent work! Perfect score!</p>
          ) : (
            <p className="text-lg">You made {errors.length} mistake(s).</p>
          )}
          {errors.length > 0 && (
             <div className="mt-4 text-left p-3 bg-muted rounded-md">
                <h4 className="font-semibold mb-2 text-destructive">Review your mistakes:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map(err => {
                    const wordDetail = words.find(w => w.id === err.wordId);
                    return (
                    <li key={err.wordId}>
                        Correct: <span className="font-semibold text-green-600">{wordDetail?.english}</span> (You wrote: <span className="text-destructive">{err.incorrectAnswer}</span> for "{wordDetail?.russian}")
                    </li>
                    );
                })}
                </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = ((currentWordIndex +1) / words.length) * 100;

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center text-primary">Translate the Word</CardTitle>
        <Progress value={progressPercentage} className="w-full h-2 mt-2" />
        <CardDescription className="text-center pt-2">Word {currentWordIndex + 1} of {words.length}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground mb-2">{currentWord.russian}</p>
            <p className="text-sm text-muted-foreground">(Type the English translation)</p>
          </div>
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Your answer..."
            className="text-lg text-center h-12"
            disabled={showFeedback || isTransitioningWord}
            aria-label="English translation input"
            autoFocus
          />
          {!showFeedback ? (
            <Button type="submit" className="w-full text-lg py-3" disabled={isTransitioningWord}>Check</Button>
          ) : (
            <Button type="button" onClick={handleNextWord} className="w-full text-lg py-3" disabled={isTransitioningWord}>
              {currentWordIndex < words.length - 1 ? 'Next Word' : 'Finish Test'}
            </Button>
          )}
          {showFeedback && feedback === 'correct' && (
            <div className="mt-4 p-3 rounded-md bg-green-100 text-green-700 flex items-center justify-center">
              <ThumbsUp className="mr-2 h-5 w-5" /> Correct!
            </div>
          )}
          {showFeedback && feedback === 'incorrect' && (
            <div className="mt-4 p-3 rounded-md bg-red-100 text-red-700 flex items-center justify-center">
              <ThumbsDown className="mr-2 h-5 w-5" /> Incorrect. The correct answer is: <strong className="ml-1">{currentWord.english}</strong>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TestForm;
    
    
