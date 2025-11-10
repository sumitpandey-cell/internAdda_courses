
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/layout/Header';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  avatar: z.string().url('Please enter a valid URL for your avatar.').or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      avatar: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.displayName || '',
        email: user.email || '',
        avatar: user.photoURL || '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.name,
        photoURL: data.avatar,
      });

      // Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, { 
          name: data.name, 
          avatar: data.avatar 
      }, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
            <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                <div className="flex items-center gap-4">
                    <UserIcon className="h-8 w-8" />
                    <div>
                        <CardTitle>My Profile</CardTitle>
                        <CardDescription>Manage your account details.</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={form.watch('avatar') || user?.photoURL || ''} />
                            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="avatar">Avatar URL</Label>
                            <Input id="avatar" placeholder="https://example.com/avatar.png" {...form.register('avatar')} />
                            {form.formState.errors.avatar && <p className="text-sm text-destructive">{form.formState.errors.avatar.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...form.register('name')} />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...form.register('email')} readOnly disabled />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                    </Button>
                </form>
                </CardContent>
            </Card>
            </div>
      </main>
    </div>
  );
}
