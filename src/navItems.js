import { Ellipsis, House, Leaf, Map as MapIcon, Users } from 'lucide-react';

// The five tabs from the mockup. `match` lists the paths that light a tab up,
// so e.g. Eco stays active on /tracker and /eco/water. `accent` is the tab's
// nature colour (see [data-accent] in index.css).
export const navItems = [
  { label: 'Home', link: '/dashboard', icon: House, match: ['/dashboard', '/alerts', '/services'], accent: 'sun' },
  { label: 'Map', link: '/map', icon: MapIcon, match: ['/map'], accent: 'lagoon' },
  { label: 'Eco', link: '/eco', icon: Leaf, match: ['/eco', '/tracker'], accent: 'leaf' },
  { label: 'Community', link: '/community', icon: Users, match: ['/community'], accent: 'heather' },
  { label: 'More', link: '/more', icon: Ellipsis, match: ['/more', '/impact', '/about', '/features', '/benefits'], accent: 'sky' },
];

// True when `pathname` is one of the item's paths or below it.
export const isActive = (item, pathname) =>
  item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));

// The tab that owns `pathname`, or undefined (splash, login).
export const activeTab = (pathname) => navItems.find((item) => isActive(item, pathname));
