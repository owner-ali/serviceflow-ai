'use client';

export function LoadingRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-graphite/10 dark:bg-white/5" />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-xl p-10 text-center dark:text-offwhite">
      <p className="text-sm text-graphite/60 dark:text-offwhite/60">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass rounded-xl p-6 text-center dark:text-offwhite">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
          Retry
        </button>
      )}
    </div>
  );
}
