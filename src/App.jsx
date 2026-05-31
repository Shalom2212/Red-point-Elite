import React, { useState, useEffect, useRef } from 'react';
import { useReader } from './hooks/useReader';
import { useStats, getTrialStatus, getLicenseStatus, saveSession, clearSession, loadSession } from './hooks/useStats';
import { WordDisplay } from './components/WordDisplay';
import { UpgradeModal } from './components/UpgradeModal';
import { SettingsPanel } from './components/SettingsPanel';
import { SessionComplete } from './components/SessionComplete';

const SAMPLE_TEXT = `Welcome to Red Point Elite. Highlight any text on the web, right-click, and select "Read with Red Point Elite" to start reading. Or click the extension icon to instantly extract the entire article on the page. Prepare to enter the optimal flow state.`;

const SETTINGS_KEY = 'rp_settings';
const FREE_WPM_CAP = 400;

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; }
  catch { return {}; }
}

function ContextGhostBlock({ words, currentIndex }) {
  if (words.length === 0) return null;
  const start = Math.max(0, currentIndex - 20);
  const end = Math.min(words.length, currentIndex + 21);
  return (
    <div className="absolute left-0 right-0 top-1/2 translate-y-[80px] flex justify-center items-start pointer-events-none px-8">
      <p className="text-[13px] text-gray-600/40 tracking-wide font-serif max-w-3xl text-center leading-relaxed">
        {words.slice(start, currentIndex).join(' ')}
        {start < currentIndex && ' '}
        <span className="text-gray-300 mx-[2px] font-medium border-b border-gray-600/30 pb-[1px]">
          {words[currentIndex]}
        </span>
        {' '}
        {words.slice(currentIndex + 1, end).join(' ')}
      </p>
    </div>
  );
}

function formatEta(minutes) {
  if (minutes <= 0) return '';
  if (minutes < 1) return '< 1m left';
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m left`;
  return `${Math.round(minutes)}m left`;
}

export default function App({ onClose, initialText }) {
  const [text, setText] = useState(initialText || SAMPLE_TEXT);
  const [isPro, setIsPro] = useState(false);
  const [trialActive, setTrialActive] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLockedWpm, setUpgradeLockedWpm] = useState(null);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);

  const skipSizes = [5, 10, 20, 50];
  const [skipIndex, setSkipIndex] = useState(1);
  const skipSize = skipSizes[skipIndex];

  const [settings, setSettings] = useState(() => ({
    bionicMode: false,
    chunkSize: 1,
    fontFamily: 'sans',
    ...loadSettings(),
  }));
  const { bionicMode, chunkSize, fontFamily } = settings;

  const { words, chunk, index, isPlaying, setIsPlaying, wpm, setWpm, progress, setIndex } =
    useReader(text, 350, chunkSize);

  const { streak, wordsToday, addWords, recordComplete } = useStats();

  // Check trial + license on mount
  useEffect(() => {
    const { isTrialActive, daysLeft } = getTrialStatus();
    setTrialActive(isTrialActive);
    setTrialDaysLeft(daysLeft);
    getLicenseStatus().then(({ isPro: pro }) => setIsPro(pro));
  }, []);

  // Determine if premium features are available
  const hasFullAccess = isPro || trialActive;

  // Track words read for stats
  const lastIndexRef = useRef(0);
  useEffect(() => {
    const delta = index - lastIndexRef.current;
    if (delta > 0) addWords(delta);
    lastIndexRef.current = index;
  }, [index, addWords]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync initial text
  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  // Check for saved session
  useEffect(() => {
    if (!text || text === SAMPLE_TEXT) return;
    const saved = loadSession(text);
    if (saved && saved.index > 0 && words.length > 0 && saved.index < words.length - 1) {
      setResumeInfo(saved);
    }
  }, [text, words.length]);

  // Save session on unmount
  const textRef = useRef(text);
  const indexRef2 = useRef(index);
  const wpmRef2 = useRef(wpm);
  const wordsLenRef = useRef(0);
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { indexRef2.current = index; }, [index]);
  useEffect(() => { wpmRef2.current = wpm; }, [wpm]);
  useEffect(() => { wordsLenRef.current = words.length; }, [words.length]);
  useEffect(() => {
    return () => {
      const i = indexRef2.current;
      const total = wordsLenRef.current;
      if (i > 0 && total > 0 && i / total < 0.95) {
        saveSession(textRef.current, i, wpmRef2.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Session complete detection
  const sessionCompleteRef = useRef(false);
  useEffect(() => {
    if (!isPlaying && words.length > 0 && index >= words.length - chunkSize && !sessionCompleteRef.current) {
      sessionCompleteRef.current = true;
      recordComplete();
      clearSession();
      setShowSessionComplete(true);
    }
    if (isPlaying) sessionCompleteRef.current = false;
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // WPM cap enforcement — fires AFTER the user feels the speed
  const enforceWpmCap = (targetWpm) => {
    if (hasFullAccess) { setWpm(targetWpm); return; } // pro/trial — no cap
    if (targetWpm > FREE_WPM_CAP) {
      setUpgradeLockedWpm(targetWpm);
      setShowUpgradeModal(true);
      setWpm(FREE_WPM_CAP);
    } else {
      setWpm(targetWpm);
    }
  };

  const handleWpmChange = (e) => enforceWpmCap(Number(e.target.value));

  // ETA
  const etaMinutes = wpm > 0 && words.length > 0 ? (words.length - index) / wpm : 0;
  const etaLabel = formatEta(etaMinutes);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showUpgradeModal || showSettings) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      else if (e.key === 'ArrowLeft') setIndex(Math.max(0, index - skipSize));
      else if (e.key === 'ArrowRight') setIndex(Math.min(words.length - 1, index + skipSize));
      else if (e.key.toLowerCase() === 'z') setIsZenMode(z => !z);
      else if (e.key === 'Escape') {
        if (isZenMode) { setIsZenMode(false); return; }
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUpgradeModal, showSettings, index, words.length, skipSize, isZenMode, setIsPlaying, setIndex, onClose]);

  const handleChamberClick = (e) => {
    if (showUpgradeModal || showSettings || showSessionComplete) return;
    const clickX = e.clientX;
    const width = window.innerWidth;
    if (clickX < width * 0.2) setIndex(Math.max(0, index - skipSize));
    else if (clickX > width * 0.8) setIndex(Math.min(words.length - 1, index + skipSize));
    else setIsPlaying(!isPlaying);
  };

  const handleLoadText = (newText) => {
    setText(newText);
    setIndex(0);
    setIsPlaying(false);
    clearSession();
    setResumeInfo(null);
    sessionCompleteRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-chamber-bg text-gray-300 font-sans shadow-2xl flex flex-col pointer-events-auto">

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          lockedWpm={upgradeLockedWpm}
        />
      )}

      {showSessionComplete && (
        <SessionComplete
          wordCount={index}
          wpm={wpm}
          isPro={isPro}
          onClose={() => setShowSessionComplete(false)}
        />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={setSettings}
        onLoadText={handleLoadText}
        isPro={isPro}
        onProActivated={() => setIsPro(true)}
      />

      {/* Header */}
      {!isZenMode && (
        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-0.5">
            <div className="text-pivot-red font-bold tracking-widest text-sm uppercase flex items-center gap-2">
              Red Point {isPro ? 'Pro' : trialActive ? `Free Trial` : 'Free'}
              {trialActive && !isPro && (
                <span className="text-[9px] text-yellow-500 border border-yellow-500/40 px-1.5 py-0.5 rounded">
                  {trialDaysLeft}d left
                </span>
              )}
              {!isPro && !trialActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); setUpgradeLockedWpm(null); setShowUpgradeModal(true); }}
                  className="bg-pivot-red hover:opacity-90 text-[10px] px-2 py-0.5 rounded text-white font-bold tracking-widest"
                >
                  UPGRADE
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-600">
              {streak > 0 && <span>🔥 {streak}d streak</span>}
              {wordsToday > 0 && <span>{wordsToday.toLocaleString()} words today</span>}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {etaLabel && <span className="text-[11px] text-gray-600 tabular-nums">{etaLabel}</span>}

            <button
              onClick={(e) => { e.stopPropagation(); setIsZenMode(true); }}
              className="text-xs uppercase tracking-widest px-2 py-1 border border-transparent hover:border-gray-600 rounded transition"
              title="Z to toggle"
            >
              Zen
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setSkipIndex((skipIndex + 1) % skipSizes.length); }}
              className="text-xs uppercase tracking-widest border border-gray-600 px-2 py-1 rounded hover:bg-gray-800 transition min-w-[60px] text-center"
            >
              ±{skipSize}w
            </button>

            <label className="text-xs uppercase tracking-widest flex items-center gap-2">
              WPM
              <div className="relative flex items-center">
                <input
                  type="range" min="150" max="1000" step="50"
                  value={wpm}
                  onChange={handleWpmChange}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-pivot-red w-24 relative z-10"
                />
                {!hasFullAccess && (
                  <div
                    className="absolute left-0 h-1 top-1/2 -translate-y-1/2 bg-yellow-500/40 pointer-events-none rounded"
                    style={{ width: '30%' }}
                  />
                )}
              </div>
              <span className="w-8 text-right tabular-nums">{wpm}</span>
            </label>

            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s); }}
              className="text-xs border border-gray-600 px-2 py-1 rounded hover:bg-gray-800 transition"
              title="Settings"
            >⚙</button>

            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-xs uppercase tracking-widest border border-gray-600 px-3 py-1 rounded hover:bg-gray-800 transition"
              >Close</button>
            )}
          </div>
        </div>
      )}

      {/* Chamber */}
      <div className="flex-1 flex flex-col justify-center items-center relative" onClick={handleChamberClick}>
        <div className="absolute left-0 right-0 top-1/2 -translate-y-[40px] border-t border-white/10 w-full" />
        <div className="absolute left-0 right-0 top-1/2 translate-y-[40px] border-b border-white/10 w-full" />

        {!isZenMode && <ContextGhostBlock words={words} currentIndex={index} />}

        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 flex items-center justify-center">
          {words.length > 0
            ? <WordDisplay chunk={chunk} bionicMode={bionicMode} fontFamily={fontFamily} />
            : <div className="text-gray-600 text-sm tracking-widest uppercase">Fetching Article Data...</div>
          }
        </div>

        {!isPlaying && words.length > 0 && !isZenMode && (
          <div className="absolute top-[20%] text-gray-500 tracking-widest uppercase text-xs animate-pulse pointer-events-none">
            {index === 0 ? 'Click center to begin' : 'Paused — Space to resume'}
          </div>
        )}

        {!isZenMode && words.length > 0 && (
          <div className="absolute bottom-6 text-[11px] text-gray-700 tabular-nums pointer-events-none">
            {index + 1} / {words.length}
          </div>
        )}
      </div>

      {/* Resume prompt */}
      {resumeInfo && !isPlaying && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl text-sm pointer-events-auto"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}
        >
          <span className="text-gray-400">
            Resume from {Math.round((resumeInfo.index / words.length) * 100)}%?
          </span>
          <button
            onClick={() => { setIndex(resumeInfo.index); setWpm(resumeInfo.wpm); setResumeInfo(null); }}
            className="text-pivot-red font-bold hover:underline"
          >Resume</button>
          <button onClick={() => setResumeInfo(null)} className="text-gray-600 hover:text-gray-400">Dismiss</button>
        </div>
      )}

      {/* Progress bar */}
      {!isZenMode && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-pivot-red/50 to-pivot-red transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
