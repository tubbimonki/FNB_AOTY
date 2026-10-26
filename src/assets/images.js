// Every photo on the site. To swap one, change its `src` here: a URL, or an
// imported file from src/assets/images/. Photos are from Unsplash (free to use,
// https://unsplash.com/license). If a URL breaks, <Photo> shows a green box instead.

const unsplash = (id, width = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const images = {
  forest: {
    src: unsplash('photo-1448375240586-882707db888b'),
    alt: 'Tall trees in a dense green forest',
    credit: 'Unsplash',
  },
  forestLight: {
    src: unsplash('photo-1441974231531-c6227db76b6e'),
    alt: 'Sunlight shining through forest trees',
    credit: 'Unsplash',
  },
  mistyHills: {
    src: unsplash('photo-1470071459604-3b5ec3a7fe05'),
    alt: 'Mist over green hills and mountains',
    credit: 'Unsplash',
  },
  valley: {
    src: unsplash('photo-1501854140801-50d01698950b'),
    alt: 'Aerial view of a green mountain valley',
    credit: 'Unsplash',
  },
  woodland: {
    src: unsplash('photo-1473448912268-2022ce9509d8'),
    alt: 'Autumn woodland seen from above',
    credit: 'Unsplash',
  },
  field: {
    src: unsplash('photo-1500382017468-9049fed747ef'),
    alt: 'Sunlit grass field at golden hour',
    credit: 'Unsplash',
  },
};

// Where each photo is used.
export const pageImages = {
  homeHero: images.forest,
  aboutGallery: [images.forestLight, images.mistyHills, images.valley],
  featuresBanner: images.woodland,
  guidesBanner: images.mistyHills,
  benefitsBanner: images.field,
  newsBanner: images.valley,
  dashboardHero: images.forestLight,
  alertsHero: images.mistyHills,
  servicesHero: images.field,
  ecoHero: images.forestLight,
  waterHero: images.valley,
};
