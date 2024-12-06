const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on('message', async (data) => {
      try {
        const message = await Message.create({
          content: data.content,
          sender: socket.user._id
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username');

        io.emit('message', populatedMessage);
      } catch (error) {
        socket.emit('error', 'Message could not be sent');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { handleSocket };