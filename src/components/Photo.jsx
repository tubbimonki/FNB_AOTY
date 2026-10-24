import { useState } from 'react';

// An <img> that never shows the browser's broken-image icon.
// Pass an entry from src/assets/images.js:  <Photo image={pageImages.homeHero} />
// Any extra props (className, etc.) go to the <img> or the fallback box.
// `background` hides the alt text in the fallback, for photos that sit behind text.
const Photo = ({ image, className = '', background = false, ...rest }) => {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div
        role="img"
        aria-label={image?.alt ?? 'Image unavailable'}
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
      alt={image.alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};

export default Photo;
