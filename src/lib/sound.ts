/**
 * HTML5 Audio API & Web Audio Chime Sound Engine
 * Strictly follows docs/11-notification-system.md
 * Handles autoplay restrictions and graceful degradation.
 */

export type SoundChoice = "bell" | "bowl" | "gong";

class SoundManager {
  private audio: HTMLAudioElement | null = null;
  private currentChoice: SoundChoice = "bell";

  /**
   * Pre-unlocks audio buffers upon user gesture (e.g., clicking "Start Focus").
   */
  public initialize(choice: SoundChoice = "bell", volume = 0.8): void {
    if (typeof window === "undefined") return;

    try {
      this.currentChoice = choice;
      const soundPath = `/sounds/chime-${choice}.wav`;
      this.audio = new Audio(soundPath);
      this.audio.volume = Math.max(0, Math.min(1, volume));
      this.audio.load();
    } catch {
      // Audio initialization silently degrades if unsupported
    }
  }

  /**
   * Plays completion chime. Degrades gracefully if blocked by browser policy.
   */
  public play(options?: {
    enabled?: boolean;
    choice?: SoundChoice;
    volume?: number;
  }): void {
    if (typeof window === "undefined") return;

    const enabled = options?.enabled ?? true;
    if (!enabled) return;

    const choice = options?.choice ?? this.currentChoice;
    const volume = Math.max(0, Math.min(1, options?.volume ?? 0.8));

    try {
      const soundPath = `/sounds/chime-${choice}.wav`;
      const audio = new Audio(soundPath);
      audio.volume = volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("HTML5 Audio playback blocked or failed; falling back to Web Audio synthesis:", err);
          this.playSyntheticChime(choice, volume);
        });
      }
    } catch {
      this.playSyntheticChime(choice, volume);
    }
  }

  /**
   * Web Audio API synthesized backup chime in case audio files are unavailable or blocked.
   */
  private playSyntheticChime(choice: SoundChoice, volume: number): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (choice === "gong" ? 3.0 : 2.0));
      gainNode.connect(ctx.destination);

      const freqs = choice === "bowl" ? [349.23, 523.25] : choice === "gong" ? [130.81, 196] : [880, 1320];

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch {
      // Degrades silently
    }
  }
}

export const soundManager = new SoundManager();
