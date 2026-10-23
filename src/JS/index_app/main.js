const images = [
    'https://source.unsplash.com/random/600x400/?nature',
    'https://source.unsplash.com/random/600x400/?forest',
    'https://source.unsplash.com/random/600x400/?mountain',
    'https://source.unsplash.com/random/600x400/?ocean',
    'https://source.unsplash.com/random/600x400/?wildlife'
];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* <Carousel images={images} /> */}
        <div style={{padding: '20px', border: '1px solid #ccc'}}>Home Component Placeholder</div>
    </React.StrictMode>
);

const newsRoot = ReactDOM.createRoot(document.getElementById('news-section'));
newsRoot.render(
    <React.StrictMode>
        {/* <NewsSection /> */}
        <div style={{padding: '20px', border: '1px solid #ccc'}}>News Section Placeholder</div>
    </React.StrictMode>
);

const guidesRoot = ReactDOM.createRoot(document.getElementById('guides-section'));
guidesRoot.render(
    <React.StrictMode>
        {/* <GuidesSection /> */}
        <div style={{padding: '20px', border: '1px solid #ccc'}}>Guides Section Placeholder</div>
    </React.StrictMode>
);
