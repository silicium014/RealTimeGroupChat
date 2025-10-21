import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMessageSearch } from '../hooks/useMessageSearch';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { MessageList } from './MessageList';
import { UserList } from './UserList';
import { MessageInput } from './MessageInput';
import { FileUpload } from './FileUpload';
import { SearchMessages } from './SearchMessages';

export const ChatRoom: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'files' | 'search'>('chat');
  const [usernameError, setUsernameError] = useState<string>('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const {
    isChecking,
    checkUsername,
    registerUser,
    updateUserActivity
  } = useIndexedDB();

  const {
    isConnected,
    users,
    messages,
    typingUsers,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping
  } = useWebSocket('http://localhost:3000');

  const {
    searchTerm,
    setSearchTerm,
    filteredMessages,
    searchResultsCount
  } = useMessageSearch(messages);

  // Проверяем username при изменении
  useEffect(() => {
    const validateUsername = async () => {
      if (username.trim().length >= 2) {
        setIsCheckingUsername(true);
        const result = await checkUsername(username.trim());
        setIsCheckingUsername(false);
        
        if (result.exists) {
          setUsernameError('This username is already taken');
        } else if (result.error) {
          setUsernameError(result.error);
        } else {
          setUsernameError('');
        }
      } else {
        setUsernameError('');
      }
    };

    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsername]);

  const handleJoin = useCallback(async () => {
    if (!username.trim()) {
      setUsernameError('Please enter a username');
      return;
    }

    // Финальная проверка перед присоединением
    const validation = await checkUsername(username.trim());
    if (validation.exists) {
      setUsernameError('This username is already taken. Please choose another one.');
      return;
    }

    if (validation.error) {
      setUsernameError(validation.error);
      return;
    }

    // Регистрируем пользователя в IndexedDB
    const registered = await registerUser(username.trim());
    if (!registered) {
      setUsernameError('Failed to register username. Please try again.');
      return;
    }

    // Обновляем активность пользователя
    await updateUserActivity(username.trim());

    // Присоединяемся к чату
    joinChat(username.trim());
    setIsJoined(true);
  }, [username, checkUsername, registerUser, updateUserActivity, joinChat]);

  const handleSendMessage = useCallback((content: string) => {
    if (username) {
      sendMessage({
        userId: 'current-user',
        username,
        content,
        type: 'text'
      });
    }
  }, [username, sendMessage]);

  const handleFileUpload = useCallback((file: File, caption: string) => {
    if (username) {
      const fileUrl = URL.createObjectURL(file);
      
      sendMessage({
        userId: 'current-user',
        username,
        content: caption,
        type: 'file',
        fileInfo: {
          name: file.name,
          size: file.size,
          url: fileUrl,
          type: file.type
        }
      });
    }
  }, [username, sendMessage]);

  const handleTypingStart = useCallback(() => {
    startTyping(username);
  }, [username, startTyping]);

  const handleTypingStop = useCallback(() => {
    stopTyping(username);
  }, [username, stopTyping]);

  const displayedMessages = useMemo(() => {
    return currentView === 'search' && searchTerm ? filteredMessages : messages;
  }, [currentView, searchTerm, filteredMessages, messages]);

  const isUsernameValid = !usernameError && username.trim().length >= 2;

  if (!isJoined) {
    return (
      <div className="join-screen">
        <div className="join-form">
          <h1>Join Chat Room</h1>
          <div className="username-input-container">
            <input
              type="text"
              placeholder="Enter your username (min 2 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && isUsernameValid && handleJoin()}
              className={usernameError ? 'error' : ''}
              maxLength={20}
            />
            {isCheckingUsername && (
              <div className="checking-indicator">Checking...</div>
            )}
            {usernameError && (
              <div className="error-message">{usernameError}</div>
            )}
            {!usernameError && username.trim().length >= 2 && (
              <div className="success-message">Username available!</div>
            )}
          </div>
          <button 
            onClick={handleJoin} 
            disabled={!isUsernameValid || isChecking}
          >
            {isChecking ? 'Joining...' : 'Join Chat'}
          </button>
          
          <div className="username-rules">
            <h4>Username Rules:</h4>
            <ul>
              <li>2-20 characters long</li>
              <li>No special characters (&lt;&gt;/"\\&amp;)</li>
              <li>Must be unique</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h1>Real-time Chat</h1>
        <div className="connection-status">
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="user-info">
          Welcome, <strong>{username}</strong>!
        </div>
      </div>

      <div className="chat-layout">
        <div className="sidebar">
          <UserList users={users} />
          
          <div className="view-controls">
            <button 
              className={currentView === 'chat' ? 'active' : ''}
              onClick={() => setCurrentView('chat')}
            >
              💬 Chat
            </button>
            <button 
              className={currentView === 'search' ? 'active' : ''}
              onClick={() => setCurrentView('search')}
            >
              🔍 Search
            </button>
            <button 
              className={currentView === 'files' ? 'active' : ''}
              onClick={() => setCurrentView('files')}
            >
              📁 Files
            </button>
          </div>
        </div>

        <div className="main-content">
          {currentView === 'search' && (
            <SearchMessages
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              resultsCount={searchResultsCount}
            />
          )}

          <MessageList 
            messages={displayedMessages} 
            typingUsers={typingUsers}
          />

          {currentView === 'chat' && (
            <>
              <FileUpload
                onFileUpload={handleFileUpload}
                userId="current-user"
                username={username}
              />
              
              <MessageInput
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                disabled={!isConnected}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};