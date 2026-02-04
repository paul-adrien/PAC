'use client';

const MAX_STARS = 5;

export function StarRating({
  value = 0,
  onChange,
  'aria-label': ariaLabel,
}: {
  value?: number | null;
  onChange: (value: number) => void;
  'aria-label'?: string;
}) {
  const rating = value == null ? 0 : Math.min(Math.max(0, Math.round(value)), MAX_STARS);

  return (
    <div className="flex gap-0.5" role="group" aria-label={ariaLabel}>
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-0.5 rounded text-2xl leading-none transition-transform hover:scale-110 focus:outline-none cursor-pointer"
            aria-label={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
            aria-pressed={rating === starValue}
          >
            <span className={filled ? 'text-amber-500' : 'text-gray-300'}>
              {filled ? '★' : '☆'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
