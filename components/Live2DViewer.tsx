"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

let app: PIXI.Application;
let model: any;
// 为 pixi-live2d-display 提供全局 PIXI 引用
if (typeof window !== "undefined") {
  (window as any).PIXI = PIXI;
}

// 模型嘴巴参数映射
const MODEL_MOUTH_PARAM_MAP: Record<string, string> = {
  "米雪儿": "ParamMouthOpenY8",
  "小恶魔": "ParamMouthOpenY",
  // 可以添加更多模型的映射
  "default": "ParamMouthOpenY"
};

// 动态加载 Live2D Cubism Runtime，并手动挂载到 window
const loadCubismScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Live2DCubismCore) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/live2d/live2dcubismcore.min.js";
    script.async = true;
    script.onload = () => {
      // ✅ 强制挂载
      if ((window as any).Live2DCubismCore == null) {
        // 如果还是 undefined，尝试从全局模块中取出（某些版本未自动挂载）
        try {
          const globalVar = (globalThis as any).Live2DCubismCore;
          if (globalVar) {
            (window as any).Live2DCubismCore = globalVar;
          }
        } catch (e) {
          console.error("Cubism script loaded but Live2DCubismCore not found.");
          reject();
          return;
        }
      }
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

interface ModelProps {
  modelPath?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Live2DViewer({ modelPath = "/model/mixuer_vts/米雪儿.model3.json" }: ModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentExpression, setCurrentExpression] = useState<string>("");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [expressionList, setExpressionList] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // 聊天相关状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 切换模型
  const changeModel = async (path: string) => {
    if (!canvasRef.current || !app) return;
    
    // 清除旧模型
    if (model) {
      app.stage.removeChild(model);
      model.destroy();
    }

    try {
      // 加载新模型
      model = await Live2DModel.from(path, {
        autoInteract: false,
      });
      model.scale.set(0.25);
      model.x = 0
      model.y = -50;

      app.stage.addChild(model);
      
      // 提取表情和动作列表
      const expressions: string[] = [];
      const modalExpressions = model.internalModel.settings.expressions;
      if (modalExpressions && modalExpressions.length > 0) {
        modalExpressions.forEach((item: any) => {
          expressions.push(item.Name);
        });
      }
      
      // 获取模型名称
      const modelName = path.split("/").pop()?.replace(".model3.json", "") || "未知模型";
      
      setExpressionList(expressions);
      setCurrentExpression("");
      setIsModelLoaded(true);
      setCurrentModel(modelName);
    } catch (error) {
      console.error("加载模型失败:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;

      app = new PIXI.Application({
        view: canvasRef.current,
        resizeTo: canvasRef.current,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        antialias: true,
      });

      if (!(window as any).Live2DCubismCore) {
        console.error(
          "❌ Live2DCubismCore is still undefined after script load."
        );
        return;
      }

      // 初始加载模型
      await changeModel(modelPath);
    };

    loadCubismScript()
      .then(init)
      .catch((err) => {
        console.error("Failed to load Cubism core:", err);
      });

    return () => {
      app?.destroy(true, { children: true });
      model?.destroy();
    };
  }, [modelPath]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 切换表情/动作
  const changeExpression = (expressionName: string) => {
    if (!model || !isModelLoaded) return;
    
    try {
      model.expression(expressionName);
      setCurrentExpression(expressionName);
      console.log(`已切换到表情/动作: ${expressionName}`);
    } catch (error) {
      console.error(`切换表情/动作失败: ${expressionName}`, error);
    }
  };

  // 动动嘴巴 - 根据模型使用对应的参数
  const animateMouth = (duration = 3000) => {
    if (!model || !isModelLoaded) return;
    
    // 根据当前模型获取对应的嘴巴参数
    const mouthParam = MODEL_MOUTH_PARAM_MAP[currentModel] || MODEL_MOUTH_PARAM_MAP.default;
    setIsSpeaking(true);
    
    const timer = setInterval(() => {
      let n = Math.random() * 0.8; // 控制嘴巴开合幅度
      model.internalModel.coreModel.setParameterValueById(
        mouthParam,
        n
      );
    }, 100);
    
    setTimeout(() => {
      clearInterval(timer);
      // 关闭嘴巴
      model.internalModel.coreModel.setParameterValueById(mouthParam, 0);
      setIsSpeaking(false);
    }, duration);
  };

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
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    
    // 模拟AI回复
    setTimeout(() => {
      // 让模型说话
      animateMouth(2000);
      
      // 添加AI回复
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `你好！我是${currentModel}，很高兴和你聊天~`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
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

  // 切换模型按钮
  const modelOptions = [
    { name: "米雪儿", path: "/model/mixuer_vts/米雪儿.model3.json" },
    { name: "小恶魔", path: "/model/little-devil/小恶魔.model3.json" }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧模型展示区 */}
      <div className="w-1/2 h-full relative bg-gradient-to-b from-blue-50 to-purple-50">
        <canvas className="w-full h-full" ref={canvasRef}></canvas>
        
        {/* 模型选择器 - 放在左下角 */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          {modelOptions.map((option) => (
            <button
              key={option.path}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentModel === option.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/80 text-gray-700 hover:bg-white'}`}
              onClick={() => changeModel(option.path)}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 右侧控制面板和聊天区 */}
      <div className="w-1/2 h-full flex flex-col bg-white shadow-lg">
        {/* 表情/动作控制区 */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-3">表情/动作控制</h2>
          
          {/* 当前表情/动作显示 */}
          {currentExpression && (
            <div className="mb-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md inline-block">
              当前: {currentExpression}
            </div>
          )}
          
          {/* 表情/动作列表 */}
          {expressionList.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {expressionList.map((exp) => (
                <button
                  key={exp}
                  className={`p-2 rounded-md text-sm transition-all ${currentExpression === exp ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => changeExpression(exp)}
                >
                  {exp}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">该模型没有表情/动作</p>
          )}
        </div>
        
        {/* 聊天区域 */}
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
      </div>
    </div>
  );
}
