import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/authentication/context/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { AppRoutes } from '@/routes';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
