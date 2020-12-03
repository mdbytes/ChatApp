const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

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

socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
