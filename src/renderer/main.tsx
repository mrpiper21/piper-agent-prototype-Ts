import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';
import { AppProviders } from './src/app/providers/AppProviders';
import './src/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
