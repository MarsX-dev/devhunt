'use client';

import { type ProductType } from '@/type';

// Tool cards on the page register here so the preview modal can step to the previous/next card in
// page order (the DOM order of [data-tool-card-id] elements).
const cards = new Map<number, { tool: ProductType; votesToday?: number }>();

export function registerToolCard(tool: ProductType, votesToday?: number) {
  cards.set(tool.id, { tool, votesToday });
  return () => {
    if (cards.get(tool.id)?.tool === tool) cards.delete(tool.id);
  };
}

export function neighborCard(currentId: number, direction: 1 | -1) {
  const ids = Array.from(document.querySelectorAll<HTMLElement>('[data-tool-card-id]'))
    .map(el => Number(el.dataset.toolCardId))
    .filter((id, idx, all) => cards.has(id) && all.indexOf(id) === idx);
  const idx = ids.indexOf(currentId);
  if (idx === -1) return null;
  const next = ids[idx + direction];
  return next === undefined ? null : cards.get(next) ?? null;
}
