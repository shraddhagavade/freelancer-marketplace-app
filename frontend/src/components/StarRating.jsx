import { useState } from 'react';
import { HiStar, HiOutlineStar } from 'react-icons/hi';

/**
 * Star rating component.
 * - Display mode (default): shows `value` out of 5, read-only.
 * - Interactive mode: pass `onChange` to let the user pick a rating.
 */
export default function StarRating({ value = 0, onChange, size = 20, showValue = false }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const active = hover || value;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= active;
          const StarIcon = filled ? HiStar : HiOutlineStar;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange(star)}
              onMouseEnter={() => interactive && setHover(star)}
              onMouseLeave={() => interactive && setHover(0)}
              className={interactive ? 'cursor-pointer' : 'cursor-default'}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <StarIcon
                className={filled ? 'text-amber-400' : 'text-grey-3'}
                style={{ width: size, height: size }}
              />
            </button>
          );
        })}
      </span>
      {showValue && value > 0 && (
        <span className="text-sm font-semibold text-brand-ink ml-1">{Number(value).toFixed(1)}</span>
      )}
    </span>
  );
}
