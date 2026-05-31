// Load PDF.js at runtime as a real ES module to avoid import.meta bundling issues.
// The files live in public/ and are declared as web_accessible_resources in manifest.json.

function getPdfJsUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('pdf.min.mjs');
  }
  return '/pdf.min.mjs'; // dev server
}

function getWorkerUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('pdf.worker.min.mjs');
  }
  return '/pdf.worker.min.mjs'; // dev server
}

let _pdfjsLib = null;

async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  // eslint-disable-next-line no-undef
  _pdfjsLib = await import(/* @vite-ignore */ getPdfJsUrl());
  _pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerUrl();
  return _pdfjsLib;
}

export async function extractPdfText(file) {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map(item => item.str).join(' '));
  }

  return pageTexts.join(' ').replace(/\s+/g, ' ').trim();
}
