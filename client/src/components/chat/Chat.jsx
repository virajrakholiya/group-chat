import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import api from '../../utils/axios';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const socketRef = useRef();
  const messagesEndRef = useRef();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await api.get('/messages');
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Connect to socket
    socketRef.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    fetchMessages();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current.emit('message', { content: newMessage });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-black p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Chat Room</h1>
          <div className="flex items-center space-x-4">
            <span className="text-zinc-400">Welcome, {user.username}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
              message.sender._id === user._id 
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-100'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-sm font-medium ${
                  message.sender._id === user._id 
                    ? 'text-zinc-300'
                    : 'text-zinc-500'
                }`}>
                  {message.sender.username}
                </span>
              </div>
              <p className={`text-${message.sender._id === user._id ? 'white' : 'zinc-800'}`}>
                {message.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-zinc-100 bg-white">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-4 rounded-full border border-zinc-200 focus:outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-black text-white rounded-full hover:bg-zinc-800 transition-colors font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat; 