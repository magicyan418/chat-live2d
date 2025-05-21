"use client";

import { useRef, useEffect } from "react";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { useLive2DStore } from "@/store/live2dStore";

export default function ChatInterface() {
  const { messages, inputMessage, isRecording, setInputMessage, setIsRecording, addMessage } = useChatStore();
  const { currentModel } = useLive2DStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setInputMessage("");
    
    // 模拟AI回复
    setTimeout(() => {
      // 让模型说话
      if ((window as any).live2dModel) {
        (window as any).live2dModel.animateMouth(2000);
      }
      
      // 添加AI回复
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `你好！我是${currentModel}，很高兴和你聊天~`,
          isUser: false,
          timestamp: new Date()
        };
        
        addMessage(aiMessage);
      }, 1000);
    }, 1000);
  };

  // 模拟语音输入
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // 模拟3秒后获取语音结果
      setTimeout(() => {
        setInputMessage("这是通过语音识别转换的文字");
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400">开始和{currentModel}聊天吧！</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.isUser ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button 
            className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            onClick={toggleRecording}
            title={isRecording ? "停止录音" : "开始录音"}
          >
            {isRecording ? (
              <span className="flex items-center justify-center h-5 w-5">●</span>
            ) : (
              <span className="flex items-center justify-center h-5 w-5">🎤</span>
            )}
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入消息..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={isRecording}
          />
          
          <button 
            className="p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            onClick={sendMessage}
            disabled={!inputMessage.trim() && !isRecording}
          >
            <span className="flex items-center justify-center h-5 w-5">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}