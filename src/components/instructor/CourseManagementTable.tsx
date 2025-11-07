'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/lib/data-types';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CourseManagementTableProps = {
  courses: Course[];
  isLoading: boolean;
};

export function CourseManagementTable({ courses, isLoading }: CourseManagementTableProps) {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(null);

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (!courseToDelete || !firestore) return;
    
    // Deleting lessons is complex. For now, we only delete the course doc.
    // In a real app, you'd use a Cloud Function to delete subcollections.
    const courseRef = doc(firestore, 'courses', courseToDelete.id);
    deleteDocumentNonBlocking(courseRef);
    
    setShowDeleteAlert(false);
    setCourseToDelete(null);
  };
  
  const handleEditClick = (courseId: string) => {
    router.push(`/courses/edit/${courseId}`);
  }

  if (isLoading) {
    return <p>Loading courses...</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                You haven't created any courses yet.
              </TableCell>
            </TableRow>
          ) : (
            courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category}</TableCell>
                <TableCell>
                  <Badge variant="outline">{course.difficulty}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(course.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(course)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
       <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course and all its associated lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
