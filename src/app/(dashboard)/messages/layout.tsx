// app/layout.tsx
import ChatRoomsList from './_components/ChatRoomsList';

import { ReactNode } from 'react';


interface LayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'My App',
  description: 'A Next.js 13+ Application',
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Meta tags can also go here if not using metadata */}
      </head>
      <body className="min-h-screen flex flex-col">

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <ChatRoomsList />
          {children}
        </main>
  
      </body>
    </html>
  );
}
