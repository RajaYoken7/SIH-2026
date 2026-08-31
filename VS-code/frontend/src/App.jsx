import React, { useState, useCallback } from 'react';
import Header       from './components/Header.jsx';
import UploadPage   from './pages/UploadPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import { analyzeImage } from './services/api.js';

/**
 * App — top-level state machine
 *
 * States:
 *   upload    → UploadPage
 *   loading   → UploadPage (with spinner)
 *   result    → AnalysisPage
 *   error     → UploadPage (with error message)
 */
export default function App() {
  const [view, setView]       = useState('upload'); // 'upload' | 'loading' | 'result'
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  const handleAnalyze = useCallback(async (file) => {
    setError(null);
    setProgress(0);
    setView('loading');

    try {
      const data = await analyzeImage(file, (pct) => setProgress(pct));

      if (!data.success && data.errorCode) {
        setError(data.errorMessage || 'Analysis failed. Please try again.');
        setView('upload');
        return;
      }

      // Extract session ID from image URL for header display
      const match = (data.enhancedImageUrl || '').match(/\/outputs\/([^_]+)/);
      setSessionId(match?.[1] || null);
      setResult(data);
      setView('result');
    } catch (err) {
      setError(err.message || 'An error occurred. Please check the server and try again.');
      setView('upload');
    }
  }, []);

  const handleReset = useCallback(() => {
    setView('upload');
    setResult(null);
    setError(null);
    setProgress(0);
    setSessionId(null);
  }, []);

  const isLoading = view === 'loading';

  return (
    <>
      <Header sessionId={view === 'result' ? sessionId : null} />

      {view === 'result' && result ? (
        <AnalysisPage result={result} onReset={handleReset} />
      ) : (
        <UploadPage
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          progress={progress}
          error={error}
        />
      )}
    </>
  );
}
