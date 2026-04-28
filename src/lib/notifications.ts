// Notification, sound, and vibration utilities for rest timer alerts

// Audio context singleton (created lazily on user interaction)
let audioContext: AudioContext | null = null;

/**
 * Initialize audio context - call on user interaction (e.g., starting rest timer)
 */
export function initAudioContext(): void {
  if (audioContext) return;
  try {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  } catch {
    // Audio not supported
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Check if notifications are currently enabled
 */
export function areNotificationsEnabled(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Vibrate device (mobile only)
 */
export function vibrateDevice(): void {
  if ("vibrate" in navigator) {
    // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms, pause 100ms, vibrate 300ms
    navigator.vibrate([200, 100, 200, 100, 300]);
  }
}

/**
 * Play a two-tone alert sound
 */
export function playAlertSound(): void {
  if (!audioContext) {
    initAudioContext();
  }
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // First beep - A5 note
    oscillator.frequency.value = 880;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second beep - C#6 note (after a brief pause)
    const ctx = audioContext;
    setTimeout(() => {
      if (!ctx) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1108.73;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.4);
    }, 350);
  } catch {
    // Audio API may fail in some contexts
  }
}

/**
 * Send a rest timer completion notification with vibration and sound
 */
export function sendRestCompleteNotification(): void {
  // Vibrate on mobile devices
  vibrateDevice();

  // Play sound alert
  playAlertSound();

  // Send visual notification if permitted
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification("Rest Complete! 💪", {
        body: "Time to get back to your next set.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "rest-timer",
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 300],
        silent: false,
      } as NotificationOptions);

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      // Focus window when clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Notification API may fail in some contexts
    }
  }
}
