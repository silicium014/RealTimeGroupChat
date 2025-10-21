import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Message {
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

const users = new Map<string, User>();
const messages: Message[] = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_join', (username: string) => {
        // Проверяем нет ли уже пользователя с таким именем онлайн
        const existingUser = Array.from(users.values()).find(
            user => user.username === username && user.isOnline
        );
        
        if (existingUser) {
            socket.emit('username_taken', 'This username is already in use');
            return;
        }

        const user: User = {
            id: socket.id,
            username,
            isOnline: true
        };
        
        users.set(socket.id, user);
        
        socket.broadcast.emit('user_joined', user);
        socket.emit('users_list', Array.from(users.values()));
        socket.emit('messages_history', messages);
        
        io.emit('users_update', Array.from(users.values()));
    });

  socket.on('send_message', (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    messages.push(message);
    
    if (messages.length > 1000) {
      messages.shift();
    }
    
    io.emit('new_message', message);
  });

  socket.on('typing_start', (username: string) => {
    socket.broadcast.emit('user_typing', username);
  });

  socket.on('typing_stop', (username: string) => {
    socket.broadcast.emit('user_stop_typing', username);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      
      socket.broadcast.emit('user_left', user);
      users.delete(socket.id);
      io.emit('users_update', Array.from(users.values()));
    }
    
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});