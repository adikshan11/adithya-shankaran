import type { ReactNode } from 'react';

export default function Rich({ text, slots = {} }: { text: string; slots?: Record<string, ReactNode> }) {
  return text.split(/(\*\*[^*]+\*\*|\[[a-z]+\])/).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    const slot = part.match(/^\[([a-z]+)\]$/)?.[1];
    if (slot && slots[slot]) return <span key={index}>{slots[slot]}</span>;
    return part;
  });
}
