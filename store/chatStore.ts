import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  inputMessage: string;
  isRecording: boolean;
  
  setInputMessage: (message: string) => void;
  setIsRecording: (recording: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  inputMessage: "",
  isRecording: false,
  
  setInputMessage: (message) => set({ inputMessage: message }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  clearMessages: () => set({ messages: [] })
}));