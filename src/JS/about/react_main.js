const images = [
    'https://source.unsplash.com/random/600x400/?nature',
    'https://source.unsplash.com/random/600x400/?forest',
    'https://source.unsplash.com/random/600x400/?mountain',
    'https://source.unsplash.com/random/600x400/?ocean',
    'https://source.unsplash.com/random/600x400/?wildlife'
];

// Render the Carousel component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Carousel images={images} />
    </React.StrictMode>
);

// Render the NewsSection component
const newsRoot = ReactDOM.createRoot(document.getElementById('news-section'));
newsRoot.render(
    <React.StrictMode>
        <NewsSection />
    </React.StrictMode>
);

// Render the GuidesSection component
const guidesRoot = ReactDOM.createRoot(document.getElementById('guides-section'));
guidesRoot.render(
    <React.StrictMode>
        <GuidesSection />
    </React.StrictMode>
);
