import Photo from './Photo';

// Wide photo strip for the top of content pages.
const Banner = ({ image }) => (
  <Photo image={image} className="mb-6 h-40 w-full rounded-xl object-cover shadow-sm sm:mb-8 sm:h-64" />
);

export default Banner;
