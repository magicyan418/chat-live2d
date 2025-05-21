import { create } from 'zustand';

// 模型嘴巴参数映射
const MODEL_MOUTH_PARAM_MAP: Record<string, string> = {
  "米雪儿": "ParamMouthOpenY8",
  "小恶魔": "ParamMouthOpenY",
  // 可以添加更多模型的映射
  "default": "ParamMouthOpenY"
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
  }
}));