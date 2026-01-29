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
import { useToast } from "@/components/ui/use-toast";
import { Settings, Eye, EyeOff, Trash2 } from "lucide-react";

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
  autoComplete = "off",
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // 直接更新值
    onChange({ 
      target: { value: pastedText, id } 
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // 生成掩码文本，使用点而不是星号，避免触发浏览器的密码识别
  const getMaskedValue = () => {
    return showPassword ? value : value.replace(/./g, '•');
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        id={id}
        type="text" 
        value={getMaskedValue()}
        onChange={onChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={className}
        autoComplete={autoComplete}
        style={{ 
          fontFamily: 'monospace',
          paddingRight: '40px', // 为按钮留出足够空间
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
        style={{ 
          maxWidth: '40px',
          zIndex: 10 // 确保按钮在最上层
        }}
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
  onSave,
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
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 当弹窗打开时，初始化临时状态
  useEffect(() => {
    if (open) {
      setTempAiKey(aiApiKey);
      setTempTtsKey(ttsApiKey);
      setErrorMessage("");
    }
  }, [open, aiApiKey, ttsApiKey]);

  const handleSave = () => {
    if (!tempAiKey.trim()) {
      setErrorMessage("请提供硅基流动API密钥，AI聊天功能必须使用此密钥");
      return;
    }

    setErrorMessage("");
    setAiApiKey(tempAiKey);
    setTtsApiKey(tempTtsKey);
    onSave();
    onOpenChange(false);

    toast({
      title: "成功",
      description: "API密钥设置已保存",
      variant: "default",
      duration: 2000,
    });
  };

  // 处理对话框关闭
  const handleOpenChange = (isOpen: boolean) => {
    // 如果是要关闭对话框
    if (!isOpen) {
      // 如果用户修改了设置但没有保存，直接放弃修改
      if (tempAiKey !== aiApiKey || tempTtsKey !== ttsApiKey) {
        setTempAiKey(aiApiKey);
        setTempTtsKey(ttsApiKey);
      }

      // 允许关闭对话框
      onOpenChange(isOpen);
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-muted-foreground col-span-4">
              AI聊天功能必须提供此密钥
            </p>
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
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-muted-foreground col-span-4">
              此密钥为可选，不提供将无法使用语音功能（EastAsia区域）
            </p>
          </div>
          <div className="h-5">
            {errorMessage && (
              <div className="text-red-500 text-sm">{errorMessage}</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>取消</Button>
          <Button variant="outline" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ChatInterface() {
  const {
    messages,
    inputMessage,
    isRecording,
    setInputMessage,
    setIsRecording,
    addMessage,
    clearMessages,
    getMessagesByModel,
    setMessagesForModel,
  } = useChatStore();
  const { currentModel, expressionList, getTTSVoiceConfig, generateSSML } = useLive2DStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [audioPlayer] = useState<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio() : null
  );
  const { toast } = useToast();
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const prevModelRef = useRef<string>("");

  // API密钥状态
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [ttsApiKey, setTtsApiKey] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  // 从localStorage加载API密钥
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAiKey = localStorage.getItem("aiApiKey");
      const savedTtsKey = localStorage.getItem("ttsApiKey");

      if (savedAiKey) {
        setAiApiKey(savedAiKey);
        setIsApiKeySet(true);
      }

      if (savedTtsKey) {
        setTtsApiKey(savedTtsKey);
      }
    }
  }, []);

  // 监听模型变化，切换对应的聊天历史
  useEffect(() => {
    if (currentModel && prevModelRef.current !== currentModel) {
      if (prevModelRef.current) {
        // 保存当前模型的聊天记录
        setMessagesForModel(prevModelRef.current, messages);
      }
      
      // 加载新模型的聊天记录
      const modelMessages = getMessagesByModel(currentModel);
      if (modelMessages) {
        // 如果有历史记录，使用历史记录
        clearMessages();
        modelMessages.forEach(msg => addMessage(msg));
      } else {
        // 如果没有历史记录，清空聊天
        clearMessages();
      }
      
      prevModelRef.current = currentModel;
    }
  }, [currentModel, messages, clearMessages, getMessagesByModel, setMessagesForModel, addMessage]);

  // 保存API密钥
  const saveApiKeys = () => {
    localStorage.setItem("aiApiKey", aiApiKey);
    if (ttsApiKey) {
      localStorage.setItem("ttsApiKey", ttsApiKey);
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
      if (!ttsApiKey) {
        console.log("未设置微软语音服务密钥");
        return null;
      }

      const response = await fetch(
        "https://eastasia.api.cognitive.microsoft.com/sts/v1.0/issueToken",
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": ttsApiKey,
            "Content-Length": "0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `获取令牌失败: ${response.status} ${response.statusText}`
        );
      }

      const token = await response.text();
      setAccessToken(token);
      return token;
    } catch (error) {
      console.error("获取微软语音服务令牌失败:", error);
      toast({
        title: "错误",
        description: "获取语音服务令牌失败，请检查API密钥是否正确",
        variant: "destructive",
        duration: 3000,
      });
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
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognitionAPI =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
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
        console.error("语音识别错误:", event.error);
        setIsRecording(false);
        toast({
          title: "语音识别错误",
          description: `错误类型: ${event.error}`,
          variant: "destructive",
          duration: 3000,
        });
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  // 语音转文字
  const toggleRecording = () => {
    if (!speechRecognitionRef.current) {
      toast({
        title: "不支持",
        description: "您的浏览器不支持语音识别功能",
        variant: "destructive",
        duration: 3000,
      });
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

  // 根据音频持续时间和音量调整嘴巴动画
  const animateMouth = (duration: number, text: string) => {
    if ((window as any).live2dModel) {
      // 根据文本长度和持续时间计算说话强度
      const intensity = Math.min(1.0, Math.max(0.3, text.length / 100));
      (window as any).live2dModel.animateMouth(duration, intensity);
    }
  };

  // 文字转语音 (使用微软语音服务)
  const speakText = async (text: string) => {
    // 如果没有TTS密钥，则不进行语音合成但仍然让嘴巴动起来
    if (!ttsApiKey) {
      console.log("未设置文本转语音API密钥，跳过语音合成");
      // 估算一个默认持续时间
      const estimatedDuration = text.length * 150; // 每个字符约150毫秒
      animateMouth(estimatedDuration, text);
      return;
    }

    try {
      // 获取或刷新令牌
      const token = accessToken || (await getMicrosoftSpeechToken());

      if (!token) {
        toast({
          title: "语音合成失败",
          description: "无法获取语音服务令牌",
          variant: "destructive",
          duration: 3000,
        });
        const estimatedDuration = text.length * 150;
        animateMouth(estimatedDuration, text);
        return;
      }

      // 获取当前模型的语音配置
      const voiceConfig = getTTSVoiceConfig();

      // 准备SSML
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
          <voice name="${voiceConfig.voiceName}">
            ${generateSSML(text)}
          </voice>
        </speak>
      `;

      // 发送请求到微软语音服务
      const response = await fetch(
        "https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
            "User-Agent": "ChatLive2D",
          },
          body: ssml,
        }
      );

      if (!response.ok) {
        throw new Error(
          `语音合成失败: ${response.status} ${response.statusText}`
        );
      }

      // 获取音频数据
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 播放音频
      if (audioPlayer) {
        // 停止之前的音频
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        // 设置新音频
        audioPlayer.src = audioUrl;
        
        // 获取音频持续时间并设置动画
        audioPlayer.onloadedmetadata = () => {
          const audioDuration = audioPlayer.duration * 1000; // 转换为毫秒
          // 开始说话时让模型嘴巴动起来，使用实际音频持续时间
          animateMouth(audioDuration, text);
        };

        // 播放音频
        audioPlayer.play().catch(err => {
          console.error("播放音频失败:", err);
          // 如果播放失败，仍然尝试进行嘴巴动画
          const estimatedDuration = text.length * 150;
          animateMouth(estimatedDuration, text);
        });

        // 播放结束后释放资源
        audioPlayer.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (error) {
      console.error("文字转语音失败:", error);
      toast({
        title: "语音合成失败",
        description: "无法将文字转换为语音，请检查API密钥是否正确",
        variant: "destructive",
        duration: 3000,
      });

      // 即使语音合成失败，也让模型嘴巴动起来
      const estimatedDuration = text.length * 150;
      animateMouth(estimatedDuration, text);
    }
  };

  // 处理AI回复
  const handleAIResponse = (content: string) => {
    try {
      // 尝试解析JSON格式的回复
      const parsedContent = JSON.parse(content);

      // 添加AI回复到聊天
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: parsedContent.reply || content,
        isUser: false,
        timestamp: new Date(),
        modelName: currentModel, // 添加模型名称
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
        timestamp: new Date(),
        modelName: currentModel, // 添加模型名称
      };

      addMessage(aiMessage);
      speakText(content);
    }
  };

  // 发送消息到API
  const sendMessageToAPI = async (userMessage: string) => {
    // 如果API密钥未设置，打开设置弹窗
    if (!isApiKeySet || !aiApiKey.trim()) {
      toast({
        title: "需要设置API密钥",
        description: "请先设置硅基流动API密钥以使用聊天功能",
        variant: "default",
        duration: 3000,
      });
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
        timestamp: new Date(),
        modelName: currentModel, // 添加模型名称
      };

      addMessage(userMessageObj);
      setInputMessage("");

      // 准备API请求
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3-8B",
          messages: [
            {
              role: "system",
              content: `你是一个可爱的 Live2D 虚拟角色助手，回答用户提问时，请根据语气选择一个合适的表情标签返回。你只能使用以下表情之一：${JSON.stringify(
                expressionList || ["happy", "angry", "sad", "smile", "neutral"]
              )}。  回答格式如下（必须严格使用）： {   \"expression\": \"[在此填写表情名称]\",   \"reply\": \"[在此填写你的回答文字]\" }`,
            },
            {
              role: "user",
              content: userMessage,
            },
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
          response_format: { type: "text" },
        }),
      };

      // 发送请求到API
      const response = await fetch(
        "https://api.siliconflow.cn/v1/chat/completions",
        options
      );

      if (!response.ok) {
        throw new Error(
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // 解析API响应
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        handleAIResponse(content);
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "抱歉，我遇到了一些问题，请稍后再试。",
        isUser: false,
        timestamp: new Date(),
        modelName: currentModel,
      };

      addMessage(errorMessage);

      toast({
        title: "发送消息失败",
        description:
          error instanceof Error ? error.message : "请检查网络连接和API密钥",
        variant: "default",
        duration: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  // 发送消息
  const sendMessage = () => {
    if (!inputMessage.trim() || isSending) return;
    sendMessageToAPI(inputMessage);
  };

  // 清除聊天记录
  const handleClearChat = () => {
    clearMessages();
    toast({
      title: "已清除聊天记录",
      variant: "default",
      duration: 2000,
    });
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
      
      {/* 设置按钮和清除聊天按钮 */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearChat}
          title="清除聊天记录"
          className="bg-opacity-50 hover:bg-opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsApiKeyDialogOpen(true)}
          title="API密钥设置"
          className="bg-opacity-50 hover:bg-opacity-100"
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
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.isUser
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
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
            className={`${
              isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""
            }`}
            onClick={() => {
              if (!isApiKeySet || !aiApiKey.trim()) {
                toast({
                  title: "需要设置API密钥",
                  description: "请先设置硅基流动API密钥以使用语音功能",
                  variant: "default",
                  duration: 3000,
                });
                setIsApiKeyDialogOpen(true);
              } else {
                toggleRecording();
              }
            }}
            title={isRecording ? "停止录音" : "开始录音"}
            disabled={isSending}
          >
            {isRecording ? (
              <span className="flex items-center justify-center h-5 w-5">
                ●
              </span>
            ) : (
              <span className="flex items-center justify-center h-5 w-5">
                🎤
              </span>
            )}
          </Button>

          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                if (!isApiKeySet || !aiApiKey.trim()) {
                  toast({
                    title: "需要设置API密钥",
                    description: "请先设置硅基流动API密钥以使用聊天功能",
                    variant: "default",
                    duration: 3000,
                  });
                  setIsApiKeyDialogOpen(true);
                } else if (inputMessage.trim()) {
                  sendMessage();
                }
              }
            }}
            placeholder={
              isApiKeySet && aiApiKey.trim()
                ? "输入消息..."
                : "请先设置API密钥..."
            }
            disabled={isRecording || isSending}
            className="flex-1"
          />

          <Button
            variant={!isApiKeySet || !aiApiKey.trim() ? "secondary" : "default"}
            size="icon"
            onClick={() => {
              if (!isApiKeySet || !aiApiKey.trim()) {
                toast({
                  title: "需要设置API密钥",
                  description: "请先设置硅基流动API密钥以使用聊天功能",
                  variant: "default",
                  duration: 3000,
                });
                setIsApiKeyDialogOpen(true);
              } else if (inputMessage.trim()) {
                sendMessage();
              }
            }}
            disabled={isSending || (isApiKeySet && !inputMessage.trim())}
          >
            {isSending ? (
              <span className="flex items-center justify-center h-5 w-5">
                ⏳
              </span>
            ) : !isApiKeySet || !aiApiKey.trim() ? (
              <Settings className="h-4 w-4" />
            ) : (
              <span className="flex items-center justify-center h-5 w-5">
                ➤
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
