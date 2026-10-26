// "120" -> "2 hours ago"
export const ago = (minutes) => {
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago` : `${Math.round(hours / 24)} days ago`;
};
