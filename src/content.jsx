import React from 'react';
import { createRoot } from 'react-dom/client';
import { Readability } from '@mozilla/readability';
import App from './App';
import './index.css';

function initApp(externalText) {
  if (document.getElementById('red-point-elite-root')) return;

  const host = document.createElement('div');
  host.id = 'red-point-elite-root';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100vw';
  host.style.height = '100vh';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none'; // Background clicks pass through when overlay is off, but App has pointer-events-auto
  
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    link.href = chrome.runtime.getURL('content.css');
  } else {
    link.href = '/content.css';
  }
  shadow.appendChild(link);

  const rootDiv = document.createElement('div');
  rootDiv.style.width = '100%';
  rootDiv.style.height = '100%';
  shadow.appendChild(rootDiv);

  const root = createRoot(rootDiv);
  root.render(<App initialText={externalText} onClose={() => {
    root.unmount();
    host.remove();
  }} />);
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'START_RSVP') {
      initApp(request.text);
    } else if (request.action === 'EXTRACT_AND_START') {
      try {
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        // Grab smart text if possible, otherwise fallback to dumb text
        let rawText = article && article.textContent 
          ? article.textContent 
          : (document.querySelector('article') || document.body).innerText;
        
        // Smart Scrubbing: Remove Wikipedia-style [1], [2] citations and fix extra spaces
        const cleanText = rawText.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
        
        initApp(cleanText);
      } catch (err) {
        console.error("Readability extraction failed", err);
        initApp((document.querySelector('article') || document.body).innerText);
      }
    }
  });
}

// For local dev server, so we can test the UI without an extension context
if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
  initApp('');
}
