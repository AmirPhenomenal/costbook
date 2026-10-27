import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ConfirmProvider } from './components/Confirm';
import { I18nProvider } from './i18n';
import { setupPwa } from './pwa';
import { AppProvider } from './state';
import './styles.css';

setupPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ConfirmProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ConfirmProvider>
    </I18nProvider>
  </StrictMode>,
);
