import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { initDB } from './services';

initDB().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}).catch(err => {
  createRoot(document.getElementById('root')!).render(
    <div style={{ padding: 20, color: 'red', fontFamily: 'monospace' }}>
      <h1>Database Error</h1>
      <pre>{err.toString()}</pre>
    </div>
  );
});
