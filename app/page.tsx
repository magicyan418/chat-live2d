import Live2DViewerWrapper from '@/components/Live2DViewerWrapper';
import ModelSelector from '@/components/ModelSelector';
import ExpressionController from '@/components/ExpressionController';
import ChatInterface from '@/components/ChatInterface';

export default function Page() {
  return (
    <main className="flex h-screen bg-gray-50">
      {/* 左侧模型展示区 */}
      <div className="w-1/2 h-full relative bg-gradient-to-b from-blue-50 to-purple-50">
        <Live2DViewerWrapper />
        <ModelSelector />
      </div>
      
      {/* 右侧控制面板和聊天区 */}
      <div className="w-1/2 h-full flex flex-col bg-white shadow-lg">
        <ExpressionController />
        <ChatInterface />
      </div>
    </main>
  );
}
