"use client";

import { useLive2DStore } from "@/store/live2dStore";

export default function ExpressionController() {
  const { expressionList, currentExpression } = useLive2DStore();

  const handleChangeExpression = (expressionName: string) => {
    // 调用挂载在window上的方法
    if ((window as any).live2dModel) {
      (window as any).live2dModel.changeExpression(expressionName);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-3">表情/动作控制</h2>
      
      {/* 表情/动作列表 */}
      {expressionList.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {expressionList.map((exp) => (
            <button
              key={exp}
              className={`p-2 rounded-md text-sm transition-all ${currentExpression === exp ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleChangeExpression(exp)}
            >
              {exp}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">该模型没有表情/动作</p>
      )}
    </div>
  );
}