import { getLiveMessages } from "@/data/messages";
import { getLiveClasses } from "@/data/classes";

/** Returns true if there are unread messages */
export function hasUnreadMessages(): boolean {
  const messages = getLiveMessages();
  try {
    const raw = localStorage.getItem("read-message-ids");
    const readIds: Set<string> = raw ? new Set(JSON.parse(raw)) : new Set();
    return messages.some((m) => !readIds.has(m.id));
  } catch {
    return messages.length > 0;
  }
}

/** Returns true if there are cancelled classes the user hasn't seen */
export function hasUnseenCancellations(): boolean {
  const classes = getLiveClasses();
  const cancelledIds = classes.filter((c) => c.isCancelled).map((c) => c.id);
  if (cancelledIds.length === 0) return false;
  try {
    const raw = localStorage.getItem("seen-cancellation-ids");
    const seenIds: Set<string> = raw ? new Set(JSON.parse(raw)) : new Set();
    return cancelledIds.some((id) => !seenIds.has(id));
  } catch {
    return cancelledIds.length > 0;
  }
}

/** Mark all current cancellations as seen */
export function markCancellationsSeen(): void {
  const classes = getLiveClasses();
  const cancelledIds = classes.filter((c) => c.isCancelled).map((c) => c.id);
  localStorage.setItem("seen-cancellation-ids", JSON.stringify(cancelledIds));
}
