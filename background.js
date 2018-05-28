const removeBtn = document.querySelector('.remove-channels-btn');
const closeAddChannelInputIcon = document.querySelector('.close-icon');
const addChannelInputIcon = document.querySelector('.add-icon');
const addChannelInputContainer = document.querySelector('.input-container');
const addChannelInput = document.createElement('input');
const addChannelText = document.querySelector('.add-channel-text');
const offlineList = document.querySelector('.offline');
const onlineList = document.querySelector('.online');

const url = 'https://api.twitch.tv/kraken/streams/';
const clientId = 'f8alhi36gd25fhrvoxsn2cn30sdrky';

let shouldShowAddChannelInput = false;
let isEditingChannelList = false;
let localChannelList = [];
let channelUrls = [];

let removeChannelIcons;
let channelListItem;
let channelList;
let channel;

// load channels from local storage
chrome.storage.local.get("channelList", loadChannels);
// hide input box 'x' icon on load
closeAddChannelInputIcon.style.display = 'none';
// when 'plus' icon or 'add channel' text is clicked, show input box
addChannelInputIcon.addEventListener('click', shouldShowInput);
addChannelText.addEventListener('click', shouldShowInput);
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
  console.log(channelList);
  canEditChannelList(channelList);
}

// remove single channel from the list
function removeChannelFromList(e) {
  let channelListItem = e.target.parentElement;
  let childArray = Array.from(e.target.parentElement.childNodes);
  let channelName = (childArray[1].firstChild.nextSibling.innerHTML).toLowerCase();

  if(childArray[1].classList.contains('channel') && localChannelList.includes(channelName)) {
    localChannelList.splice(localChannelList.indexOf(channelName), 1);
    channelListItem.remove();
  }
}

function canEditChannelList(channelList) {
  if(!isEditingChannelList) {
    // when 'remove' is clicked, switch to 'done' and show 'x' icons
    editChannelList(channelList);
  } else if(isEditingChannelList) {
    // when 'done' is clicked, switch to 'remove' and hide 'x' icons
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
  addChannelText.style.display = 'none';
  closeAddChannelInputIcon.style.display = 'inline-block';
  addChannelInput.setAttribute('placeholder', 'Press enter to add');
  addChannelInputContainer.appendChild(addChannelInput);
  addChannelInput.focus();
}

// hide add channel input box
function hideChannelInput() {
  shouldShowAddChannelInput = false;
  addChannelInputIcon.style.display = 'inline-block';
  addChannelText.style.display = 'inline-block';
  closeAddChannelInputIcon.style.display = 'none';
  addChannelInputContainer.removeChild(addChannelInput);
  addChannelInput.value = '';
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

function addChannel(data) {
  channelListItem = document.createElement('li');
  removeChannelIcon = document.createElement('a');
  channelListItem.classList.add('channel-list-item');
  removeChannelIcon.classList.add('remove-icon', 'fa', 'fa-close');

  // if stream is not null, add to online list, otherwise add to offline list
  if(data.stream !== null) {
    if((data.stream.game).toLowerCase() === 'playerunknown\'s battlegrounds') data.stream.game = 'PUBG';
    if((data.stream.game).toLowerCase() === 'world of warcraft') data.stream.game = 'WoW';
    channelListItem.innerHTML = `
      <a class="channel" href="${data.stream.channel.url}" target="_blank">
        <strong class="channel-name">${data.stream.channel.display_name}</strong> playing 
        <strong class="channel-game">${data.stream.game}</strong><span class="viewers"> for <span class="viewer-count">${data.stream.viewers}</span> viewers</span>
      </a>`;
    onlineList.appendChild(channelListItem);
    channelListItem.appendChild(removeChannelIcon);
  } else {
    let channelName = data._links.self.replace(url, '');
    channelListItem.innerHTML = `
      <div class="channel">
        <strong class="channel-name">${channelName}</strong><span class="offline-text"> is offline</span>
      </div>`;
    offlineList.appendChild(channelListItem);
    channelListItem.appendChild(removeChannelIcon);
  }
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
  .then(data => addChannel(data));
}

// fetch channel data and determine if online or offline
// TODO: handle response errors
function fetchChannels() {
  channelUrls.forEach(channel => {
    fetch(channel, { headers: { "Client-ID": clientId }})
    .then(response => response.json())
    .then(data => addChannel(data));
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
  let extraGameDataUrl = 'https://api-endpoint.igdb.com';
  fetch(extraGameDataUrl, { headers: { "user-key": "7af87312b398b3ea1c3f0db3770d5c66" }})
  .then(response => response.json())
  .then(data => console.log(data));
}