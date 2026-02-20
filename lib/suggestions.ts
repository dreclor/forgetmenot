import type { RelationshipHint } from '@/types/database';

const SUGGESTIONS: { text: string; hint?: RelationshipHint }[] = [
  { text: 'Send some recent photos' },
  { text: "Send a “what's up, how is life?” message" },
  { text: 'Schedule a short call' },
  { text: 'Send a voice note' },
  { text: 'Share something that made you think of them' },
  { text: 'Send a funny meme or link' },
  { text: 'Ask how their week went' },
  { text: 'Plan a coffee or lunch catch-up' },
  { text: 'Send a photo from a memory you shared' },
];

export function pickSuggestions(relationshipHint?: RelationshipHint | null, count = 3): string[] {
  const pool = relationshipHint
    ? [...SUGGESTIONS.filter((s) => !s.hint || s.hint === relationshipHint), ...SUGGESTIONS]
    : SUGGESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of shuffled) {
    if (out.length >= count) break;
    const t = typeof s === 'string' ? s : s.text;
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
