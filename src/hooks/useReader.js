import { useState, useEffect, useRef, useCallback } from 'react';

export function useReader(initialText = '', initialWpm = 300, chunkSize = 1) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const [progress, setProgress] = useState(0);

  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const wordsRef = useRef([]);
  const wpmRef = useRef(initialWpm);
  const chunkSizeRef = useRef(chunkSize);

  const requestRef = useRef(null);
  const previousTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentDelayRef = useRef(0);

  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { chunkSizeRef.current = chunkSize; }, [chunkSize]);

  useEffect(() => {
    if (initialText) {
      const parsedWords = initialText.trim().split(/\s+/).filter(w => w.length > 0);
      setWords(parsedWords);
      setIndex(0);
    }
  }, [initialText]);

  useEffect(() => {
    if (words.length > 0) {
      setProgress((index / (words.length || 1)) * 100);
    } else {
      setProgress(0);
    }
  }, [index, words.length]);

  const calculateDelay = useCallback((word, currentWpm, timeSinceStart) => {
    if (!word) return 0;

    const RAMP_DURATION = 3000;
    let wpmMultiplier = 1;
    if (timeSinceStart < RAMP_DURATION) {
      const completion = timeSinceStart / RAMP_DURATION;
      wpmMultiplier = 0.6 + (0.4 * completion);
    }

    let effectiveWpm = currentWpm * wpmMultiplier;
    let baseDelay = (60 / effectiveWpm) * 1000;

    let multiplier = 1;
    const isPunctuation = /[.,!?]/.test(word.slice(-1));
    const hasSymbols = /[^a-zA-Z0-9.,!?']/.test(word);

    if (isPunctuation) multiplier *= 1.5;
    if (word.length > 9) multiplier *= 1.2;
    if (hasSymbols && !isPunctuation) multiplier *= 1.3;

    return baseDelay * multiplier;
  }, []);

  const animate = useCallback((time) => {
    if (!isPlayingRef.current) return;

    if (currentDelayRef.current === 0) {
      previousTimeRef.current = time;
      startTimeRef.current = time;
      // Delay = sum of delays for each word in the current chunk
      const cs = chunkSizeRef.current;
      let totalDelay = 0;
      for (let i = indexRef.current; i < Math.min(indexRef.current + cs, wordsRef.current.length); i++) {
        totalDelay += calculateDelay(wordsRef.current[i], wpmRef.current, 0);
      }
      currentDelayRef.current = totalDelay;
    }

    const deltaTime = time - previousTimeRef.current;

    if (deltaTime >= currentDelayRef.current) {
      const cs = chunkSizeRef.current;
      const nextIndex = indexRef.current + cs;
      if (nextIndex >= wordsRef.current.length) {
        setIsPlaying(false);
        currentDelayRef.current = 0;
        return;
      }

      setIndex(nextIndex);
      indexRef.current = nextIndex;
      previousTimeRef.current = time;

      const timeSinceStart = time - startTimeRef.current;
      let totalDelay = 0;
      for (let i = nextIndex; i < Math.min(nextIndex + cs, wordsRef.current.length); i++) {
        totalDelay += calculateDelay(wordsRef.current[i], wpmRef.current, timeSinceStart);
      }
      currentDelayRef.current = totalDelay;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [calculateDelay]);

  useEffect(() => {
    if (isPlaying) {
      currentDelayRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);

  const setIndexSafe = (newIndex) => {
    if (newIndex >= 0 && newIndex < words.length) setIndex(newIndex);
  };

  // Current chunk of words to display
  const chunk = words.slice(index, Math.min(index + chunkSize, words.length));

  return { words, chunk, index, isPlaying, setIsPlaying, wpm, setWpm, progress, setIndex: setIndexSafe };
}
