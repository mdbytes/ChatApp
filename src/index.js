// Core and npm packages used in this applicaiton
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

// Utility packages built for this application
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users')

// Creating an express server and public path
const app = express()
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

/*
The following two lines allow socket.io to share the express server instance as app.  
On the same server, socket.io will handle all websocket requests while express handles any
non websocket requests.
*/
const server = http.createServer(app)
const io = socketio(server)

/*
The io.on(...) holds all of the script for handling websocket connections when they are
made with the server.  On the client side, this is accomplished when the new socket is created
at the top of chat.js.  The protocols here determine how data is handled as it arrives and 
communicated back to clients.  
*/
io.on('connection', socket => {
  console.log('new web socket connection')

  /*
  When users join a room, they are verified, added to the user list, joined to the room
  they selected, where they see a welcome message from ADMIN.  Other users in the room are 
  notified that a new user has joined.  The room user list is updated and sent back to all 
  client users in the room. 
  */
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

  /*
  When users send a message, it is screened for profanity and set to the users in the 
  appropriate room.  A callback confirmed the message is delivered. 
  */
  socket.on('sendMessage', (text, callback) => {
    const user = getUser(socket.id)

    const filter = new Filter()
    if (filter.isProfane(text)) {
      return callback('Profanity is not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, text))
    callback('Delivered')
  })

  /*
  Users can send their location to the group.  Their browser sends the latitutde and longitude 
  which are mapped into a google maps url and returned to the group message stream. 
  */
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

  /*
  When users disconnect from a room a notification is sent to the group message stream.
  */
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
