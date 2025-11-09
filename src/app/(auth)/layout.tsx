import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <React.Suspense>{children}</React.Suspense>;
}
