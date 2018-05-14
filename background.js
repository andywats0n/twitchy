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
let removeChannelBtn;
let removeChannelIcon;
let removeIconContainer;
let channelListItemContainer;

// run this to remove all items from storage
// chrome.storage.local.set({"channelList": localChannelList});
chrome.storage.local.get("channelList", loadChannels);

closeAddChannelInputIcon.style.display = 'none';

closeAddChannelInputIcon.addEventListener('click', shouldShowInput);
addChannelInputIcon.addEventListener('click', shouldShowInput);
addChannelInput.addEventListener('keydown', addChannelToList);

removeBtn.addEventListener('click', function() {
  channelList = document.querySelectorAll('.channel');
  switchRemoveDone(channelList);
});

function addChannelIcon(channelList) {
  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'inline-block';
    });
  });
}

function hideChannelIcon(channelList) {
  channelList.forEach(channel => {
    removeIcon = document.querySelectorAll('.remove-icon');
    removeIcon.forEach(icon => {
      icon.style.display = 'none';
    });
  });
}

function removeChannelFromList() {
  channelList = document.querySelectorAll('li');
  removeChannelIcon = document.querySelectorAll('.remove-icon');
  
  removeChannelIcon.forEach(icon => {
    console.log(icon);
    icon.addEventListener('click', function() {
      channelList.forEach((item, index) => {
        // let removeMe = removeChannelIcon.indexOf(index);
        // console.log(removeMe);
        // item.classList.add('hide-item');
      });
    });
  });
}

function switchRemoveDone(channelList) {
  if(!isDoneBtn) {
    addChannelIcon(channelList);
    removeChannelFromList(channelList);
    removeToDone();
  } else if(isDoneBtn) {
    hideChannelIcon(channelList);
    doneToRemove();
  }
}

function removeToDone() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Done';
  removeBtn.classList.add('done-btn');
}

function doneToRemove() {
  isDoneBtn = !isDoneBtn;
  removeBtn.innerHTML = 'Remove';
  removeBtn.classList.remove('done-btn');
}

function shouldShowInput() {
  if(!shouldShowAddChannelInput) {
    showChannelInput();
  } else if(shouldShowAddChannelInput) {
    hideChannelInput();
  }
}

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

function hideChannelInput() {
  shouldShowAddChannelInput = false;
  closeAddChannelInputIcon.style.display = 'none';
  addChannelInputIcon.style.display = 'inline-block';
  addChannelInput.value = '';
  inputContainer.removeChild(addChannelInput);
}

function addChannelToList(e) {
  let channelName = addChannelInput.value;
  if(e.keyCode === 13) {
    hideChannelInput();
    if(!localChannelList.includes(channelName)) {
      localChannelList.push(channelName);
      fetchNewChannel(channelName);
      loadDataIntoStorage();
    }
  } else if(e.keyCode === 27) {
    hideChannelInput();
  }
}

function channelOnline(data) {
  channelListItemContainer = document.createElement('span');
  channelListItem = document.createElement('li');
  channelListItem.classList.add('channel-list-item');

  removeChannelBtn = document.createElement('div');
  removeChannelBtn.classList.add('remove-icon', 'fa', 'fa-close');

  if(data.stream.game === 'PLAYERUNKNOWN\'S BATTLEGROUNDS') data.stream.game = 'pubg';
  
  onlineList.appendChild(channelListItemContainer);
  channelListItemContainer.appendChild(channelListItem);
  channelListItem.innerHTML = `
  <a href="${data.stream.channel.url}" target="_blank">
    <strong class="channel-name">${data.stream.channel.display_name}</strong> playing 
    <strong class="channel-game channel">${data.stream.game}</strong>
  </a>`;
  channelListItem.appendChild(removeChannelBtn);
}

function channelOffline(data) {
  channelListItemContainer = document.createElement('span');
  channelListItem = document.createElement('li');
  channelListItem.classList.add('channel-list-item');

  removeChannelBtn = document.createElement('div');
  removeChannelBtn.classList.add('remove-icon', 'fa', 'fa-close');

  let channelName = data._links.self.replace(url, '');
  
  offlineList.appendChild(channelListItemContainer);
  channelListItemContainer.appendChild(channelListItem);
  channelListItem.innerHTML = `
    <div class="channel offline-channel">
      <strong>${channelName}</strong> is offline
    </div>`;
  channelListItem.appendChild(removeChannelBtn);
  removeChannelBtn.style.display = '15px';
}

function updateChannelUrls() {
  localChannelList.forEach(channel => {
    channelUrls.push(url + channel);
  });
}

function fetchNewChannel(name) {
  let newChannelUrl = url + name;
  fetch(newChannelUrl, { headers: {"Client-ID": clientId }})
  .then(response => response.json())
  .then(data => { data.stream !== null ? channelOnline(data) : channelOffline(data) })
}

function fetchChannels() {
  channelUrls.forEach(channel => {
    fetch(channel, { headers: { "Client-ID": clientId }})
    .then(response => response.json())
    .then(data => { data.stream !== null ? channelOnline(data) : channelOffline(data) })
  });
}

// TODO: Maybe get game pics
function fetchGameData() {
  let gameDataUrl = 'https://api-endpoint.igdb.com';
  fetch(gameDataUrl, { headers: { "user-key": "7af87312b398b3ea1c3f0db3770d5c66" }})
  .then(response => response.json())
  .then(data => console.log(data));
}

function loadChannels(result) {
  localChannelList = result.channelList;
  localChannelList.sort();
  updateChannelUrls();
  fetchChannels();
}

function loadDataIntoStorage() {
  chrome.storage.local.set({"channelList": localChannelList});
}