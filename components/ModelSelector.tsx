"use client";

import { useLive2DStore, MODEL_OPTIONS } from "@/store/live2dStore";

export default function ModelSelector() {
  const { currentModel } = useLive2DStore();

  const handleChangeModel = (path: string) => {
    // 调用挂载在window上的方法
    if ((window as any).live2dModel) {
      (window as any).live2dModel.changeModel(path);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 flex space-x-2">
      {MODEL_OPTIONS.map((option) => (
        <button
          key={option.path}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentModel === option.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/80 text-gray-700 hover:bg-white'}`}
          onClick={() => handleChangeModel(option.path)}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}