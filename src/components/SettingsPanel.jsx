import React, { useRef, useState } from 'react';
import { extractPdfText } from '../utils/pdfExtract';
import { activateLicenseKey } from '../hooks/useStats';

const FONTS = [
  { id: 'sans',     label: 'Default',  sample: 'Aa' },
  { id: 'serif',    label: 'Serif',    sample: 'Aa' },
  { id: 'mono',     label: 'Mono',     sample: 'Aa' },
  { id: 'dyslexic', label: 'Dyslexic', sample: 'Aa' },
];

const FONT_PREVIEW_STYLES = {
  sans:    { fontFamily: 'Inter, system-ui, sans-serif' },
  serif:   { fontFamily: 'Georgia, serif' },
  mono:    { fontFamily: '"Courier New", monospace' },
  dyslexic:{ fontFamily: '"Comic Sans MS", cursive', letterSpacing: '0.05em' },
};

const CHUNKS = [
  { value: 1, label: '1 word' },
  { value: 2, label: '2 words' },
  { value: 3, label: '3 words' },
];

export function SettingsPanel({ isOpen, onClose, settings, onChange, onLoadText, isPro, onProActivated }) {
  const { bionicMode, chunkSize, fontFamily } = settings;
  const textareaRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [pdfStatus, setPdfStatus] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState(null); // null | 'validating' | 'success' | 'error'
  const [licenseError, setLicenseError] = useState('');

  const set = (key, val) => onChange({ ...settings, [key]: val });

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfStatus('loading');
    try {
      const text = await extractPdfText(file);
      if (!text || text.length < 10) throw new Error('No text found');
      onLoadText(text);
      onClose();
    } catch {
      setPdfStatus('error');
    } finally {
      // reset input so same file can be re-selected
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleActivateLicense = async () => {
    const key = licenseKey.trim().toUpperCase();
    if (!key.startsWith('RPRO-')) {
      setLicenseError('Key should start with RPRO-');
      setLicenseStatus('error');
      return;
    }
    setLicenseStatus('validating');
    setLicenseError('');
    try {
      const result = await activateLicenseKey(key);
      if (result.success) {
        setLicenseStatus('success');
        onProActivated?.();
      } else {
        setLicenseStatus('error');
        setLicenseError(result.reason || 'Invalid key');
      }
    } catch {
      setLicenseStatus('error');
      setLicenseError('Network error — check your connection');
    }
  };

  const handlePaste = () => {
    const val = textareaRef.current?.value?.trim();
    if (val) {
      onLoadText(val);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          style={{ background: 'transparent' }}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col"
        style={{
          background: '#111',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Settings</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Bionic Reading */}
          <section>
            <label className="flex justify-between items-center cursor-pointer" onClick={() => set('bionicMode', !bionicMode)}>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Bionic Reading</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Bold the first half of each word</p>
              </div>
              <div
                className="relative w-10 h-5 rounded-full transition-colors duration-200"
                style={{ background: bionicMode ? '#FF3B30' : '#333' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: bionicMode ? '22px' : '2px' }}
                />
              </div>
            </label>
          </section>

          {/* Chunk Size */}
          <section>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Words per Flash</p>
            <div className="flex gap-2">
              {CHUNKS.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('chunkSize', c.value)}
                  className="flex-1 py-2 rounded text-xs transition"
                  style={{
                    background: chunkSize === c.value ? '#FF3B30' : '#1e1e1e',
                    color: chunkSize === c.value ? '#fff' : '#888',
                    border: chunkSize === c.value ? '1px solid #FF3B30' : '1px solid #2a2a2a',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font */}
          <section>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Font Style</p>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => set('fontFamily', f.id)}
                  className="flex flex-col items-center py-3 rounded transition"
                  style={{
                    background: fontFamily === f.id ? 'rgba(255,59,48,0.15)' : '#1a1a1a',
                    border: fontFamily === f.id ? '1px solid #FF3B30' : '1px solid #2a2a2a',
                  }}
                >
                  <span className="text-xl text-white mb-1" style={FONT_PREVIEW_STYLES[f.id]}>{f.sample}</span>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: fontFamily === f.id ? '#FF3B30' : '#666' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* License Key */}
          <section>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">License Key</p>
            {isPro || licenseStatus === 'success' ? (
              <div
                className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50' }}
              >
                ✓ Pro Active
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="RPRO-XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={e => { setLicenseKey(e.target.value.toUpperCase()); setLicenseStatus(null); }}
                  className="w-full rounded-lg px-3 py-2.5 text-xs text-white outline-none mb-2"
                  style={{
                    background: '#1a1a1a',
                    border: `1px solid ${licenseStatus === 'error' ? '#FF3B30' : '#2a2a2a'}`,
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                  }}
                />
                {licenseStatus === 'error' && (
                  <p className="text-[10px] mb-2" style={{ color: '#FF3B30' }}>{licenseError}</p>
                )}
                <button
                  onClick={handleActivateLicense}
                  disabled={licenseStatus === 'validating' || !licenseKey.trim()}
                  className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition"
                  style={{
                    background: licenseStatus === 'validating' ? '#1a1a1a' : '#FF3B30',
                    color: licenseStatus === 'validating' ? '#555' : '#fff',
                    cursor: licenseStatus === 'validating' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {licenseStatus === 'validating' ? '⟳ Validating…' : 'Activate'}
                </button>
              </>
            )}
          </section>

          {/* Load PDF */}
          <section>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Load PDF</p>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfChange}
            />
            <button
              onClick={() => { setPdfStatus(null); pdfInputRef.current?.click(); }}
              disabled={pdfStatus === 'loading'}
              className="w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2"
              style={{
                background: pdfStatus === 'error' ? '#3a1a1a' : '#1e1e1e',
                color: pdfStatus === 'error' ? '#ff6b6b' : '#aaa',
                border: `1px solid ${pdfStatus === 'error' ? '#ff3b30' : '#2a2a2a'}`,
                cursor: pdfStatus === 'loading' ? 'not-allowed' : 'pointer',
              }}
            >
              {pdfStatus === 'loading' ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  Extracting...
                </>
              ) : pdfStatus === 'error' ? (
                '✕ Could not extract text — try another PDF'
              ) : (
                '📄 Choose PDF file'
              )}
            </button>
            <p className="text-[10px] text-gray-700 mt-1.5">Text-based PDFs only. Scanned images won't work.</p>
          </section>

          {/* Paste Custom Text */}
          <section>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Paste Custom Text</p>
            <textarea
              ref={textareaRef}
              rows={5}
              placeholder="Paste any text here to start reading..."
              className="w-full rounded p-3 text-xs text-gray-300 resize-none outline-none"
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                lineHeight: '1.6',
              }}
              onFocus={e => e.target.style.borderColor = '#444'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
            <button
              onClick={handlePaste}
              className="mt-2 w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition"
              style={{ background: '#FF3B30', color: '#fff' }}
              onMouseEnter={e => e.target.style.background = '#e0322a'}
              onMouseLeave={e => e.target.style.background = '#FF3B30'}
            >
              Start Reading
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
