import { memo } from 'react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem = memo(({ message }: MessageItemProps) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="message-item">
      <div className="message-header">
        <span className="username">{message.username}</span>
        <span className="timestamp">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        {message.type === 'file' && message.fileInfo ? (
          <div className="file-message">
            <a 
              href={message.fileInfo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-link"
            >
              📎 {message.fileInfo.name}
            </a>
            <span className="file-size">
              ({formatFileSize(message.fileInfo.size)})
            </span>
            {message.content && (
              <div className="file-caption">{message.content}</div>
            )}
          </div>
        ) : (
          <div className="text-message">{message.content}</div>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';