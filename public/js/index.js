console.log('js.loaded')

const $appDescription = document.querySelector('#app-description')
const $centeredForm = document.querySelector('.centered-form__box')
const $chatNowButton = document.querySelector('#chat-now')

$chatNowButton.addEventListener('click', e => {
  console.log('button clicked')
  $appDescription.style.display = 'none'
  $centeredForm.style.display = 'block'
})
