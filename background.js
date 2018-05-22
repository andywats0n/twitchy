let url = 'https://api.twitch.tv/kraken/streams/';
let clientId = 'f8alhi36gd25fhrvoxsn2cn30sdrky';

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

let channel;
let channelListItem;
let removeChannelIcon;
let removeIconContainer;
let channelListItemContainer;

// run this to remove all items from storage
// chrome.storage.local.set({"channelList": localChannelList});

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
removeBtn.addEventListener('click', function() {
  channelList = document.querySelectorAll('.channel');
  switchRemoveDone(channelList);
});

// query channel list items and display 'x' icon
function addChannelIcon(channelList) {
  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'inline-block';
    });
  });
}

// query channel list and hide 'x' icon
function hideChannelIcon(channelList) {
  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'none';
    });
  });
}

// remove single channel from the list
function removeChannelFromList() {
  channelList = document.querySelectorAll('li');
  removeChannelIcon = document.querySelectorAll('.remove-icon');
  
  removeChannelIcon.forEach(icon => {
    icon.addEventListener('click', function() {
      channelList.forEach((item, index) => {
        // let removeMe = removeChannelIcon.indexOf(index);
        // console.log(removeMe);
        // item.classList.add('hide-item');
      });
    });
  });
}

// when 'remove' is clicked, switch to 'done' and show 'x' icons
// when 'done' is clicked, switch to 'remove' and hide 'x' icons
function switchRemoveDone(channelList) {
  if(!isDoneBtn) {
    addChannelIcon(channelList);
    removeChannelFromList(channelList); // this should go somewhere else...
    removeToDone();
  } else if(isDoneBtn) {
    hideChannelIcon(channelList);
    doneToRemove();
  }
}

// doesn't need to be a separate function
function removeToDone() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Done';
  removeBtn.classList.add('done-btn');
}

// doesn't need to be a separate function
function doneToRemove() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Remove';
  removeBtn.classList.remove('done-btn');
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
      localChannelList.push(channelName);
      fetchNewChannel(channelName);
      loadDataIntoStorage();
    }
  } else if(e.keyCode === 27) {
    hideChannelInput();
  }
}

// what every list item will look like
function generateChannelListItem() {
  channelListItemContainer = document.createElement('span');
  channelListItem = document.createElement('li');
  channelListItem.classList.add('channel-list-item');

  // add 'x' icon to each list item
  removeChannelIcon = document.createElement('div');
  removeChannelIcon.classList.add('remove-icon', 'fa', 'fa-close');
}

// add online channels to online list
function channelOnline(data) {
  generateChannelListItem();

  // 'pubg' is easier to read
  if((data.stream.game).toUpperCase() === 'PLAYERUNKNOWN\'S BATTLEGROUNDS') data.stream.game = 'pubg';
  
  onlineList.appendChild(channelListItemContainer);
  channelListItemContainer.appendChild(channelListItem);
  channelListItem.innerHTML = `
  <a href="${data.stream.channel.url}" target="_blank">
    <strong class="channel-name">${data.stream.channel.display_name}</strong> playing 
    <strong class="channel-game channel">${data.stream.game}</strong>
  </a>`;
  channelListItem.appendChild(removeChannelIcon);
}

// add offline channel to offline list
function channelOffline(data) {
  generateChannelListItem();
  
  // dump channel url data to leave only channel name
  let channelName = data._links.self.replace(url, '');

  offlineList.appendChild(channelListItemContainer);
  channelListItemContainer.appendChild(channelListItem);
  channelListItem.innerHTML = `
    <div class="channel offline-channel">
      <strong>${channelName}</strong> is offline
    </div>`;
  channelListItem.appendChild(removeChannelIcon);
  removeChannelIcon.style.display = '15px';
}

// concat urls with channel names to be fetched
function updateChannelUrls() {
  localChannelList.forEach(channel => {
    channelUrls.push(url + channel);
  });
}

// fetch single channel and determine if online or offline
function fetchNewChannel(name) {
  let newChannelUrl = url + name;
  fetch(newChannelUrl, { headers: {"Client-ID": clientId }})
  .then(response => response.json())
  .then(data => { data.stream !== null ? channelOnline(data) : channelOffline(data) })
}

// fetch channel data and determine if online or offline
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

// TODO: Maybe get game cover pics from here
function fetchGameData() {
  let gameDataUrl = 'https://api-endpoint.igdb.com';
  fetch(gameDataUrl, { headers: { "user-key": "7af87312b398b3ea1c3f0db3770d5c66" }})
  .then(response => response.json())
  .then(data => console.log(data));
}