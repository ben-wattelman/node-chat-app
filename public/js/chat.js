const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $geolocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
   //New message element
   const $newMessage = $messages.lastElementChild;

   //Height of last new message
   const newMessageStyles = getComputedStyle($newMessage);
   const newMessageMargin = parseInt(newMessageStyles.marginBottom);
   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

   //Visible height
   const visibleHeight = $messages.offsetHeight;

   //Height of messages container
   const containerHeight = $messages.scrollHeight;

   //How far have I scrolled?
   const scrollOffset = $messages.scrollTop + visibleHeight;

   if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight;
   }
   return;
};


socket.on('message', msg => {
   console.log(msg);
   const html = Mustache.render(messageTemplate, {
      username: msg.username,
      message: msg.text,
      createdAt: moment(msg.createdAt).format("HH:mm")
   });
   $messages.insertAdjacentHTML('beforeend', html);
   autoScroll();
});

socket.on('locationMessage', message => {
   console.log(message);
   const html = Mustache.render(locationTemplate, {
      username: message.username,
      location: message.url,
      createdAt: moment(message.createdAt).format("HH:mm")
   });
   $messages.insertAdjacentHTML('beforeend', html);
   autoScroll();
});

socket.on('roomData', ({ room, users }) => {
   const html = Mustache.render(sidebarTemplate, {
      room,
      users
   });
   document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit',event => {
   event.preventDefault();

   $messageFormButton.setAttribute('disabled', 'disabled')

   const message = event.target.elements.message.value;
   socket.emit('sendMessage', message, (error)=> {
      $messageFormButton.removeAttribute('disabled');
      $messageFormInput.value = '';
      $messageFormInput.focus();

      if (error) {
         return console.log(error);
      }
      console.log("The message was delivered!");
   });
});

$geolocationButton.addEventListener('click', ()=> {
   if(!navigator.geolocation) {
      return alert('Geolocation not supported by your browser');
   }

   $geolocationButton.setAttribute('disabled', 'disabled')


   navigator.geolocation.getCurrentPosition((position)=> {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      socket.emit('sendLocation', {latitude, longitude}, () => {
         $geolocationButton.removeAttribute('disabled');
         console.log("Location shared!");
      });
   });
});

socket.emit('join', {username, room}, (error) => {
   if (error) {
      alert(error);
      location.href = '/';
   }
});