import { useCallback, useEffect, useRef, useState } from 'react';

/** Thin wrapper over the Web Speech API with a graceful unsupported state. */
export function useSpeech({ lang = 'en', onResult } = {}) {
  const Recognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = Boolean(Recognition);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Recognition) {
      setError('unsupported');
      return false;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    const recognition = new Recognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setError('');
      setTranscript('');
      setListening(true);
    };
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      setTranscript(text);
      if (text) onResultRef.current?.(text);
    };
    recognition.onerror = (event) => {
      setError(event.error || 'error');
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('error');
      setListening(false);
      return false;
    }
    return true;
  }, [Recognition, lang]);

  useEffect(() => () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
  }, []);

  return { supported, listening, transcript, error, start, stop };
}
