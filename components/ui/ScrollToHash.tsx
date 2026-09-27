'use client';

import { useEffect } from 'react';

// Pages with a loading.tsx stream their content after the skeleton, so the browser's own jump to the
// URL's #anchor happens before the target exists. Rendered after the content, this makes the jump once
// it's there (e.g. /upcoming?weeks=8#week-5 from "Show more").
export default function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return null;
}
