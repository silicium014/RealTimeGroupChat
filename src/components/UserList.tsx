import { memo } from 'react';
import { User } from '../types';

interface UserListProps {
  users: User[];
}

export const UserList = memo(({ users }: UserListProps) => {
  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);

  return (
    <div className="user-list">
      <h3>Online Users ({onlineUsers.length})</h3>
      <div className="users-online">
        {onlineUsers.map(user => (
          <div key={user.id} className="user-item online">
            <span className="status-dot"></span>
            {user.username}
          </div>
        ))}
      </div>

      {offlineUsers.length > 0 && (
        <>
          <h3>Offline Users ({offlineUsers.length})</h3>
          <div className="users-offline">
            {offlineUsers.map(user => (
              <div key={user.id} className="user-item offline">
                <span className="status-dot"></span>
                {user.username}
                {user.lastSeen && (
                  <span className="last-seen">
                    Last seen: {user.lastSeen.toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

UserList.displayName = 'UserList';