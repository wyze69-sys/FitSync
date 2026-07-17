import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Consistent inline error message with an optional retry action.
 */
export default function ErrorBanner({ message, onRetry, className = "" }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs rounded-sm font-medium flex items-center justify-between gap-3 ${className}`}
    >
      <span className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />
        <span>{message}</span>
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline underline-offset-2 cursor-pointer shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
