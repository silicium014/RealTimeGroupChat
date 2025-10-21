import { useState, useMemo } from 'react';
import { Message } from '../types';

export const useMessageSearch = (messages: Message[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    
    const term = searchTerm.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(term) ||
      message.username.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  const searchResultsCount = useMemo(() => {
    return filteredMessages.length;
  }, [filteredMessages]);

  return {
    searchTerm,
    setSearchTerm,
    filteredMessages,
    searchResultsCount
  };
};