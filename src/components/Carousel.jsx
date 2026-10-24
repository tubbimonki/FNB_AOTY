import { useState, useEffect, useRef } from 'react';
import Photo from './Photo';

// Shows one image at a time and moves to the next every 6 seconds.
// Clicking a dot jumps to that image, and on phones you can swipe.
// `images` is a list of entries from src/assets/images.js ({ src, alt }).
const Carousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Re-runs whenever currentIndex changes, so clicking a dot restarts the timer.
  useEffect(() => {
    if (images.length < 2) return;
    const timer = setTimeout(() => {
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 6000);
    return () => clearTimeout(timer);
  }, [currentIndex, images.length]);

  // Swipe support for phones. A swipe is just two touch events:
  // onTouchStart says where the finger went down, onTouchEnd where it lifted.
  // The start X lives in a ref, not state: it changes without needing a re-render.
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
    // Finger moved right = go back; left = go forward. "+ images.length" keeps
    // the result positive so index 0 wraps round to the last image.
    const step = deltaX > 0 ? -1 : 1;
    setCurrentIndex((currentIndex + step + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    // touch-pan-y (CSS touch-action: pan-y) lets the browser keep handling
    // up/down scrolling while we handle left/right swipes ourselves.
    <div
      className="touch-pan-y overflow-hidden rounded-xl shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Photo
        key={currentIndex}
        image={images[currentIndex]}
        className="h-56 w-full object-cover sm:h-80"
      />
      {images.length > 1 && (
        <div className="flex justify-center bg-forest-900">
          {/* The dot is small, but the button around it is 44x44 so a thumb can hit it. */}
          {images.map((_, index) => (
            <button
              key={index}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${index === currentIndex ? 'bg-moss' : 'bg-forest-600'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
