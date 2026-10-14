import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import App from './App.jsx';
import { DemoProvider } from './context/DemoContext.jsx';
import './index.css';

gsap.registerPlugin(useGSAP);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
