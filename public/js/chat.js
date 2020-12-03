/*
Filename:    chat.js
Created:     December 3, 2020
By:          Martin Dwyer
Description: This file contains the client side script for a chat applicaiton using socket.io
*/

/*
The socket obect is created by calling io().  Note that the socket script is imported
in chat.html  The creation of this object creates a new socket connection with the 
server.
*/
const socket = io()

// Elements which will be reused are defined here with the $element convention
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates are used with the Mustache to define how messages are passed to chat.html
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options contain only one function parses username and room
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

/*
The autoScroll function is used to scroll the message box after messages are 
sent by the user.  This ensures that new messages appear at the bottom of the 
display after they are entered.  
*/
const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

/*
Sockets are turned on for incoming data labeled as a 'message' or 'locationMessage' 
or roomData.  The following three socket.on(...) methods all receive data back 
from the server and place it appropriately in the message panel.  Note that the messages
are all rendered on the client page using the Mustache library imported as part of
chat.html.
*/
socket.on('message', message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username.toUpperCase(),
    message: message.text,
    createdAt: moment(message.createdAt).format('M/D/YY h:mma')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', message => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username.toUpperCase(),
    url: message.url,
    createdAt: moment(message.createdAt).format('M/D/YY h:mma')
  })

  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

/*
Communication is sent to the server with the socket.emit(...) methods.  There
are three cases that communication is sent from the client to the server; 1. when 
the user first joins a room, 2. when a message is typed and submitted, and 
3. when the user chooses to share their location by submitting the 'send'
'location' button.
*/
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

$messageForm.addEventListener('submit', e => {
  e.preventDefault()
  //disable form
  $messageFormButton.setAttribute('disabled', 'disabled')
  const message = $messageFormInput.value
  $messageFormInput.value = ''
  $messageFormInput.focus()
  socket.emit('sendMessage', message, error => {
    // enable form
    $messageFormButton.removeAttribute('disabled')
    if (error) {
      console.log(error)
    } else {
      console.log('message was delivered')
    }
  })
})

$sendLocationButton.addEventListener('click', e => {
  if (!navigator.geolocation) {
    return alert('Client browser does not support geolocation')
  }
  $sendLocationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        $sendLocationButton.removeAttribute('disabled')
        console.log('location shared')
      }
    )
  })
})
