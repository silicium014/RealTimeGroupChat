export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  fileInfo?: {
    name: string;
    size: number;
    url: string;
    type: string;
  };
}

export interface ChatState {
  messages: Message[];
  users: User[];
  currentUser: User | null;
  isConnected: boolean;
  typingUsers: string[];
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  isComplete: boolean;
  error?: string;
}

export interface UsernameValidation {
  isValid: boolean;
  error?: string;
  isChecking?: boolean;
}