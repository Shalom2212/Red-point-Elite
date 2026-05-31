import React from 'react';

const FONT_STYLES = {
  sans:    { fontFamily: 'Inter, system-ui, sans-serif' },
  serif:   { fontFamily: 'Georgia, "Times New Roman", serif' },
  mono:    { fontFamily: '"Courier New", Courier, monospace' },
  dyslexic:{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive', letterSpacing: '0.06em' },
};

function BionicWord({ word }) {
  const boldLen = Math.ceil(word.length / 2);
  return (
    <span>
      <strong style={{ color: '#fff' }}>{word.slice(0, boldLen)}</strong>
      <span style={{ color: '#ccc' }}>{word.slice(boldLen)}</span>
    </span>
  );
}

function ORPWord({ word }) {
  const pivotIndex = Math.max(0, Math.min(Math.floor((word.length + 1) / 4), word.length - 1));
  return (
    <>
      <span className="flex-1 text-right whitespace-pre">{word.slice(0, pivotIndex)}</span>
      <span className="text-pivot-red">{word[pivotIndex]}</span>
      <span className="flex-1 text-left whitespace-pre">{word.slice(pivotIndex + 1)}</span>
    </>
  );
}

export function WordDisplay({ chunk = [], bionicMode = false, fontFamily = 'sans' }) {
  if (!chunk || chunk.length === 0) return null;

  const dynStyle = FONT_STYLES[fontFamily] || FONT_STYLES.sans;

  if (chunk.length === 1) {
    const word = chunk[0];
    if (bionicMode) {
      return (
        <div
          className="flex w-full justify-center items-center text-6xl font-medium tracking-[-0.02em]"
          style={dynStyle}
        >
          <BionicWord word={word} />
        </div>
      );
    }
    return (
      <div
        className="flex w-full justify-center items-center text-6xl fluid-word font-medium tracking-[-0.02em] text-white"
        style={dynStyle}
      >
        <ORPWord word={word} />
      </div>
    );
  }

  // Chunk mode (2–3 words)
  return (
    <div
      className="flex w-full justify-center items-center gap-5 text-5xl font-medium tracking-[-0.01em] text-white"
      style={dynStyle}
    >
      {chunk.map((word, i) =>
        bionicMode
          ? <BionicWord key={i} word={word} />
          : <span key={i}>{word}</span>
      )}
    </div>
  );
}
