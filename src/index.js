const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users')

const app = express()
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', socket => {
  console.log('new web socket connection')

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room })
    if (error) {
      return callback(error)
    }
    socket.join(user.room)
    socket.emit('message', generateMessage('ADMIN', 'Welcome'))
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('ADMIN', `${user.username.toUpperCase()} has joined`)
      )

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on('sendMessage', (text, callback) => {
    const user = getUser(socket.id)

    const filter = new Filter()
    if (filter.isProfane(text)) {
      return callback('Profanity is not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, text))
    callback('Delivered')
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    )
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(
          'ADMIN',
          `${user.username.toUpperCase()} has left the room`
        )
      )
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('Server is up on port ' + port)
})
