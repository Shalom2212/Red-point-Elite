import React from 'react';

export function WordDisplay({ word }) {
  if (!word) return null;

  // The ORP formula
  const pivotIndex = Math.floor((word.length + 1) / 4);
  
  // Safe bounds check
  const safeIndex = Math.max(0, Math.min(pivotIndex, word.length - 1));

  const prefix = word.slice(0, safeIndex);
  const pivot = word[safeIndex];
  const suffix = word.slice(safeIndex + 1);

  return (
    <div className="flex w-full justify-center items-center text-6xl fluid-word font-sans font-medium tracking-[-0.02em] text-white">
      <div className="flex-1 text-right whitespace-pre">{prefix}</div>
      <div className="text-pivot-red">{pivot}</div>
      <div className="flex-1 text-left whitespace-pre">{suffix}</div>
    </div>
  );
}
