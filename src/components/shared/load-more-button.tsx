"use client";

export interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

/** Inline "Load more" trigger. Renders nothing when `hasMore` is false. */
export function LoadMoreButton({ onLoadMore, isLoading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-4">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="rounded-lg px-6 py-2 text-[15px] font-medium leading-[20px] text-primary disabled:opacity-50"
      >
        {isLoading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
