import React, { memo, useState, useCallback, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export const MessageInput = memo(({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop,
  disabled = false 
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (!isTyping) {
      onTypingStart();
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
      setIsTyping(false);
    }, 1000);
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      if (isTyping) {
        onTypingStop();
        setIsTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [message, disabled, onSendMessage, isTyping, onTypingStop]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="message-input">
      <textarea
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message... (Press Enter to send)"
        disabled={disabled}
        rows={3}
      />
      <button 
        onClick={handleSendMessage} 
        disabled={!message.trim() || disabled}
      >
        Send
      </button>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';