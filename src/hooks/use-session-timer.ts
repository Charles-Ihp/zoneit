import { useState, useRef, useEffect, useCallback } from "react";
import { initAudioContext, sendRestCompleteNotification } from "@/lib/notifications";

interface UseRestTimerOptions {
  defaultSeconds: number;
}

interface UseRestTimerReturn {
  isResting: boolean;
  restRemaining: number;
  startRestTimer: () => void;
  skipRest: () => void;
  addRestTime: (seconds: number) => void;
  setRestTimeSeconds: (seconds: number) => void;
  restTimeSeconds: number;
}

export function useRestTimer({ defaultSeconds }: UseRestTimerOptions): UseRestTimerReturn {
  const [restTimeSeconds, setRestTimeSeconds] = useState(defaultSeconds);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restStartWall = useRef<number | null>(null);
  const restBaseRemaining = useRef<number>(0);

  // Rest timer countdown using wall-clock time
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      if (restStartWall.current === null) {
        restStartWall.current = Date.now();
        restBaseRemaining.current = restRemaining;
      }
      restIntervalRef.current = setInterval(() => {
        const wall = Date.now();
        const elapsed = (wall - (restStartWall.current ?? wall)) / 1000;
        const remaining = Math.max(0, Math.ceil(restBaseRemaining.current - elapsed));
        if (remaining <= 0) {
          setIsResting(false);
          setRestRemaining(0);
          restStartWall.current = null;
          sendRestCompleteNotification();
        } else {
          setRestRemaining(remaining);
        }
      }, 500);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      restStartWall.current = null;
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isResting]);

  const startRestTimer = useCallback(() => {
    initAudioContext();
    restStartWall.current = null;
    restBaseRemaining.current = restTimeSeconds;
    setRestRemaining(restTimeSeconds);
    setIsResting(true);
  }, [restTimeSeconds]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestRemaining(0);
  }, []);

  const addRestTime = useCallback((seconds: number) => {
    restBaseRemaining.current = Math.max(0, restBaseRemaining.current + seconds);
    setRestRemaining((prev) => Math.max(0, prev + seconds));
  }, []);

  return {
    isResting,
    restRemaining,
    startRestTimer,
    skipRest,
    addRestTime,
    setRestTimeSeconds,
    restTimeSeconds,
  };
}

interface UseSessionTimerOptions {
  initialElapsed?: number;
  initialRunning?: boolean;
}

interface UseSessionTimerReturn {
  sessionElapsed: number;
  running: boolean;
  setRunning: (running: boolean | ((prev: boolean) => boolean)) => void;
  startExerciseTimer: () => void;
  getExerciseElapsed: () => number;
  sessionStartWall: React.MutableRefObject<number | null>;
  sessionBaseElapsed: React.MutableRefObject<number>;
  exerciseBaseElapsed: React.MutableRefObject<number>;
}

export function useSessionTimer({
  initialElapsed = 0,
  initialRunning = false,
}: UseSessionTimerOptions = {}): UseSessionTimerReturn {
  const [sessionElapsed, setSessionElapsed] = useState(initialElapsed);
  const [running, setRunning] = useState(initialRunning);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartWall = useRef<number | null>(null);
  const sessionBaseElapsed = useRef<number>(initialElapsed);
  const exerciseStartWall = useRef<number | null>(null);
  const exerciseBaseElapsed = useRef<number>(0);
  const exerciseElapsedState = useRef<number>(0);

  useEffect(() => {
    if (running) {
      const now = Date.now();
      sessionStartWall.current = now;
      exerciseStartWall.current = now;
      intervalRef.current = setInterval(() => {
        const wall = Date.now();
        const sessionSec = Math.floor(
          sessionBaseElapsed.current + (wall - (sessionStartWall.current ?? wall)) / 1000,
        );
        const exSec = Math.floor(
          exerciseBaseElapsed.current + (wall - (exerciseStartWall.current ?? wall)) / 1000,
        );
        setSessionElapsed(sessionSec);
        exerciseElapsedState.current = exSec;
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (sessionStartWall.current !== null) {
        sessionBaseElapsed.current += (Date.now() - sessionStartWall.current) / 1000;
        sessionStartWall.current = null;
      }
      if (exerciseStartWall.current !== null) {
        exerciseBaseElapsed.current += (Date.now() - exerciseStartWall.current) / 1000;
        exerciseStartWall.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startExerciseTimer = useCallback(() => {
    exerciseBaseElapsed.current = 0;
    exerciseStartWall.current = Date.now();
  }, []);

  const getExerciseElapsed = useCallback(() => {
    return exerciseElapsedState.current;
  }, []);

  return {
    sessionElapsed,
    running,
    setRunning,
    startExerciseTimer,
    getExerciseElapsed,
    sessionStartWall,
    sessionBaseElapsed,
    exerciseBaseElapsed,
  };
}
