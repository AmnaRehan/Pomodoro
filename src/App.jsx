import { useState, useEffect, useRef } from 'react';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);
  
  const [workTime, setWorkTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  
  const [selectedSound, setSelectedSound] = useState('music');
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  
  const quotes = [
    "Take a deep breath and relax your mind.",
    "You're doing great! Keep up the good work.",
    "Rest is not idleness, it is essential for growth.",
    "Every break is a chance to reset and refocus.",
    "Your mind is like a muscle - it needs rest to grow stronger.",
    "Progress, not perfection.",
    "You've earned this break. Enjoy it.",
    "Breathe in calm, breathe out stress."
  ];
  
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  
  const ambientSounds = {
    music: { name: 'Music', url: '/sounds/calm.mp3' },
    silence: { name: 'Silence', url: null }
  };
  
  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        setCompletedSessions(prev => prev + 1);
        setTotalFocusTime(prev => prev + workTime);
        
        setIsBreak(true);
        const breakTime = session % 4 === 0 ? longBreak : shortBreak;
        setTimeLeft(breakTime * 60);
        setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        
        if (Notification.permission === 'granted') {
          new Notification('Work session completed!', {
            body: 'Time for a break',
            icon: '/favicon.ico'
          });
        }
      } else {
        setIsBreak(false);
        setTimeLeft(workTime * 60);
        setSession(prev => prev + 1);
        
        if (Notification.permission === 'granted') {
          new Notification('Break finished!', {
            body: 'Time to focus',
            icon: '/favicon.ico'
          });
        }
      }
      setIsActive(false);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, session, workTime, shortBreak, longBreak, quotes]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = true;
      
      if (isActive && selectedSound !== 'silence') {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isActive, volume, isMuted, selectedSound]);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(workTime * 60);
    setSession(1);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const updateSettings = (newWorkTime, newShortBreak, newLongBreak) => {
    setWorkTime(newWorkTime);
    setShortBreak(newShortBreak);
    setLongBreak(newLongBreak);
    
    // Update current timer if not active
    if (!isActive) {
      if (isBreak) {
        const breakTime = session % 4 === 0 ? newLongBreak : newShortBreak;
        setTimeLeft(breakTime * 60);
      } else {
        setTimeLeft(newWorkTime * 60);
      }
    }
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    const totalTime = isBreak 
      ? (session % 4 === 0 ? longBreak : shortBreak) * 60 
      : workTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      
      {selectedSound !== 'silence' && (
        <audio ref={audioRef} preload="auto">
          <source src={ambientSounds[selectedSound].url} type="audio/mpeg" />
        </audio>
      )}
      
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Focus Timer</h1>
          <p className="text-white/70">
            {isBreak ? '🌸 Break Time' : '🎯 Focus Time'} - Session {session}
          </p>
        </div>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-white mb-4">
            {formatTime(timeLeft)}
          </div>
        
          <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${getProgressPercentage()}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
              }}
            />
          </div>
        </div>
        
        {isBreak && (
          <div className="text-center mb-6 p-4 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-white/90 italic text-sm">"{currentQuote}"</p>
          </div>
        )}
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-200 border border-white/30"
            title={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={resetTimer}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-200 border border-white/30"
            title="Reset"
          >
            🔄
          </button>
          
          <button
            onClick={toggleMute}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-200 border border-white/30"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-all duration-200 border border-white/30"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">🎵 Ambient Sound</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ambientSounds).map(([key, sound]) => (
              <button
                key={key}
                onClick={() => setSelectedSound(key)}
                className={`p-3 rounded-xl transition-all duration-200 text-sm ${
                  selectedSound === key 
                    ? 'bg-white/30 border-2 border-white/50 text-white' 
                    : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white/80'
                }`}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>
        
        {selectedSound !== 'silence' && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">🔊 Volume</h3>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
            <div className="text-center text-white/70 text-sm mt-1">
              {Math.round(volume * 100)}%
            </div>
          </div>
        )}
        
        {showSettings && (
          <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">⚙️ Timer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">Work Time (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workTime}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    updateSettings(newValue, shortBreak, longBreak);
                  }}
                  className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Short Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreak}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    updateSettings(workTime, newValue, longBreak);
                  }}
                  className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Long Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreak}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    updateSettings(workTime, shortBreak, newValue);
                  }}
                  className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 placeholder-white/50"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
          <h3 className="text-white font-semibold mb-3">📊 Today's Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{completedSessions}</div>
              <div className="text-white/70 text-sm">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalFocusTime}</div>
              <div className="text-white/70 text-sm">Minutes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;