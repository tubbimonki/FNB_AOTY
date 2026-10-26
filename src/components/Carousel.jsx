import { useState, useEffect, useRef } from 'react';
import Photo from './Photo';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MAX_DOTS = 6; // more than this won't fit a phone, so switch to arrows

const showPhoto = (image) => <Photo image={image} className="h-56 w-full object-cover sm:h-80" />;

// Slides that glide sideways every few seconds. Dots jump, phones swipe, and it
// pauses on hover/focus or with the pause button (and starts paused for people
// who turn off animations). Pass `images` for photos, or `items` + `renderItem`
// for anything else.
const Carousel = ({
  images,
  items = images ?? [],
  renderItem = showPhoto,
  label = 'Photos',
  itemName = 'image',
  interval = 6000,
  controlsClassName = 'bg-forest-900 text-moss',
  className = 'overflow-hidden rounded-xl shadow-sm',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = items.length;
  const playing = !paused && !hovered && !focused;

  // Re-runs on every slide change, so clicking a dot restarts the timer.
  useEffect(() => {
    if (count < 2 || !playing) return;
    const timer = setTimeout(() => setCurrentIndex((i) => (i + 1) % count), interval);
    return () => clearTimeout(timer);
  }, [currentIndex, count, playing, interval]);

  // One step back (-1) or forward (+1), wrapping round; "+ count" keeps it positive.
  const go = (step) => setCurrentIndex((currentIndex + step + count) % count);

  // Swipe: compare where the finger went down with where it lifted.
  const touchStartX = useRef(null);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    // Under 50px counts as a tap or a wobble, not a swipe.
    if (Math.abs(deltaX) < 50) return;
    // Right = back, left = forward.
    go(deltaX > 0 ? -1 : 1);
  };

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      // Only "unfocus" when focus leaves the whole carousel, not moves inside it.
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
    >
      {/* touch-pan-y: the browser keeps vertical scrolling, we handle left/right. */}
      <div className="touch-pan-y overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* All slides sit in one row; moving the row by -100% per slide makes the glide. */}
        <div
          className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={item.id ?? index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              // Off-screen slides: hidden from screen readers and can't be tabbed into.
              aria-hidden={index !== currentIndex}
              inert={index !== currentIndex}
              className="w-full shrink-0"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className={`flex items-center justify-center ${controlsClassName}`}>
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            className="flex h-11 w-11 items-center justify-center text-xs"
          >
            {paused ? '▶' : '❚❚'}
          </button>
          {count <= MAX_DOTS ? (
            // The dot is small, but the button around it is 44x44 so a thumb can hit it.
            items.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show ${itemName} ${index + 1}`}
                aria-current={index === currentIndex}
                onClick={() => setCurrentIndex(index)}
                className="flex h-11 w-11 items-center justify-center"
              >
                <span className={`h-2.5 w-2.5 rounded-full transition-colors ${index === currentIndex ? 'bg-moss' : 'bg-forest-600'}`} />
              </button>
            ))
          ) : (
            // Too many for dots on a phone: arrows and a counter instead.
            <>
              <button type="button" onClick={() => go(-1)} aria-label={`Previous ${itemName}`} className="flex h-11 w-11 items-center justify-center text-xl">‹</button>
              <span className="min-w-12 text-center text-sm tabular-nums">{currentIndex + 1} / {count}</span>
              <button type="button" onClick={() => go(1)} aria-label={`Next ${itemName}`} className="flex h-11 w-11 items-center justify-center text-xl">›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Carousel;
