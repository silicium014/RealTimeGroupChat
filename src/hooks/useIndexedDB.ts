import { useState, useCallback } from 'react';

interface UserInfo {
  username: string;
  lastSeen: Date;
  joinDate: Date;
}

class UserDB {
  private dbName = 'ChatAppDB';
  private version = 1;
  private storeName = 'users';

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'username' });
          store.createIndex('lastSeen', 'lastSeen', { unique: false });
          store.createIndex('joinDate', 'joinDate', { unique: false });
        }
      };
    });
  }

  async addUser(username: string): Promise<boolean> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Проверяем существование пользователя
        const getRequest = store.get(username);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(false); // Пользователь уже существует
          } else {
            const userInfo: UserInfo = {
              username,
              lastSeen: new Date(),
              joinDate: new Date()
            };
            const addRequest = store.add(userInfo);
            addRequest.onsuccess = () => resolve(true);
            addRequest.onerror = () => reject(addRequest.error);
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Error adding user to IndexedDB:', error);
      return false;
    }
  }

  async userExists(username: string): Promise<boolean> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(username);
        
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error checking user in IndexedDB:', error);
      return false;
    }
  }

  async updateLastSeen(username: string): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const getRequest = store.get(username);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const userInfo: UserInfo = {
              ...getRequest.result,
              lastSeen: new Date()
            };
            const putRequest = store.put(userInfo);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            // Если пользователя нет, создаем запись
            const userInfo: UserInfo = {
              username,
              lastSeen: new Date(),
              joinDate: new Date()
            };
            const addRequest = store.add(userInfo);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Error updating last seen in IndexedDB:', error);
    }
  }

  async getAllUsers(): Promise<UserInfo[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting all users from IndexedDB:', error);
      return [];
    }
  }

  async deleteUser(username: string): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(username);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting user from IndexedDB:', error);
    }
  }
}

export const userDB = new UserDB();

// Хук для использования в компонентах
export const useIndexedDB = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkUsername = useCallback(async (username: string): Promise<{ exists: boolean; error?: string }> => {
    if (!username.trim()) {
      return { exists: false, error: 'Username cannot be empty' };
    }

    if (username.length < 2) {
      return { exists: false, error: 'Username must be at least 2 characters long' };
    }

    if (username.length > 20) {
      return { exists: false, error: 'Username must be less than 20 characters' };
    }

    // Проверяем на специальные символы
    const invalidChars = /[<>/"\\&]/;
    if (invalidChars.test(username)) {
      return { exists: false, error: 'Username contains invalid characters' };
    }

    setIsChecking(true);
    try {
      const exists = await userDB.userExists(username);
      return { exists };
    } catch (error) {
      console.error('Error checking username:', error);
      return { exists: false, error: 'Error checking username availability' };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const registerUser = useCallback(async (username: string): Promise<boolean> => {
    setIsChecking(true);
    try {
      const success = await userDB.addUser(username);
      return success;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const updateUserActivity = useCallback(async (username: string): Promise<void> => {
    try {
      await userDB.updateLastSeen(username);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }, []);

  return {
    isChecking,
    checkUsername,
    registerUser,
    updateUserActivity
  };
};