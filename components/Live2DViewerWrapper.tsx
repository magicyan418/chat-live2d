'use client';

import dynamic from 'next/dynamic';

const Live2DViewer = dynamic(() => import('./Live2DViewer'), {
  ssr: false,
});

export default function Live2DViewerWrapper() {
  return <Live2DViewer />;
}
