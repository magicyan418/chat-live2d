'use client';

import dynamic from 'next/dynamic';

// 使用动态导入避免SSR渲染Live2D组件
const Live2DViewer = dynamic(() => import('./Live2DViewer'), {
  ssr: false,
});

export default function Live2DViewerWrapper() {
  return <Live2DViewer />;
}
