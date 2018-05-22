let url = 'https://api.twitch.tv/kraken/streams/';
let clientId = 'f8alhi36gd25fhrvoxsn2cn30sdrky';

let channel;
let channelList;
let channelListItem;
let removeChannelIcons;
let removeIconContainer;
let channelListItemContainer;

let channelUrls = [];
let localChannelList = [];
let isDoneBtn = false;
let shouldShowAddChannelInput = false;

let footer = document.querySelector('.footer');
let addChannelInput = document.createElement('input');
let inputContainer = document.querySelector('.input-container');
let addChannelInputIcon = document.querySelector('.add-icon');
let closeAddChannelInputIcon = document.querySelector('.close-icon');
let onlineList = document.querySelector('.online');
let offlineList = document.querySelector('.offline');
let removeBtn = document.querySelector('.remove-channels-btn');

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
removeBtn.addEventListener('click', function(e) {
  removeChannelIcons = document.querySelectorAll('.remove-icon');
  removeChannelIcons.forEach(icon => {
    icon.addEventListener('click', removeChannelFromList);
  });

  channelList = document.querySelectorAll('.channel');
  switchRemoveDone(channelList);
});

function getChannelNameIndex(channelName) {
  return localChannelList.indexOf(channelName.toLowerCase());
}

// remove single channel from the list
function removeChannelFromList(e) {
  let childArray = Array.from(e.target.parentElement.childNodes);
  if(childArray[1].classList.contains('channel')) {
    let channelName = childArray[1].firstChild.nextSibling.innerHTML;
    if(localChannelList.includes(channelName.toLowerCase())) {
      localChannelList.splice(localChannelList.indexOf(channelName.toLowerCase()), 1);
      e.target.parentElement.remove();
      loadDataIntoStorage();
    }
  }
}

// when 'remove' is clicked, switch to 'done' and show 'x' icons
// when 'done' is clicked, switch to 'remove' and hide 'x' icons
function switchRemoveDone(channelList) {
  if(!isDoneBtn) {
    removeToDone(channelList);
  } else if(isDoneBtn) {
    doneToRemove(channelList);
  }
}

// 'remove' -> 'done'; display 'x' icons in li
function removeToDone() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Done';
  removeBtn.classList.add('done-btn');

  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'inline-block';
    });
  });
}

// 'done' -> 'remove'; hide 'x' icons in li
function doneToRemove() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Remove';
  removeBtn.classList.remove('done-btn');

  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'none';
    });
  });
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
      loadDataIntoStorage();
    }
  } else if(e.keyCode === 27) {
    hideChannelInput();
  }
}

// list item template
function generateChannelListItem() {
  // channelListItemContainer = document.createElement('span');
  channelListItem = document.createElement('li');
  channelListItem.classList.add('channel-list-item');

  // add 'x' icon to each list item
  removeChannelIcon = document.createElement('a');
  removeChannelIcon.classList.add('remove-icon', 'fa', 'fa-close');
}

// add online channels to online list
function channelOnline(data) {
  generateChannelListItem();

  // 'pubg' is easier to read
  if((data.stream.game).toUpperCase() === 'PLAYERUNKNOWN\'S BATTLEGROUNDS') data.stream.game = 'pubg';
  
  channelListItem.innerHTML = `
    <a href="${data.stream.channel.url}" target="_blank" class="channel">
      <strong class="channel channel-name">${data.stream.channel.display_name}</strong> playing 
      <strong class="channel-game channel">${data.stream.game}</strong>
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
function loadDataIntoStorage() {
  chrome.storage.local.set({"channelList": localChannelList});
}

// TODO: gold-plating: maybe get game cover pics and organize app by game
function fetchGameData() {
  let gameDataUrl = 'https://api-endpoint.igdb.com';
  fetch(gameDataUrl, { headers: { "user-key": "7af87312b398b3ea1c3f0db3770d5c66" }})
  .then(response => response.json())
  .then(data => console.log(data));
}