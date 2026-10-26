import { Ellipsis, House, Leaf, Map as MapIcon, Users } from 'lucide-react';

// The five tabs from the mockup. `match` lists the paths that light a tab up,
// so e.g. Eco stays active on /tracker and /eco/water.
export const navItems = [
  { label: 'Home', link: '/dashboard', icon: House, match: ['/dashboard', '/alerts', '/services'] },
  { label: 'Map', link: '/map', icon: MapIcon, match: ['/map'] },
  { label: 'Eco', link: '/eco', icon: Leaf, match: ['/eco', '/tracker'] },
  { label: 'Community', link: '/community', icon: Users, match: ['/community'] },
  { label: 'More', link: '/more', icon: Ellipsis, match: ['/more', '/impact', '/about', '/features', '/benefits'] },
];

// True when `pathname` is one of the item's paths or below it.
export const isActive = (item, pathname) =>
  item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
