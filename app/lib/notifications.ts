/**
 * In-app notification utilities for SplitSahiSe
 * Uses Toast component for visual feedback
 */

// This will be set by the app when ToastProvider mounts
type ToastHandler = ((message: string, type?: "success" | "error" | "info" | "warning") => void) | null;
let globalShowToast: ToastHandler = null;

export function setToastHandler(handler: ToastHandler) {
  globalShowToast = handler;
}

export function getToastHandler(): ToastHandler {
  return globalShowToast;
}

// Show notification when expense is added
export function notifyExpenseAdded(creatorName: string, expenseTitle: string, amount: number, groupName?: string) {
  const message = groupName 
    ? `${creatorName} added "${expenseTitle}" (₹${amount.toFixed(0)}) to ${groupName}`
    : `${creatorName} added "${expenseTitle}" (₹${amount.toFixed(0)})`;
  
  if (globalShowToast) {
    globalShowToast(message, "success");
  } else {
    console.log("Notification:", message);
  }
}

// Show notification when settlement is recorded
export function notifySettlement(fromName: string, toName: string, amount: number) {
  const message = `${fromName} paid ${toName} ₹${amount.toFixed(0)}`;
  
  if (globalShowToast) {
    globalShowToast(message, "success");
  } else {
    console.log("Notification:", message);
  }
}

// Generic toast wrapper
export function showAppToast(message: string, type: "success" | "error" | "info" | "warning" = "info") {
  if (globalShowToast) {
    globalShowToast(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}
