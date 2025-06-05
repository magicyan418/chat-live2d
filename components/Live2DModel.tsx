"use client";

import { useEffect, useRef } from "react";
import { useLive2DStore } from "@/store/live2dStore";
import * as PIXI from "pixi.js";
import { Live2DModel as CubismModel } from "pixi-live2d-display";

// 添加到window全局对象中
declare global {
  interface Window {
    PIXI: typeof PIXI;
    live2d: typeof CubismModel;
    live2dModel: {
      changeExpression: (expression: string) => void;
      animateMouth: (duration: number, intensity?: number) => void;
    };
  }
}

// 预加载PIXI和Live2D
if (typeof window !== 'undefined') {
  window.PIXI = PIXI;
  window.live2d = CubismModel;
}

// 初始化Live2D模型
export default function Live2DModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);
  const mouthAnimationIdRef = useRef<number | null>(null);
  
  const { 
    modelPath, 
    currentModel, 
    setCurrentModel, 
    setIsModelLoaded,
    setExpressionList,
    getModelConfig
  } = useLive2DStore();

  // 加载模型
  const loadModel = async (path: string) => {
    if (!appRef.current) return;

    try {
      // 清除之前的模型
      if (modelRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy();
        modelRef.current = null;
      }

      // 加载新模型
      const model = await CubismModel.from(path);
      
      // 获取模型配置
      const modelName = path.split('/').pop()?.split('.')[0] || "";
      setCurrentModel(modelName);
      const modelConfig = getModelConfig(modelName);

      // 设置模型位置和缩放
      model.scale.set(modelConfig.scale);
      model.x = appRef.current.renderer.width / 2 + modelConfig.x;
      model.y = appRef.current.renderer.height / 2 + modelConfig.y;
      
      // 添加到舞台
      appRef.current.stage.addChild(model);
      modelRef.current = model;

      // 尝试加载表情
      try {
        // 提取表情列表
        let expressionNames: string[] = [];
        
        // 检查模型是否有表情定义
        if (model.internalModel && 
            model.internalModel.settings) {
          // 使用any类型绕过类型检查
          const settings = model.internalModel.settings as any;
          if (settings.expressions) {
            // 从模型设置中获取表情
            const expressions = settings.expressions;
            expressionNames = expressions.map((exp: any) => exp.Name);
          } else {
            // 使用默认表情列表
            expressionNames = ["happy", "angry", "sad", "surprised", "neutral"];
          }
        } else {
          // 使用默认表情列表
          expressionNames = ["happy", "angry", "sad", "surprised", "neutral"];
        }
        
        setExpressionList(expressionNames);
        console.log("可用表情:", expressionNames);
      } catch (error) {
        console.warn("加载表情失败，使用默认表情", error);
        setExpressionList(["happy", "angry", "sad", "surprised", "neutral"]);
      }

      // 模型加载完成
      setIsModelLoaded(true);
      console.log("模型加载成功:", modelName);

      return model;
    } catch (error) {
      console.error("模型加载失败:", error);
      setIsModelLoaded(false);
      return null;
    }
  };

  // 初始化PIXI应用
  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建PIXI应用
    const app = new PIXI.Application({
      view: canvasRef.current,
      autoStart: true,
      backgroundColor: 0x00000000,
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: window
    });

    appRef.current = app;

    // 清理函数
    return () => {
      if (mouthAnimationIdRef.current) {
        cancelAnimationFrame(mouthAnimationIdRef.current);
      }
      app.destroy(true, true);
    };
  }, []);

  // 监听模型路径变化，加载新模型
  useEffect(() => {
    if (appRef.current && modelPath) {
      loadModel(modelPath);
    }
  }, [modelPath]);

  // 定义全局模型控制方法
  useEffect(() => {
    if (!modelRef.current) return;

    // 定义模型控制方法
    if (typeof window !== 'undefined') {
      window.live2dModel = {
        // 切换表情
        changeExpression: (expression: string) => {
          if (!modelRef.current || !expression) return;
          
          try {
            // 尝试切换表情
            const model = modelRef.current;
            if (model.internalModel && model.internalModel.motionManager) {
              // 先尝试使用表情动作
              model.internalModel.motionManager.startMotion(`Expression:${expression}`);
            } else {
              console.warn("无法切换表情，模型不支持表情功能");
            }
          } catch (error) {
            console.error("切换表情失败:", error);
          }
        },

        // 嘴巴动画方法，接受持续时间和强度参数
        animateMouth: (duration: number, intensity: number = 0.5) => {
          if (!modelRef.current) return;

          const model = modelRef.current;
          const mouthParam = useLive2DStore.getState().getMouthParam();
          
          // 计算动画帧数
          const fps = 30;
          const totalFrames = Math.ceil(duration / 1000 * fps);
          
          // 停止之前的动画
          if (mouthAnimationIdRef.current) {
            cancelAnimationFrame(mouthAnimationIdRef.current);
            mouthAnimationIdRef.current = null;
          }

          // 使用正弦波模拟说话的嘴巴动作
          let frame = 0;
          const maxMouthOpen = intensity; // 最大嘴巴开合度
          
          const animate = () => {
            if (frame >= totalFrames) {
              // 动画结束，关闭嘴巴
              try {
                if (model.internalModel && model.internalModel.coreModel) {
                  model.internalModel.coreModel.setParameterValueById(mouthParam, 0);
                }
              } catch (error) {
                console.warn("关闭嘴巴动画失败:", error);
              }
              
              mouthAnimationIdRef.current = null;
              return;
            }

            // 使用正弦波生成自然的嘴巴开合动作
            const progress = frame / totalFrames;
            const frequency = 8; // 嘴巴开合频率
            
            // 随机因子，使动画更自然
            const randomFactor = 0.3 + Math.random() * 0.4;
            
            // 计算当前帧的嘴巴开合度
            const mouthValue = Math.abs(Math.sin(progress * Math.PI * frequency)) * maxMouthOpen * randomFactor;
            
            // 设置模型参数
            try {
              if (model.internalModel && model.internalModel.coreModel) {
                model.internalModel.coreModel.setParameterValueById(mouthParam, mouthValue);
              }
            } catch (error) {
              console.warn("设置嘴巴参数失败:", error);
            }
            
            // 继续下一帧
            frame++;
            mouthAnimationIdRef.current = requestAnimationFrame(animate);
          };
          
          // 开始动画
          mouthAnimationIdRef.current = requestAnimationFrame(animate);
        }
      };
    }
  }, [modelRef.current]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 w-full h-full"
    />
  );
} 