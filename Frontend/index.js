const socket = io('');

// Login form handling
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const profilePicInput = document.getElementById("profilePic");
const profilePicFileInput = document.getElementById('profilePicFile');
const profilePreview = document.getElementById("profilePreview");
const usernamePreview = document.getElementById("usernamePreview");
const loginPage = document.getElementById("loginPage");
const chatPage = document.getElementById("chatPage");

// Message input handling
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messagesContainer = document.getElementById("messagesContainer");

let currentUser = null;
let currentProfilePic = null;

// Update preview as user types
usernameInput.addEventListener("input", updatePreview);
profilePicInput.addEventListener("input", updatePreview);
profilePicFileInput.addEventListener('change', handleFileInput);

function handleUrlInput() {
    profilePicFileInput.value = '';
    currentProfilePic = profilePicInput.value || null;
    updatePreview();
}

function handleFileInput(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        profilePicInput.value = '';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentProfilePic = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
  const username = usernameInput.value || "Your Name";

  usernamePreview.textContent = username;

  if (currentProfilePic) {
    profilePreview.innerHTML = `<img src="${currentProfilePic}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  } else {
    const initials =
      username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    profilePreview.textContent = initials;
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    const userData = {
      username: username,
      profilePic: currentProfilePic
    };

    currentUser = userData;

    console.log("User data:", userData);

    socket.emit("user-login", userData);

    // Hide login page and show chat page
    loginPage.style.display = "none";
    chatPage.style.display = "flex";
  }
});

// Auto-resize textarea
messageInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// Send message on Enter (but allow Shift+Enter for new lines)
messageInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && currentUser) {
    console.log("Sending message:", message);

    socket.emit('chat message', {
      username: currentUser.username,
      message: message,
      profilePic: currentUser.profilePic,
      timestamp: new Date().toLocaleDateString([], {hour: '2-digit', minute: '2-digit'})
    });

    messageInput.value = "";
    messageInput.style.height = "auto";

  }
}

// Socket event listeners
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Listen for chat messages
socket.on('chat message', (data) => {
  console.log('Received message:', data);
  addMessage(data.username, data.message, data.timestamp, data.profilePic);
});

socket.on('message history', (messages) => {
  messages.forEach(msg => {
    addMessage(msg.username, msg.message, msg.timestamp, msg.profilePic);
  });
});

// Listen for user list updates
socket.on('user list', (users) => {
  console.log('User list updated:', users);
  updateUsersList(users);
});

// Listen for new user joined
socket.on('user joined', (username) => {
  console.log('User joined:', username);
});

// Listen for user left
socket.on('user left', (username) => {
  console.log('User left:', username);
});


function addMessage(username, message, timestamp, profilePic = null) {
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarContent = profilePic
    ? `<img src="${profilePic}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    : initials;

  messageElement.innerHTML = `
                <div class="message-avatar">${avatarContent}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${username}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${message}</div>
                </div>
            `;

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addUser(username, profilePic = null) {

  const existingUser = document.querySelector(`[data-username="${username}"]`);
  if(existingUser) return;

  const userElement = document.createElement("div");
  userElement.className = "user-item";
  userElement.setAttribute("data-username", username);

  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarContent = profilePic
    ? `<img src="${profilePic}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    : initials;

  userElement.innerHTML = `
                <div class="user-avatar">${avatarContent}</div>
                <div class="user-info">
                    <h4>${username}</h4>
                    <span class="user-status">Online</span>
                </div>
            `;

  document.getElementById("usersList").appendChild(userElement);
  updateOnlineCount();
}

function removeUser(username) {
  const userElement = document.querySelector(`[data-username="${username}"]`);
  if (userElement) {
    userElement.remove();
    updateOnlineCount();
  }
}

function updateUsersList(users) {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";
  
  users.forEach(user => {
    addUser(user.username, user.profilePic);
  });
}

function updateOnlineCount() {
  const count = document.querySelectorAll(".user-item").length;
  document.getElementById("onlineCount").textContent = `${count} online user${
    count !== 1 ? "s" : ""
  } `;
}