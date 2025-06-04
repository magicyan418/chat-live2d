"use client";

import { useRef, useEffect, useState } from "react";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { useLive2DStore } from "@/store/live2dStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Eye, EyeOff } from "lucide-react";

// 添加 SpeechRecognition 类型
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult[];
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// 声明全局 webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

// 密码输入框组件
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
        <span className="sr-only">
          {showPassword ? "隐藏密钥" : "显示密钥"}
        </span>
      </Button>
    </div>
  );
}

// API密钥管理弹窗组件
function ApiKeyDialog({ 
  open, 
  onOpenChange, 
  aiApiKey, 
  setAiApiKey, 
  ttsApiKey, 
  setTtsApiKey,
  onSave
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  aiApiKey: string; 
  setAiApiKey: (key: string) => void; 
  ttsApiKey: string; 
  setTtsApiKey: (key: string) => void;
  onSave: () => void;
}) {
  const [tempAiKey, setTempAiKey] = useState(aiApiKey);
  const [tempTtsKey, setTempTtsKey] = useState(ttsApiKey);
  
  // 当弹窗打开时，初始化临时状态
  useEffect(() => {
    if (open) {
      setTempAiKey(aiApiKey);
      setTempTtsKey(ttsApiKey);
    }
  }, [open, aiApiKey, ttsApiKey]);

  const handleSave = () => {
    if (!tempAiKey.trim()) {
      alert("请提供硅基流动API密钥，AI聊天功能必须使用此密钥");
      return;
    }
    
    setAiApiKey(tempAiKey);
    setTtsApiKey(tempTtsKey);
    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // 如果已经设置了AI API密钥，允许关闭弹窗
      if (!isOpen && !aiApiKey.trim()) {
        alert("请设置硅基流动API密钥以继续使用");
        return;
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API密钥设置</DialogTitle>
          <DialogDescription>
            设置AI聊天和文本转语音所需的API密钥。硅基流动API密钥是必需的。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-api-key" className="col-span-4">
              硅基流动API密钥 (AI聊天) <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-4">
              <PasswordInput
                id="ai-api-key"
                value={tempAiKey}
                onChange={(e) => setTempAiKey(e.target.value)}
                placeholder="请输入硅基流动API密钥"
              />
            </div>
            <p className="text-xs text-muted-foreground col-span-4">AI聊天功能必须提供此密钥</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tts-api-key" className="col-span-4">
              微软Azure API密钥 (文本转语音)
            </Label>
            <div className="col-span-4">
              <PasswordInput
                id="tts-api-key"
                value={tempTtsKey}
                onChange={(e) => setTempTtsKey(e.target.value)}
                placeholder="可选，用于文本转语音功能"
              />
            </div>
            <p className="text-xs text-muted-foreground col-span-4">此密钥为可选，不提供将无法使用语音功能</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="outline" onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ChatInterface() {
  const { messages, inputMessage, isRecording, setInputMessage, setIsRecording, addMessage } = useChatStore();
  const { currentModel, expressionList } = useLive2DStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [audioPlayer] = useState<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio() : null
  );
  
  // API密钥状态
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [ttsApiKey, setTtsApiKey] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  // 从localStorage加载API密钥
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAiKey = localStorage.getItem('aiApiKey');
      const savedTtsKey = localStorage.getItem('ttsApiKey');
      
      if (savedAiKey) {
        setAiApiKey(savedAiKey);
        setIsApiKeySet(true);
      } else {
        // 如果没有保存AI API密钥，打开设置弹窗
        setIsApiKeyDialogOpen(true);
      }
      
      if (savedTtsKey) {
        setTtsApiKey(savedTtsKey);
      }
    }
  }, []);

  // 保存API密钥
  const saveApiKeys = () => {
    localStorage.setItem('aiApiKey', aiApiKey);
    if (ttsApiKey) {
      localStorage.setItem('ttsApiKey', ttsApiKey);
    }
    setIsApiKeySet(true);
    
    // 如果有TTS密钥，获取令牌
    if (ttsApiKey) {
      getMicrosoftSpeechToken();
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 获取微软语音服务访问令牌
  const getMicrosoftSpeechToken = async () => {
    try {
      const subscriptionKey = ttsApiKey;
      
      if (!subscriptionKey) {
        console.error("请提供微软语音服务密钥");
        return null;
      }
      
      const response = await fetch("https://eastasia.api.cognitive.microsoft.com/sts/v1.0/issueToken", {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Length": "0"
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取令牌失败: ${response.status} ${response.statusText}`);
      }
      
      const token = await response.text();
      setAccessToken(token);
      return token;
    } catch (error) {
      console.error("获取微软语音服务令牌失败:", error);
      return null;
    }
  };

  // 当TTS密钥更改时，尝试获取令牌
  useEffect(() => {
    if (ttsApiKey) {
      getMicrosoftSpeechToken();
    }
  }, [ttsApiKey]);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i][0]) {
            transcript += event.results[i][0].transcript;
          }
        }
        
        setInputMessage(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error);
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  // 语音转文字
  const toggleRecording = () => {
    if (!speechRecognitionRef.current) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    if (!isRecording) {
      speechRecognitionRef.current.start();
      setIsRecording(true);
    } else {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // 文字转语音 (使用微软语音服务)
  const speakText = async (text: string) => {
    // 如果没有TTS密钥，则不进行语音合成
    if (!ttsApiKey) {
      console.log("未设置文本转语音API密钥，跳过语音合成");
      return;
    }
    
    try {
      // 获取或刷新令牌
      const token = accessToken || await getMicrosoftSpeechToken();
      
      if (!token) {
        console.error("无法获取语音服务令牌");
        return;
      }
      
      // 准备SSML
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
          <voice name="zh-CN-XiaoxiaoNeural">
            ${text}
          </voice>
        </speak>
      `;
      
      // 发送请求到微软语音服务
      const response = await fetch("https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
          "User-Agent": "ChatLive2D"
        },
        body: ssml
      });
      
      if (!response.ok) {
        throw new Error(`语音合成失败: ${response.status} ${response.statusText}`);
      }
      
      // 获取音频数据
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 播放音频
      if (audioPlayer) {
        // 停止之前的音频
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // 设置新音频并播放
        audioPlayer.src = audioUrl;
        
        // 开始说话时让模型嘴巴动起来
        if ((window as any).live2dModel) {
          // 根据文本长度估算说话时间 (每个汉字约0.3秒)
          const speakDuration = Math.max(2000, text.length * 300);
          (window as any).live2dModel.animateMouth(speakDuration);
        }
        
        audioPlayer.play();
        
        // 播放结束后释放资源
        audioPlayer.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (error) {
      console.error("文字转语音失败:", error);
      
      // 即使语音合成失败，也让模型嘴巴动起来
      if ((window as any).live2dModel) {
        const speakDuration = Math.max(2000, text.length * 300);
        (window as any).live2dModel.animateMouth(speakDuration);
      }
    }
  };

  // 发送消息到API
  const sendMessageToAPI = async (userMessage: string) => {
    // 如果API密钥未设置，打开设置弹窗
    if (!isApiKeySet) {
      setIsApiKeyDialogOpen(true);
      return;
    }
    
    setIsSending(true);
    
    try {
      // 添加用户消息到聊天
      const userMessageObj: ChatMessage = {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        timestamp: new Date()
      };
      
      addMessage(userMessageObj);
      setInputMessage("");
      
      // 准备API请求
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3-8B",
          messages: [
            {
              role: "system",
              content: `你是一个可爱的 Live2D 虚拟角色助手，回答用户提问时，请根据语气选择一个合适的表情标签返回。你只能使用以下表情之一：${JSON.stringify(expressionList || ['happy', 'angry', 'sad', 'smile', 'neutral'])}。  回答格式如下（必须严格使用）： {   \"expression\": \"[在此填写表情名称]\",   \"reply\": \"[在此填写你的回答文字]\" }`
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          stream: false,
          max_tokens: 512,
          enable_thinking: false,
          thinking_budget: 4096,
          min_p: 0.05,
          stop: [],
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          response_format: { type: "text" }
        })
      };
      
      // 发送请求到API
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', options);
      const data = await response.json();
      
      // 解析API响应
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        
        try {
          // 尝试解析JSON格式的回复
          const parsedContent = JSON.parse(content);
          
          // 添加AI回复到聊天
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: parsedContent.reply || content,
            isUser: false,
            timestamp: new Date()
          };
          
          addMessage(aiMessage);
          
          // 设置表情
          if (parsedContent.expression && (window as any).live2dModel) {
            (window as any).live2dModel.changeExpression(parsedContent.expression);
          }
          
          // 语音播放回复
          speakText(parsedContent.reply || content);
        } catch (e) {
          // 如果解析失败，直接使用原始内容
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: content,
            isUser: false,
            timestamp: new Date()
          };
          
          addMessage(aiMessage);
          speakText(content);
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "抱歉，我遇到了一些问题，请稍后再试。",
        isUser: false,
        timestamp: new Date()
      };
      
      addMessage(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // 发送消息
  const sendMessage = () => {
    if (!inputMessage.trim() || isSending) return;
    sendMessageToAPI(inputMessage);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* API密钥设置弹窗 */}
      <ApiKeyDialog 
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        aiApiKey={aiApiKey}
        setAiApiKey={setAiApiKey}
        ttsApiKey={ttsApiKey}
        setTtsApiKey={setTtsApiKey}
        onSave={saveApiKeys}
      />
      
      {/* 设置按钮 */}
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsApiKeyDialogOpen(true)}
          title="API密钥设置"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
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
          <Button 
            variant="outline" 
            size="icon" 
            className={`${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? "停止录音" : "开始录音"}
            disabled={isSending || !isApiKeySet}
          >
            {isRecording ? (
              <span className="flex items-center justify-center h-5 w-5">●</span>
            ) : (
              <span className="flex items-center justify-center h-5 w-5">🎤</span>
            )}
          </Button>
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isApiKeySet ? "输入消息..." : "请先设置API密钥..."}
            disabled={isRecording || isSending || !isApiKeySet}
            className="flex-1"
          />
          
          <Button 
            variant={!isApiKeySet ? "secondary" : "default"}
            size="icon"
            onClick={isApiKeySet ? sendMessage : () => setIsApiKeyDialogOpen(true)}
            disabled={(!inputMessage.trim() && isApiKeySet) || isSending}
          >
            {isSending ? (
              <span className="flex items-center justify-center h-5 w-5">⏳</span>
            ) : !isApiKeySet ? (
              <Settings className="h-4 w-4" />
            ) : (
              <span className="flex items-center justify-center h-5 w-5">➤</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}