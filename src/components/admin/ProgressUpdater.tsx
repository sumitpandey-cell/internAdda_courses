'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * TEMPORARY ADMIN UTILITY - Remove after fixing lesson completion tracking
 * This component manually updates user progress to 100% for testing
 */
export function ProgressUpdater() {
  const [courseId, setCourseid] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const { firestore, user } = useFirebase();

  const handleUpdateProgress = async () => {
    if (!courseId.trim()) {
      setMessage('❌ Please enter a course ID');
      return;
    }

    if (!firestore || !user) {
      setMessage('❌ Not authenticated');
      return;
    }

    setIsUpdating(true);
    try {
      // Query for existing progress record
      const progressRef = collection(firestore, 'userProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const progressSnap = await getDocs(progressQuery);

      if (progressSnap.empty) {
        setMessage('❌ No progress record found. Complete at least one lesson first.');
        setIsUpdating(false);
        return;
      }

      const progressDoc = progressSnap.docs[0];
      const totalLessons = progressDoc.data().totalLessons || 10; // Default to 10 if not set

      // Update to 100%
      await updateDoc(doc(firestore, 'userProgress', progressDoc.id), {
        percentage: 100,
      });

      setMessage(`✅ Progress updated to 100% for course ${courseId}`);
      setCourseid('');
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg space-y-3">
      <h3 className="font-bold text-yellow-900">🔧 Temporary Progress Updater</h3>
      <p className="text-sm text-yellow-800">
        This is a temporary tool. Once lesson completion tracking is implemented, this can be removed.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Enter course ID"
          value={courseId}
          onChange={(e) => setCourseid(e.target.value)}
          disabled={isUpdating}
          className="text-sm"
        />
        <Button
          onClick={handleUpdateProgress}
          disabled={isUpdating}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {isUpdating ? 'Updating...' : 'Set to 100%'}
        </Button>
      </div>
      {message && (
        <p className={`text-sm font-medium ${message.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
