import { useState, useEffect } from 'react';
import Photo from './Photo';

// Shows one image at a time and moves to the next every 6 seconds.
// Clicking a dot jumps to that image. `images` is a list of entries from
// src/assets/images.js ({ src, alt }).
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

  if (images.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <Photo
        key={currentIndex}
        image={images[currentIndex]}
        className="h-64 w-full object-cover sm:h-80"
      />
      {images.length > 1 && (
        <div className="flex justify-center gap-2 bg-forest-900 py-2">
          {images.map((_, index) => (
            <button
              key={index}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 w-2.5 rounded-full ${index === currentIndex ? 'bg-moss' : 'bg-forest-600'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
