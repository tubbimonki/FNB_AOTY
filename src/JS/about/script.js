// Carousel Functionality

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.getElementById('nature-carousel');
    if (carousel) {
        // Array of nature images (replace with actual image paths)
        const images = [
            'https://source.unsplash.com/random/600x400/?nature',
            'https://source.unsplash.com/random/600x400/?forest',
            'https://source.unsplash.com/random/600x400/?mountain',
            'https://source.unsplash.com/random/600x400/?ocean',
            'https://source.unsplash.com/random/600x400/?wildlife'
        ];

        let currentIndex = 0;

        // Function to load images into the carousel
        function loadImages() {
            if (carousel) {
                carousel.innerHTML = ''; // Clear previous content

                // Create a container for the image and indicators
                const imgContainer = document.createElement('div');
                imgContainer.className = 'carousel-inner';

                images.forEach((src, index) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = `Nature Image ${index + 1}`;
                    imgContainer.appendChild(img);
                });

                // Create indicators (dots)
                const indicatorsContainer = document.createElement('div');
                indicatorsContainer.className = 'carousel-indicators';

                images.forEach((_, index) => {
                    const indicator = document.createElement('div');
                    indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
                    indicator.dataset.index = index;
                    indicatorsContainer.appendChild(indicator);
                });

                carousel.appendChild(imgContainer);
                carousel.appendChild(indicatorsContainer);
            }
        }

        // Function to update the carousel image and active indicator
        function updateCarousel() {
            if (images.length === 0) return;

            currentIndex = (currentIndex + 1) % images.length;

            const img = carousel.querySelector('img');
            if (img) {
                img.src = images[currentIndex];
                img.alt = `Nature Image ${currentIndex + 1}`;
            }

            // Update active indicator
            const indicators = carousel.querySelectorAll('.carousel-indicator');
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }

        // Load images and set up interval for auto-sliding
        loadImages();
        const interval = setInterval(updateCarousel, 6000); // Change image every 6 seconds

        // Add event listeners to indicators for manual navigation
        carousel.addEventListener('click', function(e) {
            if (e.target.classList.contains('carousel-indicator')) {
                currentIndex = parseInt(e.target.dataset.index);
                updateCarousel();
                clearInterval(interval); // Reset the interval
                setInterval(updateCarousel, 6000);
            }
        });
    }
});