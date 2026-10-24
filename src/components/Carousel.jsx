import React, { useState, useEffect } from 'react';

// Shows one image at a time and moves to the next every 6 seconds.
// Clicking a dot jumps to that image.
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
        <div className="carousel">
            <img src={images[currentIndex]} alt={`Nature Image ${currentIndex + 1}`} />
            <div className="carousel-indicators">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    >
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Carousel;
