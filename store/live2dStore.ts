import { create } from 'zustand';

// 模型嘴巴参数映射
const MODEL_MOUTH_PARAM_MAP: Record<string, string> = {
  "米雪儿": "ParamMouthOpenY9",
  "小恶魔": "ParamMouthOpenY",
  // 可以添加更多模型的映射
  "default": "ParamMouthOpenY"
};

// TTS语音配置
export interface TTSVoiceConfig {
  voiceName: string;    // 语音名称
  pitch: number;        // 音调 (-100 到 100)
  rate: number;         // 语速 (0.5 到 2)
  style?: string;       // 语音风格 (可选)
  styleDegree?: number; // 风格强度 (0 到 2，可选)
  volume?: number;      // 音量 (0 到 100，可选)
}

// 模型TTS语音映射
const MODEL_TTS_VOICE_MAP: Record<string, TTSVoiceConfig> = {
  "米雪儿": {
    voiceName: "zh-CN-XiaoshuangNeural", // 小女孩音色，可爱活泼
    pitch: 15,                       // 提高音调，更符合小女孩
    rate: 1.1,                       // 稍快的语速
    style: "cheerful",               // 欢快的风格
    styleDegree: 1.2,                // 风格强度适中
    volume: 100                      // 音量
  },
  "小恶魔": {
    voiceName: "zh-CN-XiaoyiNeural", // 活泼女声
    pitch: 5,                            // 略微提高音调
    rate: 1.05,                          // 正常语速
    style: "cute",                       // 可爱的风格
    styleDegree: 1.3,                    // 风格强度较高
    volume: 100                          // 音量
  },
  // 默认语音设置
  "default": {
    voiceName: "zh-CN-XiaoxiaoNeural",   // 标准少女音色
    pitch: 0,
    rate: 1.0,
    volume: 100
  }
};

// 模型配置映射（添加缩放和位置配置）
export interface ModelConfig {
  scale: number;
  x: number;
  y: number;
}

const MODEL_CONFIG_MAP: Record<string, ModelConfig> = {
  "米雪儿": { scale: 0.25, x: 0, y: -50 },
  "小恶魔": { scale: 0.22, x: 150, y: -30 },
  // 可以添加更多模型的配置
  "default": { scale: 0.25, x: 0, y: -50 }
};

// 模型选项
export const MODEL_OPTIONS = [
  { name: "米雪儿", path: "/model/mixuer_vts/米雪儿.model3.json" },
  { name: "小恶魔", path: "/model/little-devil/小恶魔.model3.json" }
];

interface Live2DState {
  // 模型相关状态
  currentModel: string;
  modelPath: string;
  isModelLoaded: boolean;
  isSpeaking: boolean;
  expressionList: string[];
  currentExpression: string;
  
  // 模型操作方法
  setCurrentModel: (name: string) => void;
  setModelPath: (path: string) => void;
  setIsModelLoaded: (loaded: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setExpressionList: (expressions: string[]) => void;
  setCurrentExpression: (expression: string) => void;
  
  // 获取嘴巴参数
  getMouthParam: () => string;
  // 获取模型配置
  getModelConfig: (modelName?: string) => ModelConfig;
  // 获取TTS语音配置
  getTTSVoiceConfig: (modelName?: string) => TTSVoiceConfig;
  // 生成SSML标记
  generateSSML: (text: string, modelName?: string) => string;
}

export const useLive2DStore = create<Live2DState>((set, get) => ({
  // 初始状态
  currentModel: "",
  modelPath: "/model/mixuer_vts/米雪儿.model3.json",
  isModelLoaded: false,
  isSpeaking: false,
  expressionList: [],
  currentExpression: "",
  
  // 状态更新方法
  setCurrentModel: (name) => set({ currentModel: name }),
  setModelPath: (path) => set({ modelPath: path }),
  setIsModelLoaded: (loaded) => set({ isModelLoaded: loaded }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setExpressionList: (expressions) => set({ expressionList: expressions }),
  setCurrentExpression: (expression) => set({ currentExpression: expression }),
  
  // 获取当前模型的嘴巴参数
  getMouthParam: () => {
    const { currentModel } = get();
    return MODEL_MOUTH_PARAM_MAP[currentModel] || MODEL_MOUTH_PARAM_MAP.default;
  },
  
  // 获取模型配置
  getModelConfig: (modelName) => {
    const name = modelName || get().currentModel;
    return MODEL_CONFIG_MAP[name] || MODEL_CONFIG_MAP.default;
  },
  
  // 获取TTS语音配置
  getTTSVoiceConfig: (modelName) => {
    const name = modelName || get().currentModel;
    return MODEL_TTS_VOICE_MAP[name] || MODEL_TTS_VOICE_MAP.default;
  },
  
  // 生成SSML标记
  generateSSML: (text, modelName) => {
    const voiceConfig = get().getTTSVoiceConfig(modelName);
    let ssmlContent = "";
    
    if (voiceConfig.style) {
      ssmlContent = `
        <mstts:express-as style="${voiceConfig.style}" styledegree="${voiceConfig.styleDegree}">
          <prosody pitch="${voiceConfig.pitch}%" rate="${voiceConfig.rate}" volume="${voiceConfig.volume}%">
            ${text}
          </prosody>
        </mstts:express-as>
      `;
    } else {
      ssmlContent = `
        <prosody pitch="${voiceConfig.pitch}%" rate="${voiceConfig.rate}" volume="${voiceConfig.volume}%">
          ${text}
        </prosody>
      `;
    }
    
    return ssmlContent;
  }
}));