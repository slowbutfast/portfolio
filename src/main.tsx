import { Profiler, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

window.__REACT_COMMITS__ = 0;

const onRender = () => {
  window.__REACT_COMMITS__ += 1;
};

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('missing #root element');

createRoot(rootEl).render(
  <StrictMode>
    <Profiler id="app" onRender={onRender}>
      <App />
    </Profiler>
  </StrictMode>,
);
