'use client';

import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="studybuddy-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

// Export the provider with a more specific name to avoid confusion
export { ClientThemeProvider as Providers }; 