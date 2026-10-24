import Photo from './Photo';

// Wide photo strip for the top of content pages.
const Banner = ({ image }) => (
  <Photo image={image} className="mb-8 h-48 w-full rounded-xl object-cover shadow-sm sm:h-64" />
);

export default Banner;
