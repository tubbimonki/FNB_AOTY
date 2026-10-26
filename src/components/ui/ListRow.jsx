import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import IconChip from './IconChip';

// One row in a white list card: icon, title, subtitle, and a chevron when it
// goes somewhere. `to` makes it a router link, `href` a normal link (tel:, https:).
const ListRow = ({ icon, tone, title, subtitle, to, href, trailing, className = '' }) => {
  const body = (
    <>
      {icon && <IconChip icon={icon} tone={tone} />}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-forest-950">{title}</span>
        {subtitle && <span className="block text-sm text-slate-500">{subtitle}</span>}
      </span>
      {trailing}
      {(to || href) && <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />}
    </>
  );
  const rowClass = `flex min-h-16 items-center gap-3 px-4 py-3 ${className}`;

  if (to) return <Link to={to} className={`${rowClass} no-underline hover:bg-forest-50 hover:no-underline`}>{body}</Link>;
  if (href) return <a href={href} className={`${rowClass} no-underline hover:bg-forest-50 hover:no-underline`}>{body}</a>;
  return <div className={rowClass}>{body}</div>;
};

// The card that holds the rows, with thin lines between them.
export const ListCard = ({ children, className = '', ...rest }) => (
  <ul className={`card divide-y divide-slate-100 overflow-hidden p-0 sm:p-0 ${className}`} {...rest}>
    {children}
  </ul>
);

export default ListRow;
