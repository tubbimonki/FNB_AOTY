import { useState } from 'react';

// An <img> that swaps to a green box instead of the broken-image icon.
// `image` is an entry from src/assets/images.js. `background` marks a decorative
// photo behind text: alt="" / aria-hidden, and no alt text in the fallback.
const Photo = ({ image, className = '', background = false, ...rest }) => {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    const a11y = background
      ? { 'aria-hidden': true }
      : { role: 'img', 'aria-label': image?.alt ?? 'Image unavailable' };
    return (
      <div
        {...a11y}
        className={`flex items-center justify-center bg-linear-to-br from-forest-800 to-forest-500 p-4 text-center text-sm text-forest-100 ${className}`}
        {...rest}
      >
        {!background && image?.alt}
      </div>
    );
  }

  return (
    <img
      src={image.src}
      alt={background ? '' : image.alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};

export default Photo;
