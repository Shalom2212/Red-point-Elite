import { useState, useEffect, useRef, useCallback } from 'react';

export function useReader(initialText = '', initialWpm = 300) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(initialWpm);
  const [progress, setProgress] = useState(0);

  // Refs for animation loop
  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const wordsRef = useRef([]);
  const wpmRef = useRef(initialWpm);
  
  const requestRef = useRef(null);
  const previousTimeRef = useRef(0);
  const startTimeRef = useRef(0); // Tracks when play started for the Ramp
  const currentDelayRef = useRef(0);

  // Sync state to refs for the animation loop
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);

  // Parse text into words array
  useEffect(() => {
    if (initialText) {
      const parsedWords = initialText.trim().split(/\s+/).filter(w => w.length > 0);
      setWords(parsedWords);
      setIndex(0);
    }
  }, [initialText]);

  // Update progress
  useEffect(() => {
    if (words.length > 0) {
      setProgress((index / (words.length || 1)) * 100);
    } else {
      setProgress(0);
    }
  }, [index, words.length]);

  const calculateDelay = useCallback((word, currentWpm, timeSinceStart) => {
    if (!word) return 0;
    
    // 1. Ramp Calculation (3 seconds: 60% -> 100%)
    const RAMP_DURATION = 3000;
    let wpmMultiplier = 1;
    if (timeSinceStart < RAMP_DURATION) {
      const completion = timeSinceStart / RAMP_DURATION;
      wpmMultiplier = 0.6 + (0.4 * completion);
    }
    
    let effectiveWpm = currentWpm * wpmMultiplier;
    let baseDelay = (60 / effectiveWpm) * 1000;

    // 2. Word Modifiers
    let multiplier = 1;
    const isPunctuation = /[.,!?]/.test(word.slice(-1));
    const hasSymbols = /[^a-zA-Z0-9.,!?']/.test(word);

    if (isPunctuation) {
      multiplier *= 1.5;
    }
    if (word.length > 9) {
      multiplier *= 1.2;
    }
    if (hasSymbols && !isPunctuation) {
      multiplier *= 1.3;
    }

    return baseDelay * multiplier;
  }, []);

  const animate = useCallback((time) => {
    if (!isPlayingRef.current) return;

    if (currentDelayRef.current === 0) {
        // Init state for the very first frame of play
        previousTimeRef.current = time;
        startTimeRef.current = time;
        currentDelayRef.current = calculateDelay(wordsRef.current[indexRef.current], wpmRef.current, 0);
    }

    const deltaTime = time - previousTimeRef.current;
    
    if (deltaTime >= currentDelayRef.current) {
        // Move to next word
        const nextIndex = indexRef.current + 1;
        if (nextIndex >= wordsRef.current.length) {
            setIsPlaying(false);
            currentDelayRef.current = 0;
            return;
        }

        setIndex(nextIndex);
        indexRef.current = nextIndex;
        
        previousTimeRef.current = time; // Reset timer for the next word
        const timeSinceStart = time - startTimeRef.current;
        currentDelayRef.current = calculateDelay(wordsRef.current[nextIndex], wpmRef.current, timeSinceStart);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [calculateDelay]);

  useEffect(() => {
    if (isPlaying) {
      currentDelayRef.current = 0; // Reset delay so it initiates properly
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);

  // Expose jump control
  const setIndexSafe = (newIndex) => {
      if (newIndex >= 0 && newIndex < words.length) setIndex(newIndex);
  };

  return { words, index, isPlaying, setIsPlaying, wpm, setWpm, progress, setIndex: setIndexSafe };
}
