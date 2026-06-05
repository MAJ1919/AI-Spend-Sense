import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './lib/i18n';
import { AuthProvider } from './lib/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
