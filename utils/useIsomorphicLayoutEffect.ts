import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect in the browser (runs after hydration, before paint), a no-op-safe useEffect on the server.
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
