import React, { useState, useEffect } from 'react';
import { useReader } from './hooks/useReader';
import { WordDisplay } from './components/WordDisplay';
import { UpgradeModal } from './components/UpgradeModal';

const SAMPLE_TEXT = `Welcome to Red Point Elite. Highlight any text on the web, right-click, and select "Read with Red Point Elite" to start reading. Or click the extension icon to instantly extract the entire article on the page. Prepare to enter the optimal flow state.`;

const ContextGhostBlock = ({ words, currentIndex }) => {
  if (words.length === 0) return null;
  // Span roughly 20 words before and 20 words after
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
};

export default function App({ onClose, initialText }) {
  const [text, setText] = useState(initialText || SAMPLE_TEXT);
  const [isPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // New States
  const [isZenMode, setIsZenMode] = useState(false);
  const skipSizes = [5, 10, 20, 50];
  const [skipIndex, setSkipIndex] = useState(1); // Default 10w
  const skipSize = skipSizes[skipIndex];
  
  const { words, index, isPlaying, setIsPlaying, wpm, setWpm, progress, setIndex } = useReader(text, 350);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showUpgradeModal) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'ArrowLeft') {
        setIndex(Math.max(0, index - skipSize));
      } else if (e.key === 'ArrowRight') {
        setIndex(Math.min(words.length - 1, index + skipSize));
      } else if (e.key.toLowerCase() === 'z') {
        setIsZenMode(z => !z);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUpgradeModal, index, words.length, skipSize, setIsPlaying, setIndex]);

  const handleWpmChange = (e) => {
    const newWpm = Number(e.target.value);
    if (!isPremium && newWpm > 400) {
      setShowUpgradeModal(true);
      setWpm(400);
    } else {
      setWpm(newWpm);
    }
  };

  const cycleSkipSize = (e) => {
    e.stopPropagation();
    setSkipIndex((skipIndex + 1) % skipSizes.length);
  };

  const handleChamberClick = (e) => {
    if (showUpgradeModal) return;
    const clickX = e.clientX;
    const width = window.innerWidth;
    
    if (clickX < width * 0.2) {
      setIndex(Math.max(0, index - skipSize));
    } else if (clickX > width * 0.8) {
      setIndex(Math.min(words.length - 1, index + skipSize));
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-chamber-bg text-gray-300 font-sans shadow-2xl flex flex-col pointer-events-auto">
      
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Top Header / Controls - Hidden in Zen Mode */}
      {!isZenMode && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between flex-row items-center z-10 opacity-80 hover:opacity-100 transition-opacity">
          <div className="text-pivot-red font-bold tracking-widest text-sm uppercase flex items-center gap-3">
            Red Point {isPremium ? "Elite" : "Free"}
            {!isPremium && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-[10px] px-2 py-1 rounded-sm text-white"
              >
                UPGRADE
              </button>
            )}
          </div>
          
          <div className="flex gap-4 items-center">
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsZenMode(true); }} 
              className="text-xs uppercase tracking-widest px-2 py-1 border border-transparent hover:border-gray-600 rounded transition"
              title="Press 'Z' to toggle"
            >
              Zen Mode
            </button>

            <button 
              onClick={cycleSkipSize} 
              className="text-xs uppercase tracking-widest ml-2 border border-gray-600 px-2 py-1 rounded hover:bg-gray-800 transition min-w-[70px] text-center"
            >
              Skip: {skipSize}w
            </button>

            <label className="text-xs uppercase tracking-widest flex items-center gap-2 ml-4">
              WPM Dial
              <div className="relative flex items-center">
                <input 
                  type="range" 
                  min="150" max="1000" step="50"
                  value={wpm}
                  onChange={handleWpmChange}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-pivot-red w-24 relative z-10"
                />
                {!isPremium && (
                   <div 
                     className="absolute left-0 h-1 top-1/2 -translate-y-1/2 bg-yellow-500/50 pointer-events-none rounded" 
                     style={{ width: '30%' }} 
                   />
                )}
              </div>
              <span className="w-8 text-right">{wpm}</span>
            </label>
            
            {onClose && (
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-xs uppercase tracking-widest border border-gray-600 px-3 py-1 rounded hover:bg-gray-800 transition ml-2">
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Focus Chamber */}
      <div className="flex-1 flex flex-col justify-center items-center relative" onClick={handleChamberClick}>
        
        {/* Cinema Focus Guides */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-[40px] border-t border-white/10 w-full" />
        <div className="absolute left-0 right-0 top-1/2 translate-y-[40px] border-b border-white/10 w-full" />
        
        {/* Ghost Block Preview - Hidden in Zen Mode */}
        {!isZenMode && <ContextGhostBlock words={words} currentIndex={index} />}

        {/* Word Display Engine */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 flex items-center justify-center">
          {isPlaying || words.length > 0 ? (
            <WordDisplay word={words[index]} />
          ) : (
            <div className="text-gray-600 text-sm tracking-widest uppercase">Fetching Article Data...</div>
          )}
        </div>
        
        {/* Paused Indication - Positioned absolutely near the TOP to avoid collision with multi-line paragraph block below, and hidden in Zen Mode */}
        {!isPlaying && words.length > 0 && !isZenMode && (
          <div className="absolute top-[20%] text-gray-500 tracking-widest uppercase text-xs animate-pulse pointer-events-none">
            {index === 0 ? "Click center to begin, edges to jump" : "Paused. Press Space to Resume."}
          </div>
        )}

      </div>

      {/* Progress Bar - Hidden in Zen Mode */}
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
