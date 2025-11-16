import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { ThemeProvider } from '../../context/ThemeContext';
import { SettingsProvider } from '../../context/SettingsContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
