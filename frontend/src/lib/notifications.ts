/**
 * Web Notifications API & Title Flashing Engine
 * Strictly follows docs/11-notification-system.md
 */

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return "denied";
    }
  }

  return Notification.permission;
}

export function dispatchSessionCompletionNotification(taskTitle: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification("LearnTrack — Focus Complete!", {
        body: `45-minute focus block on "${taskTitle}" finished. Take a breath and log your learnings.`,
        tag: "learntrack-session-complete",
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn("Could not dispatch desktop notification:", err);
    }
  }
}

export function startTitleFlashing(originalTitle: string): () => void {
  if (typeof window === "undefined") return () => {};

  let isAlert = false;
  const interval = setInterval(() => {
    document.title = isAlert ? "🔔 Focus Complete!" : originalTitle;
    isAlert = !isAlert;
  }, 1000);

  const stopFlashing = () => {
    clearInterval(interval);
    document.title = originalTitle;
    window.removeEventListener("focus", stopFlashing);
  };

  window.addEventListener("focus", stopFlashing);
  return stopFlashing;
}
