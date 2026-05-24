import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AgentProvider } from './contexts/AgentContext.tsx';
import { BusinessProvider } from './contexts/BusinessContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AgentProvider>
        <BusinessProvider>
          <App />
        </BusinessProvider>
      </AgentProvider>
    </AuthProvider>
  </StrictMode>
);
