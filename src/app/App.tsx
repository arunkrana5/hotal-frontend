import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/authentication/context/AuthContext';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { AppRoutes } from '@/routes';

const AppContent: React.FC = () => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster
        theme={resolvedTheme}
        position="top-right"
        closeButton
        richColors
        toastOptions={{
          className: 'text-xs rounded-xl shadow-xl font-sans',
        }}
      />
      <ConfirmProvider>
        <AppRoutes />
      </ConfirmProvider>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
