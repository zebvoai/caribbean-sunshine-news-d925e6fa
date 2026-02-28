import { useState, useEffect, useCallback } from "react";
import logo from "@/assets/dominica_logo.png";

const SESSION_KEY = "dominica_splash_shown";

const SplashLoader = ({ onFinish }: { onFinish: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  const finish = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Skip if already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      finish();
      return;
    }

    const intervals = [
      setTimeout(() => setProgress(30), 150),
      setTimeout(() => setProgress(55), 400),
      setTimeout(() => setProgress(75), 700),
      setTimeout(() => setProgress(90), 1000),
      setTimeout(() => setProgress(100), 1300),
      setTimeout(() => setFading(true), 1500),
      setTimeout(() => finish(), 1900),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [finish]);

  // If already shown, render nothing
  if (sessionStorage.getItem(SESSION_KEY) && progress === 0) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logo}
        alt="Dominica News"
        className="h-14 sm:h-16 mb-8 animate-scale-in"
      />
      <div className="w-48 sm:w-64 h-1.5 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground font-body animate-fade-in">
        Loading your experience...
      </p>
    </div>
  );
};

export default SplashLoader;
