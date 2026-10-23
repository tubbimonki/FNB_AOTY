import React, { useState, useEffect } from 'react';

const Carousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to update the current index and reset the interval
    const goToSlide = (index) => {
        setCurrentIndex(index);
        resetInterval();
    };

    // Reset the auto-sliding interval
    const resetInterval = () => {
        clearInterval(intervalRef.current);
        startInterval();
    };

    // Start the auto-sliding interval
    const startInterval = () => {
        intervalRef.current = setInterval(() => {
            goToNextSlide();
        }, 6000);
    };

    // Go to the next slide
    const goToNextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    useEffect(() => {
        startInterval();
        return () => clearInterval(intervalRef.current);
    }, []);

    // Store the interval reference to reset it later
    const intervalRef = React.useRef(null);

    return (
        <div className="carousel">
            <img src={images[currentIndex]} alt={`Nature Image ${currentIndex + 1}`} />
            <div className="carousel-indicators">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                    >
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Carousel;