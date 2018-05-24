const url = 'https://api.twitch.tv/kraken/streams/';
const clientId = 'f8alhi36gd25fhrvoxsn2cn30sdrky';

const addChannelInput = document.createElement('input');
const inputContainer = document.querySelector('.input-container');
const addChannelInputIcon = document.querySelector('.add-icon');
const closeAddChannelInputIcon = document.querySelector('.close-icon');
const onlineList = document.querySelector('.online');
const offlineList = document.querySelector('.offline');
const removeBtn = document.querySelector('.remove-channels-btn');

let channel;
let channelList;
let channelListItem;
let removeChannelIcons;

let channelUrls = [];
let localChannelList = [];
let isEditingChannelList = false;
let shouldShowAddChannelInput = false;

// load channels from local storage
chrome.storage.local.get("channelList", loadChannels);
// hide input box 'x' icon on load
closeAddChannelInputIcon.style.display = 'none';
// when 'plus' icon is clicked, show input box
addChannelInputIcon.addEventListener('click', shouldShowInput);
// on key down, add channel to the list
addChannelInput.addEventListener('keydown', addChannelToList);
// when 'x' is clicked, hide input box
closeAddChannelInputIcon.addEventListener('click', shouldShowInput);
// when 'remove' is clicked, append x's to channel for removing
removeBtn.addEventListener('click', showRemoveChannelIcons);

// loads event listener to show remove icons from list
function showRemoveChannelIcons(e) {
  removeChannelIcons = document.querySelectorAll('.remove-icon');
  removeChannelIcons.forEach(icon => icon.addEventListener('click', removeChannelFromList));
  channelList = document.querySelectorAll('.channel');
  canEditChannelList(channelList);
}

// remove single channel from the list
function removeChannelFromList(e) {
  let channelListItem = e.target.parentElement;
  let childArray = Array.from(e.target.parentElement.childNodes);
  let channelName = (childArray[1].firstChild.nextSibling.innerHTML).toLowerCase();

  if(childArray[1].classList.contains('channel')) {
    if(localChannelList.includes(channelName)) {
      localChannelList.splice(localChannelList.indexOf(channelName), 1);
      channelListItem.remove();
    }
  }
}

// when 'remove' is clicked, switch to 'done' and show 'x' icons
// when 'done' is clicked, switch to 'remove' and hide 'x' icons
function canEditChannelList(channelList) {
  if(!isEditingChannelList) {
    editChannelList(channelList);
  } else if(isEditingChannelList) {
    doneEditChannelList(channelList);
  }
}

// 'remove' -> 'done'; display 'x' icons in li
function editChannelList(channelList) {
  isEditingChannelList = !isEditingChannelList;
  removeBtn.innerHTML = 'Done';
  removeBtn.classList.add('done-btn');

  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'inline-block';
    });
  });
}

// 'done' -> 'remove'; hide 'x' icons in li; set local storage
function doneEditChannelList(channelList) {
  isEditingChannelList = !isEditingChannelList;
  removeBtn.innerHTML = 'Remove';
  removeBtn.classList.remove('done-btn');

  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'none';
    });
  });

  setLocalStorage();
}

// should the add channel input box be shown or hidden
function shouldShowInput() {
  if(!shouldShowAddChannelInput) {
    showChannelInput();
  } else if(shouldShowAddChannelInput) {
    hideChannelInput();
  }
}

// show add channel input box and styling
function showChannelInput() {
  shouldShowAddChannelInput = true;
  addChannelInputIcon.style.display = 'none';
  closeAddChannelInputIcon.style.display = 'inline-block';
  inputContainer.appendChild(addChannelInput);
  inputContainer.style.borderColor = 'purple';
  addChannelInput.focus();
  addChannelInput.style.width = '50%'; 
  addChannelInput.style.fontSize = '14px';
  addChannelInput.setAttribute('placeholder', 'Search');
}

// hide add channel input box
function hideChannelInput() {
  shouldShowAddChannelInput = false;
  closeAddChannelInputIcon.style.display = 'none';
  addChannelInputIcon.style.display = 'inline-block';
  addChannelInput.value = '';
  inputContainer.removeChild(addChannelInput);
}

// when 'enter' is pressed, add channel to the list
function addChannelToList(e) {
  let channelName = addChannelInput.value;
  if(e.keyCode === 13) {
    hideChannelInput();
    // TODO: give user feedback if channel is already in the list
    if(!localChannelList.includes(channelName)) {
      localChannelList.push(channelName.toLowerCase());
      fetchNewChannel(channelName);
      setLocalStorage();
    }
  } else if(e.keyCode === 27) {
    hideChannelInput();
  }
}

// list item template: <li class="channel-list-item"><a class="remove-icon fa fa-close">[ChannelName]</a></li>
function generateChannelListItem() {
  channelListItem = document.createElement('li');
  channelListItem.classList.add('channel-list-item');

  removeChannelIcon = document.createElement('a');
  removeChannelIcon.classList.add('remove-icon', 'fa', 'fa-close');
}

// add online channels to online list
function channelOnline(data) {
  generateChannelListItem();

  // TODO: refactoring into less functions here possible
  // data.stream !== null ? channelOnline(data) : channelOffline(data);

  // 'pubg' is easier to read
  if((data.stream.game).toUpperCase() === 'PLAYERUNKNOWN\'S BATTLEGROUNDS') data.stream.game = 'pubg';
  
  channelListItem.innerHTML = `
    <a href="${data.stream.channel.url}" target="_blank" class="channel">
      <strong class="channel channel-name">${data.stream.channel.display_name}</strong> playing 
      <strong class="channel channel-game">${data.stream.game}</strong>
    </a>`;

  onlineList.appendChild(channelListItem);
  channelListItem.appendChild(removeChannelIcon);
}

// add offline channel to offline list
function channelOffline(data) {
  generateChannelListItem();
  
  // dump channel url data to leave only channel name
  let channelName = data._links.self.replace(url, '');

  channelListItem.innerHTML = `
    <div class="channel offline-channel">
      <strong class="channel-name">${channelName}</strong> is offline
    </div>`;

  offlineList.appendChild(channelListItem);
  channelListItem.appendChild(removeChannelIcon);
}

// concat urls with channel names to be fetched
function updateChannelUrls() {
  localChannelList.forEach(channel => {
    channelUrls.push(url + channel);
  });
}

// fetch single channel and determine if online or offline
// TODO: handle response errors
function fetchNewChannel(name) {
  let newChannelUrl = url + name;
  fetch(newChannelUrl, { headers: {"Client-ID": clientId }})
  .then(response => response.json())
  .then(data => { data.stream !== null ? channelOnline(data) : channelOffline(data) })
}

// fetch channel data and determine if online or offline
// TODO: handle response errors
function fetchChannels() {
  channelUrls.forEach(channel => {
    fetch(channel, { headers: { "Client-ID": clientId }})
    .then(response => response.json())
    .then(data => { data.stream !== null ? channelOnline(data) : channelOffline(data) })
  });
}

// update url's and fetch data from twitch
function loadChannels(result) {
  localChannelList = result.channelList;
  updateChannelUrls();
  fetchChannels();
}

// set local storage to array of channel names
function setLocalStorage() {
  chrome.storage.local.set({"channelList": localChannelList});
}

// TODO: gold-plating: maybe get game cover pics and organize app by game
function fetchGameData() {
  let gameDataUrl = 'https://api-endpoint.igdb.com';
  fetch(gameDataUrl, { headers: { "user-key": "7af87312b398b3ea1c3f0db3770d5c66" }})
  .then(response => response.json())
  .then(data => console.log(data));
}