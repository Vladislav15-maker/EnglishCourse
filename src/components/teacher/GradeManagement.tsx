"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppData } from '@/contexts/AppDataContext';
import { users as allUsers } from '@/lib/data';
import type { StudentOfflineGrade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

const gradeSchema = z.object({
  studentId: z.string().min(1, "Student is required."),
  testName: z.string().min(3, "Test name must be at least 3 characters."),
  grade: z.coerce.number().min(2, "Grade must be at least 2.").max(5, "Grade must be at most 5."),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

interface GradeManagementProps {
  students: { id: string, name: string }[];
}

const GradeManagement: React.FC<GradeManagementProps> = ({ students }) => {
  const { addOfflineGrade, getStudentOfflineGrades, appData } = useAppData();
  const { toast } = useToast();
  const [selectedStudentForView, setSelectedStudentForView] = useState<string>('');

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      studentId: '',
      testName: '',
      grade: undefined,
    },
  });

  const onSubmit: SubmitHandler<GradeFormValues> = (data) => {
    addOfflineGrade({
      studentId: data.studentId,
      testName: data.testName,
      grade: data.grade,
    });
    toast({ title: "Grade Added", description: `Grade ${data.grade} for ${data.testName} assigned successfully.` });
    form.reset();
    // Refresh displayed grades if the student whose grade was added is selected
    if(data.studentId === selectedStudentForView) {
      // This is a bit of a hack. A proper solution would involve re-triggering data fetch or state update.
      // For now, AppDataContext handles this internally, but to refresh displayed table:
      setSelectedStudentForView(''); // Clear selection
      setTimeout(() => setSelectedStudentForView(data.studentId), 0); // Re-select to trigger re-render of table
    }
  };
  
  const displayedGrades = selectedStudentForView ? getStudentOfflineGrades(selectedStudentForView) : [];

  const getGradeColor = (grade: number) => {
    if (grade === 5) return "text-green-500";
    if (grade === 4) return "text-blue-500";
    if (grade === 3) return "text-yellow-500";
    if (grade === 2) return "text-red-500";
    return "text-foreground";
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Add Offline Test Grade</CardTitle>
          <CardDescription>Enter the details for an offline test.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Unit 1 Vocabulary Test" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade (2-5)</FormLabel>
                    <FormControl>
                      <Input type="number" min="2" max="5" placeholder="Enter grade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-3">Add Grade</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">View Assigned Grades</CardTitle>
          <CardDescription>Select a student to see their offline grades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select onValueChange={setSelectedStudentForView} value={selectedStudentForView}>
              <SelectTrigger>
                <SelectValue placeholder="Select student to view grades" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudentForView && displayedGrades.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedGrades.map(grade => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.testName}</TableCell>
                    <TableCell className={`text-center font-bold text-lg ${getGradeColor(grade.grade)}`}>
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
          )}
          {selectedStudentForView && displayedGrades.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No offline grades found for this student.</p>
          )}
          {!selectedStudentForView && (
            <p className="text-muted-foreground text-center py-4">Please select a student.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeManagement;
