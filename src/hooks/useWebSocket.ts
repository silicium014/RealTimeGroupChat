import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '../types';

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io(url);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('users_list', (usersList: User[]) => {
      setUsers(usersList);
    });

    newSocket.on('users_update', (usersList: User[]) => {
      setUsers(usersList);
    });

    newSocket.on('messages_history', (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_typing', (username: string) => {
      setTypingUsers(prev => 
        prev.includes(username) ? prev : [...prev, username]
      );
    });

    newSocket.on('user_stop_typing', (username: string) => {
      setTypingUsers(prev => prev.filter(user => user !== username));
    });

    return () => {
      newSocket.close();
    };
  }, [url]);

  const joinChat = useCallback((username: string) => {
    if (socket) {
      socket.emit('user_join', username);
    }
  }, [socket]);

  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  }, [socket]);

  const startTyping = useCallback((username: string) => {
    if (socket) {
      socket.emit('typing_start', username);
    }
  }, [socket]);

  const stopTyping = useCallback((username: string) => {
    if (socket) {
      socket.emit('typing_stop', username);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    users,
    messages,
    typingUsers,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping
  };
};