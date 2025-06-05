import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  modelName?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  inputMessage: string;
  isRecording: boolean;
  
  modelMessagesMap: Record<string, ChatMessage[]>;
  
  setInputMessage: (message: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  getMessagesByModel: (modelName: string) => ChatMessage[] | null;
  setMessagesForModel: (modelName: string, messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inputMessage: "",
  isRecording: false,
  modelMessagesMap: {},
  
  setInputMessage: (message) => set({ inputMessage: message }),
  setIsRecording: (isRecording) => set({ isRecording }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  clearMessages: () => set({ messages: [] }),
  
  getMessagesByModel: (modelName) => {
    const { modelMessagesMap } = get();
    return modelMessagesMap[modelName] || null;
  },
  
  setMessagesForModel: (modelName, messages) => set((state) => ({
    modelMessagesMap: {
      ...state.modelMessagesMap,
      [modelName]: [...messages]
    }
  }))
}));