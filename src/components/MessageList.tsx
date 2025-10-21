import React, { memo, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Message } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  typingUsers: string[];
}

export const MessageList = memo(({ messages, typingUsers }: MessageListProps) => {
  const listRef = useRef<List>(null);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages]);

  const MessageRow = memo(({ index, style, data }: { 
    index: number; 
    style: React.CSSProperties; 
    data: Message[] 
  }) => (
    <div style={style}>
      <MessageItem message={data[index]} />
    </div>
  ));

  return (
    <div className="message-list">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={messages.length}
            itemSize={100}
            itemData={messages}
          >
            {MessageRow}
          </List>
        )}
      </AutoSizer>
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';