import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import InterviewPage from './pages/InterviewPage';
import Monitor from './pages/Monitor';
import Report from './pages/Report';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300 dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900">
        <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <h1 className="text-xl font-bold tracking-tight">Cloud<span className="text-blue-600">Flair</span> Interview</h1>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/interview/:code" element={<InterviewPage />} />
            <Route path="/monitor/:code" element={<Monitor />} />
            <Route path="/report/:code" element={<Report />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
