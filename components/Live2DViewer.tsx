"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";
import { useLive2DStore } from "@/store/live2dStore";
import Loading from "@/components/Loading";

// 为 pixi-live2d-display 提供全局 PIXI 引用
if (typeof window !== "undefined") {
  (window as any).PIXI = PIXI;
}

interface ModelProps {
  modelPath?: string;
}

export default function Live2DViewer({ modelPath }: ModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);
  const [model, setModel] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    setCurrentModel,
    setExpressionList,
    setIsModelLoaded,
    setCurrentExpression,
    getMouthParam,
    getModelConfig,
    setIsSpeaking,
  } = useLive2DStore();

  // 切换模型
  const changeModel = async (path: string) => {
    if (!canvasRef.current || !app) {
      console.error("Canvas or PIXI app not ready");
      return;
    }

    setIsLoading(true);

    try {
      // 清除旧模型的代码...
      if (model) {
        try {
          // 确保模型从舞台中移除
          app.stage.removeChild(model);
          // 销毁模型资源
          model.destroy({ children: true, texture: true, baseTexture: true });
          setModel(null); // Update state instead of direct assignment

          // 清理舞台上可能残留的其他显示对象
          while (app.stage.children.length > 0) {
            const child = app.stage.getChildAt(0);
            app.stage.removeChild(child);
            child.destroy({ children: true, texture: true, baseTexture: true });
          }
        } catch (error) {
          console.error("清除旧模型失败:", error);
        }
      }

      // 获取模型名称
      const modelName =
        path.split("/").pop()?.replace(".model3.json", "") || "未知模型";
      // 获取模型配置
      const modelConfig = getModelConfig(modelName);

      // 加载新模型
      const newModel = await Live2DModel.from(path, {
        autoInteract: false,
      });

      // 应用模型特定的缩放和位置
      newModel.scale.set(modelConfig.scale);
      newModel.x = modelConfig.x;
      newModel.y = modelConfig.y;

      // 确保模型被添加到舞台
      app.stage.addChild(newModel);
      setModel(newModel); // Update state

      // 提取表情和动作列表
      const expressions: string[] = [];
      const modalExpressions = (newModel as any).internalModel.settings
        .expressions;
      if (modalExpressions && modalExpressions.length > 0) {
        modalExpressions.forEach((item: any) => {
          expressions.push(item.Name);
        });
      }

      setExpressionList(expressions);
      setCurrentExpression("");
      setIsModelLoaded(true);
      setCurrentModel(modelName);

      console.log(`模型 ${modelName} 加载成功，应用配置:`, modelConfig);
    } catch (error) {
      console.error("加载模型失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize PIXI app once
  useEffect(() => {
    const initPixiApp = async () => {
      if (!canvasRef.current || isInitialized) return;

      try {

        if (!(window as any).Live2DCubismCore) {
          console.error(
            "❌ Live2DCubismCore is still undefined after script load."
          );
          return;
        }

        // Create PIXI application
        const newApp = new PIXI.Application({
          view: canvasRef.current,
          resizeTo: canvasRef.current,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          antialias: true,
        });

        setApp(newApp);
        setIsInitialized(true);
        console.log("PIXI application initialized successfully");
      } catch (err) {
        console.error("Failed to initialize PIXI application:", err);
      }
    };

    initPixiApp();

    return () => {
      // Clean up resources
      if (model) {
        model.destroy({ children: true, texture: true, baseTexture: true });
        setModel(null);
      }
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        setApp(null);
      }
      setIsInitialized(false);
    };
  }, []);

  // Load model when app is ready or modelPath changes
  useEffect(() => {
    if (app && isInitialized) {
      changeModel(modelPath || "/model/mixuer_vts/米雪儿.model3.json");
    }
  }, [app, isInitialized, modelPath]);

  // Expose methods to window
  useEffect(() => {
    if (!app || !isInitialized) return;

    // 挂载到window，方便其他组件调用
    (window as any).live2dModel = {
      changeExpression: (expressionName: string) => {
        if (!model || !useLive2DStore.getState().isModelLoaded) return;

        try {
          model.expression(expressionName);
          setCurrentExpression(expressionName);
          console.log(`已切换到表情/动作: ${expressionName}`);
        } catch (error) {
          console.error(`切换表情/动作失败: ${expressionName}`, error);
        }
      },
      animateMouth: (duration = 3000) => {
        if (!model || !useLive2DStore.getState().isModelLoaded) return;

        // 根据当前模型获取对应的嘴巴参数
        const mouthParam = getMouthParam();
        setIsSpeaking(true);

        const timer = setInterval(() => {
          let n = Math.random() * 0.8; // 控制嘴巴开合幅度
          model.internalModel.coreModel.setParameterValueById(mouthParam, n);
        }, 100);

        setTimeout(() => {
          clearInterval(timer);
          // 关闭嘴巴
          model.internalModel.coreModel.setParameterValueById(mouthParam, 0);
          setIsSpeaking(false);
        }, duration);
      },
      changeModel: (path: string) => {
        changeModel(path);
      },
    };

    return () => {
      delete (window as any).live2dModel;
    };
  }, [app, model, isInitialized]);

  return (
    <div className="relative w-full h-full">
      <canvas 
        className={`w-full h-full ${isLoading ? 'hidden' : 'block'}`} 
        ref={canvasRef}
      ></canvas>
      <div className="absolute w-[300px] h-[300px] inset-0 m-auto flex items-center justify-center">
        {isLoading && <Loading />}
      </div>
    </div>
  );
}
