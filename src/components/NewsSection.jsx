import { Link } from 'react-router-dom';
import { topNews } from '../features/news/newsItems';
import { useNews } from '../features/news/useNews';

// Landing-page teaser: the top headlines, linking into the members' news page.
const NewsSection = () => {
  const { items } = useNews();

  return (
    <div className="card mb-6">
      <h3 className="mb-2 text-xl">Latest Climate News</h3>
      <p className="mb-3">Climate stories that matter in South Africa, picked for what you can do about them.</p>
      <ul className="leaf-list">
        {topNews(items).map((story) => (
          <li key={story.id}>
            <Link to={`/dashboard/news#news-${story.id}`}>{story.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsSection;
