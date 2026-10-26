// The reactions people can leave on a community event.
export const REACTIONS = [
  { id: 'smile', emoji: '😊', label: 'Smile' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'seedling', emoji: '🌱', label: 'Green' },
];

export const isReaction = (id) => REACTIONS.some((r) => r.id === id);
export const reactionEmoji = (id) => REACTIONS.find((r) => r.id === id)?.emoji ?? '';

// Made-up starting counts for the demo, the same for an event every time.
export function seedReactionCounts(eventId) {
  let hash = 0;
  for (const ch of eventId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return Object.fromEntries(REACTIONS.map((r, i) => [r.id, (hash >> (i * 4)) % 13]));
}
