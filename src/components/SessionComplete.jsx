import React from 'react';

export function SessionComplete({ wordCount, wpm, onClose, isPro }) {
  const minutes = wordCount / wpm;
  const normalMinutes = wordCount / 200; // avg reading speed
  const savedMinutes = Math.round(normalMinutes - minutes);

  const tweetText = encodeURIComponent(
    `Just read ${wordCount.toLocaleString()} words at ${wpm} WPM — saved ${savedMinutes} minutes with Red Point Elite 🔴⚡\n\nhttps://redpointelite.com`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
      <div
        className="w-[380px] rounded-2xl p-8 text-center shadow-2xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Big stat */}
        <div className="mb-1 text-5xl font-bold text-white">{wpm} <span className="text-2xl text-gray-500">WPM</span></div>
        <div className="text-sm text-gray-500 mb-6">
          {wordCount.toLocaleString()} words · {savedMinutes > 0 ? `${savedMinutes} min saved vs average reader` : 'session complete'}
        </div>

        {/* Speed bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] text-gray-600 uppercase tracking-widest mb-1">
            <span>Average (200)</span>
            <span>You ({wpm})</span>
            <span>Elite (1200)</span>
          </div>
          <div className="h-1.5 rounded-full w-full" style={{ background: '#1e1e1e' }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, (wpm / 1200) * 100)}%`,
                background: 'linear-gradient(90deg, #FF3B30, #ff6b35)',
              }}
            />
          </div>
        </div>

        {/* Share */}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold mb-3 transition-all"
          style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
        >
          𝕏 &nbsp;Share your speed
        </a>

        {!isPro && (
          <div
            className="text-xs text-gray-600 mb-3 py-2 px-3 rounded-lg"
            style={{ background: '#1a1a1a' }}
          >
            Share with a friend → get <span style={{ color: '#FF3B30' }}>1 week Pro free</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="text-xs text-gray-600 hover:text-gray-400 transition uppercase tracking-widest"
        >
          Close
        </button>
      </div>
    </div>
  );
}
