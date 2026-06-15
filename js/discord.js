const STORAGE_USER = "discordRemakeUserId";
const STORAGE_SESSION = "discordRemakeSession";
const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

const els = {
  authScreen: document.querySelector("#authScreen"),
  apiBanner: document.querySelector("#apiBanner"),
  app: document.querySelector("#app"),
  authForm: document.querySelector("#authForm"),
  authUsername: document.querySelector("#authUsername"),
  authDisplayName: document.querySelector("#authDisplayName"),
  displayNameField: document.querySelector("#displayNameField"),
  authError: document.querySelector("#authError"),
  authModeLogin: document.querySelector("#authModeLogin"),
  authModeRegister: document.querySelector("#authModeRegister"),
  authSubmit: document.querySelector("#authSubmit"),
  guildList: document.querySelector("#guildList"),
  homeBtn: document.querySelector("#homeBtn"),
  createServerBtn: document.querySelector("#createServerBtn"),
  serverName: document.querySelector("#serverName"),
  channelScroll: document.querySelector("#channelScroll"),
  channelName: document.querySelector("#channelName"),
  channelTopic: document.querySelector("#channelTopic"),
  chatArea: document.querySelector("#chatArea"),
  voiceChannelView: document.querySelector("#voiceChannelView"),
  voiceChannelTitle: document.querySelector("#voiceChannelTitle"),
  voiceChannelDesc: document.querySelector("#voiceChannelDesc"),
  voiceMembers: document.querySelector("#voiceMembers"),
  createCategoryBtn: document.querySelector("#createCategoryBtn"),
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  messageFileInput: document.querySelector("#messageFileInput"),
  attachFileBtn: document.querySelector("#attachFileBtn"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  typingBar: document.querySelector("#typingBar"),
  typingText: document.querySelector("#typingText"),
  onlineMembers: document.querySelector("#onlineMembers"),
  allMembers: document.querySelector("#allMembers"),
  onlineCount: document.querySelector("#onlineCount"),
  memberCount: document.querySelector("#memberCount"),
  panelAvatar: document.querySelector("#panelAvatar"),
  panelStatusDot: document.querySelector("#panelStatusDot"),
  panelDisplayName: document.querySelector("#panelDisplayName"),
  panelUsername: document.querySelector("#panelUsername"),
  openProfileBtn: document.querySelector("#openProfileBtn"),
  settingsBtn: document.querySelector("#settingsBtn"),
  createChannelBtn: null,
  createServerModal: document.querySelector("#createServerModal"),
  createServerForm: document.querySelector("#createServerForm"),
  serverNameInput: document.querySelector("#serverNameInput"),
  serverIconInput: document.querySelector("#serverIconInput"),
  serverIconPreview: document.querySelector("#serverIconPreview"),
  createChannelModal: document.querySelector("#createChannelModal"),
  createChannelForm: document.querySelector("#createChannelForm"),
  channelNameInput: document.querySelector("#channelNameInput"),
  channelCategorySelect: document.querySelector("#channelCategorySelect"),
  channelCategoryField: document.querySelector("#channelCategoryField"),
  channelTopicField: document.querySelector("#channelTopicField"),
  channelTopicInput: document.querySelector("#channelTopicInput"),
  channelCategoryId: document.querySelector("#channelCategoryId"),
  channelTypePicker: document.querySelector("#channelTypePicker"),
  createChannelModalTitle: document.querySelector("#createChannelModalTitle"),
  createChannelSubmit: document.querySelector("#createChannelSubmit"),
  channelNameLabel: document.querySelector("#channelNameLabel"),
  joinServerModal: document.querySelector("#joinServerModal"),
  joinServerForm: document.querySelector("#joinServerForm"),
  joinServerInput: document.querySelector("#joinServerInput"),
  profileModal: document.querySelector("#profileModal"),
  profileForm: document.querySelector("#profileForm"),
  profileBanner: document.querySelector("#profileBanner"),
  profileBannerImg: document.querySelector("#profileBannerImg"),
  profileAvatar: document.querySelector("#profileAvatar"),
  profileDisplayName: document.querySelector("#profileDisplayName"),
  profileBio: document.querySelector("#profileBio"),
  profileAccent: document.querySelector("#profileAccent"),
  profileAvatarInput: document.querySelector("#profileAvatarInput"),
  profileBannerInput: document.querySelector("#profileBannerInput"),
  profileStatusSelect: document.querySelector("#profileStatusSelect"),
  profileStatusDot: document.querySelector("#profileStatusDot"),
  profileStatusTrigger: document.querySelector("#profileStatusTrigger"),
  profileStatusTriggerDot: document.querySelector("#profileStatusTriggerDot"),
  profileStatusLabel: document.querySelector("#profileStatusLabel"),
  profileStatusMenu: document.querySelector("#profileStatusMenu"),
  profileColorSwatches: document.querySelector("#profileColorSwatches"),
  profileBioCount: document.querySelector("#profileBioCount"),
  profileBannerZone: document.querySelector("#profileBannerZone"),
  profileAvatarZone: document.querySelector("#profileAvatarZone"),
  profileStatusPicker: document.querySelector("#profileStatusPicker"),
  profileSaveBtn: document.querySelector("#profileSaveBtn"),
  userPopout: document.querySelector("#userPopout"),
  popoutBanner: document.querySelector("#popoutBanner"),
  popoutBannerImg: document.querySelector("#popoutBannerImg"),
  popoutAvatar: document.querySelector("#popoutAvatar"),
  popoutStatus: document.querySelector("#popoutStatus"),
  popoutName: document.querySelector("#popoutName"),
  popoutHandle: document.querySelector("#popoutHandle"),
  popoutBio: document.querySelector("#popoutBio"),
  inviteBtn: document.querySelector("#inviteBtn"),
  toggleMembersBtn: document.querySelector("#toggleMembersBtn"),
  memberSidebar: document.querySelector("#memberSidebar"),
  serverMenuBtn: document.querySelector("#serverMenuBtn"),
  homeView: document.querySelector("#homeView"),
  homeSidebar: document.querySelector("#homeSidebar"),
  serverSidebar: document.querySelector("#serverSidebar"),
  homeGreeting: document.querySelector("#homeGreeting"),
  homeAvatar: document.querySelector("#homeAvatar"),
  homeServersGrid: document.querySelector("#homeServersGrid"),
  homeEmpty: document.querySelector("#homeEmpty"),
  homeCreateBtn: document.querySelector("#homeCreateBtn"),
  homeJoinBtn: document.querySelector("#homeJoinBtn"),
  homeCardCreate: document.querySelector("#homeCardCreate"),
  homeCardJoin: document.querySelector("#homeCardJoin"),
  friendsList: document.querySelector("#friendsList"),
  dmsList: document.querySelector("#dmsList"),
  friendsCount: document.querySelector("#friendsCount"),
  homeFriendsGrid: document.querySelector("#homeFriendsGrid"),
  homeAddFriendBtn: document.querySelector("#homeAddFriendBtn"),
  addFriendBtn: document.querySelector("#addFriendBtn"),
  addFriendModal: document.querySelector("#addFriendModal"),
  addFriendForm: document.querySelector("#addFriendForm"),
  addFriendInput: document.querySelector("#addFriendInput"),
  chatHeaderHash: document.querySelector("#chatHeaderHash"),
  chatHeaderAvatar: document.querySelector("#chatHeaderAvatar"),
  dmProfileBtn: document.querySelector("#dmProfileBtn"),
  popoutActions: document.querySelector("#popoutActions"),
  popoutMessageBtn: document.querySelector("#popoutMessageBtn"),
  popoutAddFriendBtn: document.querySelector("#popoutAddFriendBtn"),
};

let socket = null;
let currentUser = null;
let servers = [];
let currentServer = null;
let currentChannel = null;
let currentChannels = [];
let onlineUsers = [];
let serverMembers = [];
let pendingServerIcon = null;
let typingPingTimer = null;
let lastTypingPing = 0;

let pollTimer = null;
let lastMessageTime = 0;
let knownMessageIds = new Set();
let viewMode = "home";
let friends = [];
let dmConversations = [];
let currentDmUser = null;
let popoutUser = null;
let pendingProfileAvatar = null;
let pendingProfileBanner = null;
let pendingAttachments = [];

const POLL_MS = 600;
const API_TIMEOUT_MS = 8000;
const GROUP_WINDOW_MS = 420000;

function persistSession(res) {
  if (!res?.user?.id) return;
  localStorage.setItem(STORAGE_USER, res.user.id);
  localStorage.setItem(
    STORAGE_SESSION,
    JSON.stringify({
      userId: res.user.id,
      user: res.user,
      servers: res.servers || [],
      savedAt: Date.now(),
    }),
  );
}

function readSessionCache() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!isValidUserId(data?.userId) || !data?.user) return null;
    return data;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_SESSION);
}

function showLogin(message = "") {
  currentUser = null;
  servers = [];
  friends = [];
  dmConversations = [];
  stopMessagePolling();
  els.app?.classList.add("hidden");
  els.authScreen?.classList.remove("hidden");
  if (message) showError(message);
}

function showApiBanner(text) {
  if (!els.apiBanner) return;
  if (!text) {
    els.apiBanner.classList.add("hidden");
    els.apiBanner.textContent = "";
    return;
  }
  els.apiBanner.textContent = text;
  els.apiBanner.classList.remove("hidden");
}

async function checkApiHealth() {
  const res = await apiGet("health");
  if (!res?.ok) {
    showApiBanner("API offline — upload the api/ folder and set data/ permissions to 775.");
    return false;
  }
  showApiBanner("");
  return true;
}

function isValidUserId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
}

function avatarSrc(user) {
  return user?.avatar || DEFAULT_AVATAR;
}

function statusClass(status) {
  return `status-${status || "online"}`;
}

let pendingCreateCategoryId = null;

function isServerOwner() {
  return currentServer && currentUser && currentServer.ownerId === currentUser.id;
}

function channelIcon(type) {
  if (type === "voice") return "🔊";
  if (type === "announcement") return "📢";
  return "#";
}

function organizeChannelGroups(channels) {
  const categories = channels.filter((c) => c.type === "category");
  const children = channels.filter((c) => c.type !== "category");
  const sortByPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0);

  if (!categories.length) {
    const loose = children.sort(sortByPosition);
    if (!loose.length) return [];
    return [{ category: null, label: "Channels", channels: loose }];
  }

  const groups = categories.sort(sortByPosition).map((category) => ({
    category,
    label: category.name,
    channels: children.filter((c) => c.categoryId === category.id).sort(sortByPosition),
  }));

  const uncategorized = children.filter((c) => !c.categoryId).sort(sortByPosition);
  if (uncategorized.length) {
    groups.push({ category: null, label: "Other", channels: uncategorized });
  }
  return groups;
}

function firstJoinableChannel(channels) {
  return (
    channels.find((c) => c.type === "text") ||
    channels.find((c) => c.type === "announcement") ||
    channels.find((c) => c.type === "voice") ||
    null
  );
}

function populateCategorySelect() {
  if (!els.channelCategorySelect) return;
  const categories = currentChannels.filter((c) => c.type === "category");
  els.channelCategorySelect.innerHTML = "";
  if (!categories.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No category";
    els.channelCategorySelect.append(opt);
    return;
  }
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    els.channelCategorySelect.append(opt);
  });
  if (pendingCreateCategoryId) {
    els.channelCategorySelect.value = pendingCreateCategoryId;
  }
}

function syncChannelTypeForm() {
  const type = els.channelTypePicker?.querySelector('input[name="channelType"]:checked')?.value || "text";
  const isCategory = type === "category";
  const isTextLike = type === "text" || type === "announcement";

  if (els.createChannelModalTitle) {
    els.createChannelModalTitle.textContent = isCategory ? "Create Category" : "Create Channel";
  }
  if (els.createChannelSubmit) {
    els.createChannelSubmit.textContent = isCategory ? "Create Category" : "Create Channel";
  }
  if (els.channelNameLabel) {
    els.channelNameLabel.textContent = isCategory ? "CATEGORY NAME" : "CHANNEL NAME";
  }
  if (els.channelNameInput) {
    els.channelNameInput.placeholder = isCategory ? "Gaming" : "new-channel";
  }
  els.channelCategoryField?.classList.toggle("hidden", isCategory);
  els.channelTopicField?.classList.toggle("hidden", !isTextLike);
}

function openCreateChannelModal(categoryId = null, defaultType = "text") {
  if (!currentServer) {
    Toast.info("Select a server first.");
    return;
  }
  if (!isServerOwner()) {
    Toast.error("Only the server owner can create channels.");
    return;
  }
  pendingCreateCategoryId = categoryId;
  populateCategorySelect();
  if (categoryId && els.channelCategorySelect) {
    els.channelCategorySelect.value = categoryId;
  }
  const radio = els.channelTypePicker?.querySelector(`input[value="${defaultType}"]`);
  if (radio) radio.checked = true;
  syncChannelTypeForm();
  els.createChannelModal?.showModal();
}

function updateChannelLayout(channel) {
  const isVoice = channel?.type === "voice";
  els.chatArea?.classList.toggle("chat-area--voice", isVoice);
  els.voiceChannelView?.classList.toggle("hidden", !isVoice);
  els.messages?.classList.toggle("hidden", isVoice);

  if (els.chatHeaderHash) {
    els.chatHeaderHash.textContent = channelIcon(channel?.type || "text");
    els.chatHeaderHash.classList.toggle("hidden", false);
  }
}

function renderVoiceView(channel, members) {
  if (!els.voiceChannelView) return;
  if (els.voiceChannelTitle) els.voiceChannelTitle.textContent = channel.name;
  if (els.voiceChannelDesc) {
    els.voiceChannelDesc.textContent = "Voice chat is connected. Audio streaming coming soon.";
  }
  if (!els.voiceMembers) return;
  els.voiceMembers.innerHTML = "";
  (members || []).slice(0, 12).forEach((user) => {
    const card = document.createElement("div");
    card.className = "voice-member";
    card.innerHTML = `<img src="${avatarSrc(user)}" alt="" /><span>${user.displayName}</span>`;
    els.voiceMembers.append(card);
  });
}

function resolveMemberStatus(user) {
  if (!user) return "offline";
  const status = user.id === currentUser?.id ? (currentUser?.status || "online") : (user.status || "online");
  if (status === "offline") return "offline";
  if (socket?.connected && onlineUsers.length) {
    return onlineUsers.some((u) => u.id === user.id) ? status : "offline";
  }
  return status;
}

function showError(text) {
  els.authError.textContent = text || "";
  els.authError.hidden = !text;
}

function setAuthLoading(loading) {
  if (els.authSubmit) {
    els.authSubmit.disabled = loading;
    els.authSubmit.textContent = loading ? "Saving…" : "Continue";
  }
}

async function apiPost(path, body = {}) {
  const url = `api/${path}.php`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, error: `Server returned invalid response (${response.status}).` };
    }
    if (!data.ok && !data.error) {
      data.error = `Request failed (${response.status})`;
    }
    if (!data.ok && data.error?.toLowerCase().includes("not authenticated") && currentUser) {
      clearSession();
      showLogin("Session expired — please log in again.");
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") return { ok: false, error: "Request timed out. Try again." };
    return { ok: false, error: "Cannot reach API. Check that api/ is uploaded." };
  }
}

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `api/${path}.php${qs ? `?${qs}` : ""}`;
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok && !data.error) {
      return { ok: false, error: data.error || `Request failed (${response.status})` };
    }
    return data;
  } catch {
    return { ok: false, error: "Cannot reach API." };
  }
}

function emitAsync(event, payload, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, error: "Not connected to chat server. Refresh the page." });
      return;
    }
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, error: "Request timed out. Refresh and try again." });
    }, timeoutMs);
    socket.emit(event, payload, (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result || { ok: false, error: "No response from server." });
    });
  });
}

function getAuthMode() {
  return els.authModeRegister?.checked ? "register" : "login";
}

function initSocket() {
  if (typeof io === "undefined") return null;
  if (socket) return socket;
  try {
    socket = io({ transports: ["websocket", "polling"], reconnection: true });
    wireSocketEvents();
  } catch {
    socket = null;
  }
  return socket;
}

async function ensureSocketConnected() {
  initSocket();
  if (!socket) return false;
  if (socket.connected) return true;
  return new Promise((resolve) => {
    const onConnect = () => {
      cleanup();
      resolve(true);
    };
    const onError = () => {
      cleanup();
      resolve(false);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 10000);
    function cleanup() {
      clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    }
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
  });
}

async function attachSocketSession(userId) {
  const connected = await ensureSocketConnected();
  if (!connected || !userId) return;
  await emitAsync("auth:restore", { userId });
}

function stopMessagePolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (els.typingBar) els.typingBar.hidden = true;
  clearPendingAttachments();
}

function formatMessageTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLastMessageGroup() {
  const groups = els.messages?.querySelectorAll(".message-group");
  return groups?.length ? groups[groups.length - 1] : null;
}

function canGroupWithLast(message, lastGroup) {
  if (!lastGroup || !message?.authorId) return false;
  const authorId = lastGroup.dataset.authorId;
  const lastTime = parseInt(lastGroup.dataset.timestamp, 10) || 0;
  return authorId === message.authorId && message.timestamp - lastTime < GROUP_WINDOW_MS;
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(att) {
  return att?.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(att?.name || att?.url || "");
}

function createAttachmentsEl(attachments) {
  const wrap = document.createElement("div");
  wrap.className = "message-attachments";
  attachments.forEach((att) => {
    if (isImageAttachment(att)) {
      const link = document.createElement("a");
      link.href = att.url;
      link.target = "_blank";
      link.rel = "noopener";
      const img = document.createElement("img");
      img.className = "message-attachment-img";
      img.src = att.url;
      img.alt = att.name || "attachment";
      link.append(img);
      wrap.append(link);
    } else {
      const link = document.createElement("a");
      link.className = "message-attachment-file";
      link.href = att.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.innerHTML = `<span class="message-attachment-file__icon">📎</span><span class="message-attachment-file__info"><strong>${att.name || "File"}</strong><span>${formatFileSize(att.size)}</span></span>`;
      wrap.append(link);
    }
  });
  return wrap;
}

function createMessageBlock(message) {
  const wrap = document.createElement("div");
  wrap.className = "message-block";
  wrap.dataset.msgId = message.id;

  if (message.content) {
    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = message.content;
    wrap.append(content);
  }
  if (message.attachments?.length) {
    wrap.append(createAttachmentsEl(message.attachments));
  }
  return wrap;
}

function createMessageGroup(message) {
  const group = document.createElement("article");
  group.className = "message-group";
  group.dataset.authorId = message.authorId;
  group.dataset.timestamp = String(message.timestamp);

  const avatar = document.createElement("img");
  avatar.className = "message-avatar";
  avatar.src = avatarSrc(message.author);
  avatar.alt = message.author?.displayName || "User";
  avatar.addEventListener("click", () => openUserPopout(message.author));

  const body = document.createElement("div");
  body.className = "message-body";

  const header = document.createElement("div");
  header.className = "message-header";
  const author = document.createElement("span");
  author.className = "message-author";
  author.textContent = message.author?.displayName || "Unknown";
  author.style.color = message.author?.accentColor || "inherit";
  author.addEventListener("click", () => openUserPopout(message.author));
  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatMessageTime(message.timestamp);
  header.append(author, time);
  body.append(header, createMessageBlock(message));

  group.append(avatar, body);
  return group;
}

function scrollMessagesToBottom() {
  if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
}

function startMessagePolling() {
  stopMessagePolling();
  pollMessagesNow();
  pollTimer = setInterval(pollMessagesNow, POLL_MS);
}

async function pollMessagesNow() {
  if (!currentChannel) return;
  const params = {
    channelId: currentChannel.id,
    since: String(lastMessageTime),
  };
  if (currentUser?.id) params.userId = currentUser.id;
  const res = await apiGet("messages/poll", params);
  if (res?.ok && Array.isArray(res.messages)) {
    res.messages.forEach((msg) => {
      if (knownMessageIds.has(msg.id)) return;
      knownMessageIds.add(msg.id);
      lastMessageTime = Math.max(lastMessageTime, msg.timestamp || 0);
      appendMessage(msg);
    });
  }
  pollTypingNow();
}

async function pollTypingNow() {
  if (!currentChannel || !currentUser) return;
  const res = await apiGet("typing/poll", {
    channelId: currentChannel.id,
    userId: currentUser.id,
  });
  if (res?.ok) updateTypingBar(res.users || []);
}

function updateTypingBar(users) {
  if (!els.typingBar) return;
  if (!users?.length) {
    els.typingBar.hidden = true;
    return;
  }
  els.typingBar.hidden = false;
  if (users.length === 1) {
    els.typingText.textContent = `${users[0].displayName} is typing…`;
  } else if (users.length === 2) {
    els.typingText.textContent = `${users[0].displayName} and ${users[1].displayName} are typing…`;
  } else {
    els.typingText.textContent = `${users.length} people are typing…`;
  }
}

async function pingTyping() {
  if (!currentChannel || !currentUser) return;
  const now = Date.now();
  if (now - lastTypingPing < 1500) return;
  lastTypingPing = now;
  await apiPost("typing/ping", { channelId: currentChannel.id, userId: currentUser.id });
}

function trackMessages(messages) {
  knownMessageIds.clear();
  lastMessageTime = 0;
  (messages || []).forEach((msg) => {
    knownMessageIds.add(msg.id);
    lastMessageTime = Math.max(lastMessageTime, msg.timestamp || 0);
  });
}

function showApp() {
  els.authScreen.classList.add("hidden");
  els.app.classList.remove("hidden");
}

function enterApp(res) {
  currentUser = res.user;
  servers = res.servers || [];
  persistSession(res);
  showApp();
  updateUserPanel();
  renderGuilds();
  initSocket();
  loadFriendsAndDms();
  showHome();
}

window.enterDiscordApp = enterApp;
window.persistDiscordSession = persistSession;

async function loadFriendsAndDms() {
  if (!currentUser) return;
  const [friendsRes, dmsRes] = await Promise.all([
    apiPost("friends/list", { userId: currentUser.id }),
    apiPost("dms/list", { userId: currentUser.id }),
  ]);
  if (friendsRes?.ok) friends = friendsRes.friends || [];
  if (dmsRes?.ok) dmConversations = dmsRes.dms || [];
  renderFriendsSidebar();
  renderHomeFriends();
}

function renderFriendsSidebar() {
  if (els.friendsCount) els.friendsCount.textContent = String(friends.length);

  if (els.friendsList) {
    els.friendsList.innerHTML = "";
    if (!friends.length) {
      const empty = document.createElement("li");
      empty.className = "sidebar-empty";
      empty.textContent = "No friends yet";
      els.friendsList.append(empty);
    } else {
      friends.forEach((user) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "friend-item";
        if (currentDmUser?.id === user.id) btn.classList.add("active");
        btn.innerHTML = `<img class="friend-item__avatar" src="${avatarSrc(user)}" alt="" /><span class="friend-item__name">${user.displayName}</span>`;
        btn.addEventListener("click", () => openDmWithUser(user));
        els.friendsList.append(btn);
      });
    }
  }

  if (els.dmsList) {
    els.dmsList.innerHTML = "";
    if (!dmConversations.length) {
      const empty = document.createElement("li");
      empty.className = "sidebar-empty";
      empty.textContent = "No conversations";
      els.dmsList.append(empty);
    } else {
      dmConversations.forEach((dm) => {
        const user = dm.peer;
        if (!user) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dm-item";
        if (currentDmUser?.id === user.id) btn.classList.add("active");
        btn.innerHTML = `<img class="dm-item__avatar" src="${avatarSrc(user)}" alt="" /><span class="dm-item__name">${user.displayName}</span>`;
        btn.addEventListener("click", () => openDmWithUser(user));
        els.dmsList.append(btn);
      });
    }
  }
}

function renderHomeFriends() {
  if (!els.homeFriendsGrid) return;
  els.homeFriendsGrid.innerHTML = "";
  if (!friends.length) {
    const empty = document.createElement("p");
    empty.className = "home-empty";
    empty.textContent = "No friends yet — add someone by username.";
    els.homeFriendsGrid.append(empty);
    return;
  }
  friends.forEach((user) => {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
      <img class="friend-card__avatar" src="${avatarSrc(user)}" alt="" />
      <div class="friend-card__info">
        <span class="friend-card__name">${user.displayName}</span>
        <span class="friend-card__handle">@${user.username}</span>
      </div>
      <div class="friend-card__actions">
        <button type="button" class="friend-card__btn" data-action="message">Message</button>
        <button type="button" class="friend-card__btn friend-card__btn--ghost" data-action="profile">Profile</button>
      </div>`;
    card.querySelector('[data-action="message"]')?.addEventListener("click", () => openDmWithUser(user));
    card.querySelector('[data-action="profile"]')?.addEventListener("click", () => openUserPopout(user));
    card.querySelector(".friend-card__avatar")?.addEventListener("click", () => openUserPopout(user));
    els.homeFriendsGrid.append(card);
  });
}

function showHome() {
  viewMode = "home";
  currentServer = null;
  currentChannel = null;
  currentDmUser = null;
  stopMessagePolling();

  els.homeBtn?.classList.add("active");
  els.homeView?.classList.remove("hidden");
  els.chatArea?.classList.add("hidden");
  els.chatArea?.classList.remove("chat-area--dm");
  els.memberSidebar?.classList.add("hidden");
  els.homeSidebar?.classList.remove("hidden");
  els.serverSidebar?.classList.add("hidden");

  renderGuilds();
  renderHome();
  renderFriendsSidebar();
}

function showDmLayout() {
  viewMode = "dm";
  els.homeView?.classList.add("hidden");
  els.chatArea?.classList.remove("hidden");
  els.chatArea?.classList.add("chat-area--dm");
  els.memberSidebar?.classList.add("hidden");
  els.homeSidebar?.classList.remove("hidden");
  els.serverSidebar?.classList.add("hidden");
  els.homeBtn?.classList.add("active");
  startMessagePolling();
}

async function openDmWithUser(user) {
  if (!user || !currentUser) return;
  const res = await apiPost("dms/open", { userId: currentUser.id, targetUserId: user.id });
  if (!res?.ok) {
    Toast.error(res?.error || "Could not open conversation.");
    return;
  }
  currentDmUser = res.peer || user;
  currentChannel = res.channel;
  currentServer = null;
  showDmLayout();

  els.chatHeaderHash?.classList.add("hidden");
  if (els.chatHeaderAvatar) {
    els.chatHeaderAvatar.src = avatarSrc(currentDmUser);
    els.chatHeaderAvatar.classList.remove("hidden");
  }
  els.channelName.textContent = currentDmUser.displayName;
  els.channelTopic.textContent = `@${currentDmUser.username}`;
  els.messageInput.placeholder = `Message @${currentDmUser.username}`;
  els.dmProfileBtn?.classList.remove("hidden");
  els.inviteBtn?.classList.add("hidden");
  els.toggleMembersBtn?.classList.add("hidden");

  trackMessages(res.messages || []);
  renderMessages(res.messages || []);
  renderFriendsSidebar();
}

function showServerLayout() {
  viewMode = "server";
  currentDmUser = null;
  els.homeView?.classList.add("hidden");
  els.chatArea?.classList.remove("hidden");
  els.chatArea?.classList.remove("chat-area--dm");
  els.memberSidebar?.classList.remove("hidden");
  els.homeSidebar?.classList.add("hidden");
  els.serverSidebar?.classList.remove("hidden");
  els.chatHeaderHash?.classList.remove("hidden");
  els.chatHeaderAvatar?.classList.add("hidden");
  els.dmProfileBtn?.classList.add("hidden");
  els.inviteBtn?.classList.remove("hidden");
  els.toggleMembersBtn?.classList.remove("hidden");
  startMessagePolling();
}

function renderHome() {
  if (!currentUser) return;
  if (els.homeGreeting) els.homeGreeting.textContent = `Hey, ${currentUser.displayName}!`;
  if (els.homeAvatar) els.homeAvatar.src = avatarSrc(currentUser);

  if (!els.homeServersGrid) return;
  els.homeServersGrid.innerHTML = "";

  if (!servers.length) {
    const empty = document.createElement("p");
    empty.className = "home-empty";
    empty.textContent = "No servers yet — create one or join with an ID.";
    els.homeServersGrid.append(empty);
    return;
  }

  servers.forEach((server) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "home-server-card";
    const icon = document.createElement("span");
    icon.className = "home-server-card__icon";
    if (server.icon) {
      icon.classList.add("has-image");
      const img = document.createElement("img");
      img.src = server.icon;
      img.alt = server.name;
      icon.append(img);
    } else {
      icon.textContent = server.name.slice(0, 2).toUpperCase();
    }
    const name = document.createElement("span");
    name.className = "home-server-card__name";
    name.textContent = server.name;
    card.append(icon, name);
    card.addEventListener("click", () => selectServer(server));
    els.homeServersGrid.append(card);
  });
}

function updateUserPanel() {
  if (!currentUser) return;
  els.panelAvatar.src = avatarSrc(currentUser);
  els.panelDisplayName.textContent = currentUser.displayName;
  els.panelUsername.textContent = `@${currentUser.username}`;
  if (els.panelStatusDot) {
    els.panelStatusDot.className = `status-dot ${statusClass(currentUser.status || "online")}`;
  }
}

function renderGuilds() {
  els.guildList.innerHTML = "";
  servers.forEach((server) => {
    const btn = document.createElement("button");
    btn.className = "guild-pill";
    btn.title = server.name;
    btn.type = "button";
    if (currentServer?.id === server.id) btn.classList.add("active");

    if (server.icon) {
      btn.classList.add("has-icon");
      const img = document.createElement("img");
      img.src = server.icon;
      img.alt = server.name;
      btn.append(img);
    } else {
      btn.textContent = server.name.slice(0, 2).toUpperCase();
    }

    btn.addEventListener("click", () => selectServer(server));
    els.guildList.append(btn);
  });
}

function renderChannels() {
  if (!els.channelScroll) return;
  els.channelScroll.innerHTML = "";
  const owner = isServerOwner();
  els.createCategoryBtn?.classList.toggle("hidden", !owner);

  const groups = organizeChannelGroups(currentChannels);
  groups.forEach((group) => {
    const block = document.createElement("div");
    block.className = "channel-category";

    const header = document.createElement("div");
    header.className = "category-header";
    const label = document.createElement("span");
    label.className = "category-header__label";
    label.textContent = group.label;
    header.append(label);

    if (owner && group.category) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "icon-btn icon-btn--small";
      addBtn.title = "Create Channel";
      addBtn.textContent = "+";
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const defaultType = group.category.name.toLowerCase().includes("voice") ? "voice" : "text";
        openCreateChannelModal(group.category.id, defaultType);
      });
      header.append(addBtn);
    }

    const list = document.createElement("ul");
    list.className = "channel-list";

    group.channels.forEach((channel) => {
      const li = document.createElement("li");
      li.className = "channel-item";
      if (channel.type === "voice") li.classList.add("channel-item--voice");
      if (currentChannel?.id === channel.id) li.classList.add("active");
      const icon = document.createElement("span");
      icon.className = "channel-icon";
      icon.textContent = channelIcon(channel.type);
      const name = document.createElement("span");
      name.textContent = channel.name;
      li.append(icon, name);
      li.addEventListener("click", () => joinChannel(channel));
      list.append(li);
    });

    block.append(header, list);
    els.channelScroll.append(block);
  });
}

async function selectServer(server) {
  showServerLayout();
  currentServer = server;
  els.serverName.textContent = server.name;
  els.homeBtn.classList.remove("active");
  renderGuilds();

  const res = await apiPost("servers/channels", { serverId: server.id });
  if (!res?.ok) {
    Toast.error(res?.error || "Could not load server.");
    showHome();
    return;
  }
  currentChannels = res.channels || [];
  renderChannels();
  const first = firstJoinableChannel(currentChannels);
  if (first) await joinChannel(first);
}

async function joinChannel(channel) {
  if (channel.type === "category") return;

  const res = await apiPost("channels/join", { channelId: channel.id, userId: currentUser?.id });
  if (!res?.ok) {
    Toast.error(res?.error || "Could not open channel.");
    return;
  }

  currentChannel = res.channel;
  currentServer = res.server || currentServer;
  serverMembers = res.members || [];
  viewMode = "server";

  updateChannelLayout(currentChannel);
  els.channelName.textContent = channel.name;
  els.chatHeaderAvatar?.classList.add("hidden");
  els.chatHeaderHash?.classList.remove("hidden");

  if (channel.type === "voice") {
    els.channelTopic.textContent = "Voice channel";
    renderVoiceView(channel, serverMembers);
  } else {
    const topic = channel.topic || `This is the start of #${channel.name}`;
    els.channelTopic.textContent = topic;
    els.messageInput.placeholder =
      channel.type === "announcement" ? `Announce something in #${channel.name}` : `Message #${channel.name}`;
    trackMessages(res.messages || []);
    renderMessages(res.messages || []);
  }

  renderChannels();
  renderMembers(serverMembers);
}

function renderMessages(messages) {
  els.messages.innerHTML = "";

  const welcome = document.createElement("div");
  welcome.className = "welcome-message";
  if (viewMode === "dm" && currentDmUser) {
    welcome.innerHTML = `<h2>@${currentDmUser.username}</h2><p>This is the beginning of your direct message history with ${currentDmUser.displayName}.</p>`;
  } else {
    welcome.innerHTML = `<h2>Welcome to #${currentChannel?.name || "general"}!</h2><p>This is the start of the channel.</p>`;
  }
  els.messages.append(welcome);

  (messages || []).forEach((msg) => appendMessage(msg, true));
  scrollMessagesToBottom();
}

function removeMessageById(msgId) {
  const el = els.messages?.querySelector(`[data-msg-id="${msgId}"]`);
  if (!el) return;
  const group = el.closest(".message-group");
  el.remove();
  if (group && !group.querySelector(".message-block")) group.remove();
}

function appendMessage(message, fromBatch = false) {
  if (!message?.id || !els.messages) return;
  if (els.messages.querySelector(`[data-msg-id="${message.id}"]`)) return;

  if (!fromBatch && message.id && !String(message.id).startsWith("opt-")) {
    knownMessageIds.add(message.id);
    lastMessageTime = Math.max(lastMessageTime, message.timestamp || 0);
  }

  const lastGroup = getLastMessageGroup();
  if (canGroupWithLast(message, lastGroup)) {
    const body = lastGroup.querySelector(".message-body");
    body?.append(createMessageBlock(message));
    lastGroup.dataset.timestamp = String(message.timestamp);
  } else {
    els.messages.append(createMessageGroup(message));
  }
  scrollMessagesToBottom();
}

function renderMembers(members) {
  const online = members.filter((m) => resolveMemberStatus(m) !== "offline");
  const offline = members.filter((m) => resolveMemberStatus(m) === "offline");

  els.onlineCount.textContent = online.length;
  els.memberCount.textContent = members.length;
  els.onlineMembers.innerHTML = "";
  els.allMembers.innerHTML = "";
  online.forEach((user) => els.onlineMembers.append(createMemberItem(user)));
  offline.forEach((user) => els.allMembers.append(createMemberItem(user)));
}

function createMemberItem(user) {
  const li = document.createElement("li");
  li.className = "member-item";
  const wrap = document.createElement("div");
  wrap.className = "avatar-wrap";
  const img = document.createElement("img");
  img.src = avatarSrc(user);
  const dot = document.createElement("span");
  dot.className = `status-dot ${statusClass(resolveMemberStatus(user))}`;
  wrap.append(img, dot);
  const name = document.createElement("span");
  name.textContent = user.displayName;
  li.append(wrap, name);
  li.addEventListener("click", () => openUserPopout(user));
  return li;
}

function openUserPopout(user) {
  if (!user) return;
  popoutUser = user;
  els.popoutAvatar.src = avatarSrc(user);
  els.popoutName.textContent = user.displayName;
  els.popoutHandle.textContent = `@${user.username}`;
  els.popoutBio.textContent = user.bio || "No bio set.";
  els.popoutStatus.className = `status-dot ${statusClass(resolveMemberStatus(user))}`;
  if (user.banner) {
    els.popoutBannerImg.src = user.banner;
    els.popoutBannerImg.hidden = false;
  } else {
    els.popoutBannerImg.hidden = true;
  }
  els.popoutBanner.style.background = user.accentColor || "var(--brand)";

  const isSelf = currentUser?.id === user.id;
  if (els.popoutActions) {
    els.popoutActions.classList.toggle("hidden", isSelf);
  }
  if (els.popoutAddFriendBtn) {
    const alreadyFriend = friends.some((f) => f.id === user.id);
    els.popoutAddFriendBtn.textContent = alreadyFriend ? "Friends" : "Add Friend";
    els.popoutAddFriendBtn.disabled = alreadyFriend;
  }

  els.userPopout.showModal();
}

const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Invisible",
};

function setProfileAccentColor(color) {
  if (!color) return;
  if (els.profileAccent) els.profileAccent.value = color;
  const hasBannerImage = els.profileBannerImg && !els.profileBannerImg.hidden;
  if (els.profileBanner && !hasBannerImage) els.profileBanner.style.background = color;
  let matchedPreset = false;
  els.profileColorSwatches?.querySelectorAll(".color-swatch[data-color]").forEach((btn) => {
    const isMatch = btn.dataset.color?.toLowerCase() === color.toLowerCase();
    btn.classList.toggle("is-active", isMatch);
    if (isMatch) matchedPreset = true;
  });
  const custom = els.profileColorSwatches?.querySelector(".color-swatch--custom");
  if (custom) {
    custom.classList.toggle("is-active", !matchedPreset);
    custom.style.setProperty("--swatch", color);
  }
}

function setProfileStatus(status) {
  const value = status || "online";
  if (els.profileStatusSelect) els.profileStatusSelect.value = value;
  const cls = statusClass(value);
  if (els.profileStatusDot) els.profileStatusDot.className = `status-dot ${cls}`;
  if (els.profileStatusTriggerDot) els.profileStatusTriggerDot.className = `status-dot ${cls}`;
  if (els.profileStatusLabel) els.profileStatusLabel.textContent = STATUS_LABELS[value] || "Online";
  els.profileStatusMenu?.querySelectorAll("button[data-status]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.status === value);
  });
}

function closeProfileStatusMenu() {
  els.profileStatusMenu?.classList.add("hidden");
  els.profileStatusTrigger?.setAttribute("aria-expanded", "false");
}

function updateProfileBioCount() {
  if (els.profileBioCount && els.profileBio) {
    els.profileBioCount.textContent = String(els.profileBio.value.length);
  }
}

function wireProfileEditor() {
  els.profileBio?.addEventListener("input", updateProfileBioCount);

  els.profileColorSwatches?.querySelectorAll(".color-swatch[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => setProfileAccentColor(btn.dataset.color));
  });

  els.profileAccent?.addEventListener("input", (e) => setProfileAccentColor(e.target.value));

  const customSwatch = els.profileColorSwatches?.querySelector(".color-swatch--custom");
  customSwatch?.addEventListener("click", () => els.profileAccent?.click());

  els.profileStatusTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = els.profileStatusMenu?.classList.toggle("hidden") === false;
    els.profileStatusTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  els.profileStatusMenu?.querySelectorAll("button[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setProfileStatus(btn.dataset.status);
      closeProfileStatusMenu();
    });
  });

  document.addEventListener("click", (e) => {
    if (!els.profileStatusPicker?.contains(e.target)) closeProfileStatusMenu();
  });

  els.profileAvatarInput?.addEventListener("change", async () => {
    const file = els.profileAvatarInput.files?.[0];
    if (!file) return;
    try {
      pendingProfileAvatar = await prepareProfileImage(file, 128, 0.72);
      if (els.profileAvatar) els.profileAvatar.src = pendingProfileAvatar;
    } catch (err) {
      Toast.error(err?.message || "Could not load avatar.");
      if (els.profileAvatarInput) els.profileAvatarInput.value = "";
    }
  });

  els.profileBannerInput?.addEventListener("change", async () => {
    const file = els.profileBannerInput.files?.[0];
    if (!file) return;
    try {
      pendingProfileBanner = await prepareProfileImage(file, 600, 0.68);
      if (els.profileBannerImg) {
        els.profileBannerImg.src = pendingProfileBanner;
        els.profileBannerImg.hidden = false;
      }
    } catch (err) {
      Toast.error(err?.message || "Could not load banner.");
      if (els.profileBannerInput) els.profileBannerInput.value = "";
    }
  });

  els.profileModal?.addEventListener("close", () => {
    closeProfileStatusMenu();
    pendingProfileAvatar = null;
    pendingProfileBanner = null;
    if (els.profileAvatarInput) els.profileAvatarInput.value = "";
    if (els.profileBannerInput) els.profileBannerInput.value = "";
  });
}

function openProfileEditor() {
  if (!currentUser) return;
  pendingProfileAvatar = null;
  pendingProfileBanner = null;
  els.profileAvatar.src = avatarSrc(currentUser);
  els.profileDisplayName.value = currentUser.displayName;
  els.profileBio.value = currentUser.bio || "";
  updateProfileBioCount();
  setProfileAccentColor(currentUser.accentColor || "#5865f2");
  setProfileStatus(currentUser.status || "online");
  if (currentUser.banner) {
    els.profileBannerImg.src = currentUser.banner;
    els.profileBannerImg.hidden = false;
  } else {
    els.profileBannerImg.hidden = true;
    els.profileBannerImg.removeAttribute("src");
  }
  if (els.profileAvatarInput) els.profileAvatarInput.value = "";
  if (els.profileBannerInput) els.profileBannerInput.value = "";
  closeProfileStatusMenu();
  els.profileModal.showModal();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_ANIMATED_PROFILE_BYTES = 8 * 1024 * 1024;

async function isAnimatedProfileImage(file) {
  const type = (file.type || "").toLowerCase();
  if (type === "image/gif") return true;

  const sampleSize = Math.min(file.size, 512 * 1024);
  const buf = new Uint8Array(await file.slice(0, sampleSize).arrayBuffer());

  if (type === "image/png" || type === "image/apng") {
    for (let i = 0; i < buf.length - 3; i += 1) {
      if (buf[i] === 0x61 && buf[i + 1] === 0x63 && buf[i + 2] === 0x54 && buf[i + 3] === 0x4c) {
        return true;
      }
    }
  }

  if (type === "image/webp") {
    const text = new TextDecoder("latin1").decode(buf);
    return text.includes("ANIM") || text.includes("ANMF");
  }

  return false;
}

async function prepareServerIcon(file) {
  if (await isAnimatedProfileImage(file)) {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Animated server icons must be 2 MB or smaller.");
    }
    return readFile(file);
  }
  return compressImage(file, 128, 0.92);
}

async function prepareProfileImage(file, maxWidth, quality = 0.78) {
  if (await isAnimatedProfileImage(file)) {
    if (file.size > MAX_ANIMATED_PROFILE_BYTES) {
      throw new Error("Animated images must be 8 MB or smaller.");
    }
    return readFile(file);
  }
  return compressImage(file, maxWidth, quality);
}

function applyProfileToUi(user) {
  if (!user) return;
  updateUserPanel();
  if (els.homeAvatar) els.homeAvatar.src = avatarSrc(user);
  if (els.homeGreeting) els.homeGreeting.textContent = `Hey, ${user.displayName}!`;
  renderHome();
}

async function compressImage(file, maxWidth, quality = 0.78) {
  const type = (file.type || "").toLowerCase();
  const outputType = type === "image/png" ? "image/png" : "image/jpeg";
  const outputQuality = outputType === "image/png" ? undefined : quality;
  try {
    const bitmap = await createImageBitmap(file);
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > maxWidth) {
      h = Math.round((h * maxWidth) / w);
      w = maxWidth;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas.toDataURL(outputType, outputQuality);
  } catch {
    const dataUrl = await readFile(file);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(outputType, outputQuality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}

async function handleAuth(event) {
  event.preventDefault();
  if (window.__authBusy) return;
  window.__authBusy = true;
  showError("");
  setAuthLoading(true);

  try {
    const authMode = getAuthMode();
    const username = els.authUsername.value.trim();
    const displayName = els.authDisplayName.value.trim();

    const res =
      authMode === "register"
        ? await apiPost("auth/register", { username, displayName })
        : await apiPost("auth/login", { username });

    if (!res?.ok) {
      showError(res?.error || "Authentication failed.");
      return;
    }

    enterApp(res);
  } finally {
    setAuthLoading(false);
    window.__authBusy = false;
  }
}

async function handleCreateServer(event) {
  event.preventDefault();
  const res = await apiPost("servers/create", {
    userId: currentUser.id,
    name: els.serverNameInput.value.trim(),
    icon: pendingServerIcon,
  });
  if (res?.ok) {
    servers.push(res.server);
    currentChannels = res.channels || [];
    pendingServerIcon = null;
    els.serverIconPreview.textContent = "UPLOAD";
    els.createServerModal.close();
    els.createServerForm.reset();
    Toast.success(`Server "${res.server.name}" created!`);
    selectServer(res.server);
  } else {
    Toast.error(res?.error || "Could not create server.");
  }
}

async function handleCreateChannel(event) {
  event.preventDefault();
  if (!currentServer) return;

  const type = els.channelTypePicker?.querySelector('input[name="channelType"]:checked')?.value || "text";
  const categoryId =
    type === "category"
      ? null
      : els.channelCategorySelect?.value || pendingCreateCategoryId || null;

  const res = await apiPost("channels/create", {
    userId: currentUser.id,
    serverId: currentServer.id,
    name: els.channelNameInput.value.trim(),
    type,
    categoryId,
    topic: els.channelTopicInput?.value?.trim() || "",
  });

  if (res?.ok) {
    currentServer.channelIds.push(res.channel.id);
    currentChannels.push(res.channel);
    pendingCreateCategoryId = null;
    els.createChannelModal.close();
    els.createChannelForm.reset();
    const textRadio = els.channelTypePicker?.querySelector('input[value="text"]');
    if (textRadio) textRadio.checked = true;
    syncChannelTypeForm();
    renderChannels();
    if (res.channel.type !== "category") {
      joinChannel(res.channel);
    }
    const label =
      res.channel.type === "category"
        ? `Category "${res.channel.name}" created.`
        : res.channel.type === "voice"
          ? `Voice channel "${res.channel.name}" created.`
          : `#${res.channel.name} created.`;
    Toast.success(label);
  } else {
    Toast.error(res?.error || "Could not create channel.");
  }
}

async function handleJoinServer(event) {
  event.preventDefault();
  const res = await apiPost("servers/join", {
    userId: currentUser.id,
    inviteCode: els.joinServerInput.value.trim(),
  });
  if (res?.ok) {
    if (!servers.find((s) => s.id === res.server.id)) servers.push(res.server);
    els.joinServerModal.close();
    els.joinServerForm.reset();
    renderGuilds();
    renderHome();
    Toast.success(`Joined ${res.server.name}!`);
    selectServer(res.server);
  } else {
    Toast.error(res?.error || "Could not join server.");
  }
}

async function uploadMessageFile(file) {
  if (!currentChannel || !currentUser) return null;
  const fd = new FormData();
  fd.append("userId", currentUser.id);
  fd.append("channelId", currentChannel.id);
  fd.append("file", file);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const response = await fetch("api/messages/upload.php", { method: "POST", body: fd, signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));
    return data?.ok ? data.attachment : null;
  } catch {
    return null;
  }
}

function renderAttachmentPreview() {
  if (!els.attachmentPreview) return;
  els.attachmentPreview.innerHTML = "";
  if (!pendingAttachments.length) {
    els.attachmentPreview.classList.add("hidden");
    return;
  }
  els.attachmentPreview.classList.remove("hidden");
  pendingAttachments.forEach((att) => {
    const chip = document.createElement("div");
    chip.className = "attachment-chip";
    if (isImageAttachment(att)) {
      const img = document.createElement("img");
      img.src = att.url;
      img.alt = att.name || "";
      chip.append(img);
    } else {
      chip.innerHTML = `<span>📎 ${att.name || "File"}</span>`;
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "attachment-chip__remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      pendingAttachments = pendingAttachments.filter((a) => a.id !== att.id);
      renderAttachmentPreview();
    });
    chip.append(remove);
    els.attachmentPreview.append(chip);
  });
}

async function handleFileSelect(event) {
  const files = [...(event.target.files || [])];
  event.target.value = "";
  if (!files.length || !currentChannel) return;

  for (const file of files) {
    if (pendingAttachments.length >= 10) {
      Toast.error("Max 10 files per message.");
      break;
    }
    Toast.info(`Uploading ${file.name}…`);
    const att = await uploadMessageFile(file);
    if (att) {
      pendingAttachments.push(att);
      renderAttachmentPreview();
    } else {
      Toast.error(`Failed to upload ${file.name}`);
    }
  }
  els.messageInput?.focus();
}

function clearPendingAttachments() {
  pendingAttachments = [];
  renderAttachmentPreview();
}

function isChatActive() {
  return currentUser && currentChannel && !els.chatArea?.classList.contains("hidden") && els.authScreen?.classList.contains("hidden");
}

function shouldIgnoreGlobalKey(e) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = document.activeElement;
  const tag = el?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return true;
  if (document.querySelector("dialog[open]")) return true;
  return false;
}

function wireGlobalTyping() {
  document.addEventListener("keydown", (e) => {
    if (!isChatActive() || shouldIgnoreGlobalKey(e)) return;
    if (e.key === "Escape") return;
    if (e.key.length !== 1) return;

    const input = els.messageInput;
    if (!input) return;

    e.preventDefault();
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = input.value.slice(0, start) + e.key + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + 1;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function handleSendMessage(event) {
  event.preventDefault();
  const content = els.messageInput.value.trim();
  const attachments = [...pendingAttachments];
  if ((!content && !attachments.length) || !currentChannel || !currentUser) return;
  els.messageInput.value = "";
  clearPendingAttachments();

  const optimistic = {
    id: `opt-${Date.now()}`,
    channelId: currentChannel.id,
    authorId: currentUser.id,
    content,
    attachments,
    timestamp: Date.now(),
    author: currentUser,
  };
  appendMessage(optimistic);

  const res = await apiPost("messages/send", {
    channelId: currentChannel.id,
    userId: currentUser.id,
    content,
    attachments,
  });

  if (res?.ok && res.message) {
    removeMessageById(optimistic.id);
    if (!knownMessageIds.has(res.message.id)) {
      knownMessageIds.add(res.message.id);
      lastMessageTime = Math.max(lastMessageTime, res.message.timestamp || 0);
      appendMessage(res.message);
    }
  } else {
    removeMessageById(optimistic.id);
    Toast.error(res?.error || "Could not send message.");
  }
}

async function handleAddFriend(event) {
  event.preventDefault();
  const username = els.addFriendInput?.value.trim();
  if (!username || !currentUser) return;
  const res = await apiPost("friends/add", { userId: currentUser.id, username });
  if (res?.ok) {
    if (!friends.find((f) => f.id === res.friend.id)) friends.push(res.friend);
    els.addFriendModal?.close();
    els.addFriendForm?.reset();
    renderFriendsSidebar();
    renderHomeFriends();
    Toast.success(`Added ${res.friend.displayName}!`);
  } else {
    Toast.error(res?.error || "Could not add friend.");
  }
}

async function addFriendByUsername(username) {
  if (!username || !currentUser) return;
  const res = await apiPost("friends/add", { userId: currentUser.id, username });
  if (res?.ok) {
    if (!friends.find((f) => f.id === res.friend.id)) friends.push(res.friend);
    renderFriendsSidebar();
    renderHomeFriends();
    Toast.success(`Added ${res.friend.displayName}!`);
    return res.friend;
  }
  Toast.error(res?.error || "Could not add friend.");
  return null;
}

async function handleProfileSave(event) {
  event.preventDefault();
  if (!currentUser || window.__profileSaving) return;

  const saveBtn = els.profileSaveBtn || els.profileForm?.querySelector('button[type="submit"]');
  const prevText = saveBtn?.textContent || "Save Changes";
  window.__profileSaving = true;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
  }

  try {
    const payload = {
      userId: currentUser.id,
      displayName: els.profileDisplayName.value.trim() || currentUser.displayName,
      bio: els.profileBio.value,
      accentColor: els.profileAccent.value,
      status: els.profileStatusSelect.value,
    };
    if (pendingProfileAvatar) payload.avatar = pendingProfileAvatar;
    if (pendingProfileBanner) payload.banner = pendingProfileBanner;

    const res = await apiPost("profile/update", payload);

    if (!res?.ok) {
      Toast.error(res?.error || "Could not save profile.");
      return;
    }

    currentUser = res.user;
    pendingProfileAvatar = null;
    pendingProfileBanner = null;
    persistSession({ user: currentUser, servers });
    applyProfileToUi(currentUser);
    els.profileModal.close();
    Toast.success("Profile saved!");
  } catch (err) {
    console.error("Profile save failed:", err);
    Toast.error("Something went wrong saving your profile.");
  } finally {
    window.__profileSaving = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = prevText;
    }
  }
}

function wireModals() {
  Toast.init();
  Confirm.init();
  wireProfileEditor();

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog")?.close());
  });

  const openCreate = () => els.createServerModal?.showModal();
  const openJoin = () => els.joinServerModal?.showModal();
  const openAddFriend = () => els.addFriendModal?.showModal();

  els.homeBtn?.addEventListener("click", showHome);
  els.createServerBtn?.addEventListener("click", openCreate);
  els.homeCreateBtn?.addEventListener("click", openCreate);
  els.homeJoinBtn?.addEventListener("click", openJoin);
  els.homeCardCreate?.addEventListener("click", openCreate);
  els.homeCardJoin?.addEventListener("click", openJoin);
  els.addFriendBtn?.addEventListener("click", openAddFriend);
  els.homeAddFriendBtn?.addEventListener("click", openAddFriend);
  els.dmProfileBtn?.addEventListener("click", () => currentDmUser && openUserPopout(currentDmUser));
  els.popoutMessageBtn?.addEventListener("click", () => {
    if (popoutUser) {
      els.userPopout.close();
      openDmWithUser(popoutUser);
    }
  });
  els.popoutAddFriendBtn?.addEventListener("click", async () => {
    if (!popoutUser) return;
    await addFriendByUsername(popoutUser.username);
    els.popoutAddFriendBtn.textContent = "Friends";
    els.popoutAddFriendBtn.disabled = true;
  });

  if (els.createCategoryBtn) {
    els.createCategoryBtn.addEventListener("click", () => openCreateChannelModal(null, "category"));
  }
  els.channelTypePicker?.querySelectorAll('input[name="channelType"]').forEach((input) => {
    input.addEventListener("change", syncChannelTypeForm);
  });
  if (els.serverMenuBtn) els.serverMenuBtn.addEventListener("click", openJoin);
  if (els.openProfileBtn) els.openProfileBtn.addEventListener("click", openProfileEditor);
  if (els.settingsBtn) els.settingsBtn.addEventListener("click", openProfileEditor);
  if (els.inviteBtn) {
    els.inviteBtn.addEventListener("click", async () => {
      if (!currentServer) return;
      try {
        await navigator.clipboard.writeText(currentServer.id);
        Toast.success("Server ID copied to clipboard!");
      } catch {
        Toast.info(`Server ID: ${currentServer.id}`);
      }
    });
  }
  if (els.toggleMembersBtn) els.toggleMembersBtn.addEventListener("click", () => els.memberSidebar.classList.toggle("open"));
  if (els.serverIconInput) {
    els.serverIconInput.addEventListener("change", async () => {
      const file = els.serverIconInput.files[0];
      if (!file) return;
      try {
        pendingServerIcon = await prepareServerIcon(file);
        els.serverIconPreview.innerHTML = `<img src="${pendingServerIcon}" alt="icon" />`;
      } catch (err) {
        Toast.error(err?.message || "Could not load server icon.");
        els.serverIconInput.value = "";
      }
    });
  }
}

function wireAuth() {
  // auth handled by auth-boot.js (runs before app.js)
}

function wireChat() {
  if (els.messageForm) els.messageForm.addEventListener("submit", handleSendMessage);
  if (els.attachFileBtn) els.attachFileBtn.addEventListener("click", () => els.messageFileInput?.click());
  if (els.messageFileInput) els.messageFileInput.addEventListener("change", handleFileSelect);
  if (els.createServerForm) els.createServerForm.addEventListener("submit", handleCreateServer);
  if (els.createChannelForm) els.createChannelForm.addEventListener("submit", handleCreateChannel);
  if (els.joinServerForm) els.joinServerForm.addEventListener("submit", handleJoinServer);
  if (els.addFriendForm) els.addFriendForm.addEventListener("submit", handleAddFriend);
  if (els.profileForm) els.profileForm.addEventListener("submit", handleProfileSave);
  if (els.messageInput) {
    els.messageInput.addEventListener("input", () => {
      clearTimeout(typingPingTimer);
      typingPingTimer = setTimeout(pingTyping, 250);
    });
  }
}

function wireSocketEvents() {
  if (!socket) return;
  socket.on("message:new", (message) => {
    if (message.channelId === currentChannel?.id) appendMessage(message);
  });

  socket.on("users:online", (users) => {
    onlineUsers = users;
    renderMembers(serverMembers);
  });

  socket.on("profile:updated", (user) => {
    if (currentUser?.id === user.id) {
      currentUser = user;
      updateUserPanel();
    }
    serverMembers = serverMembers.map((m) => (m.id === user.id ? user : m));
    renderMembers(serverMembers);
  });

  socket.on("server:created", ({ server }) => {
    if (!servers.find((s) => s.id === server.id)) {
      if (server.memberIds?.includes(currentUser?.id) || server.ownerId === currentUser?.id) {
        servers.push(server);
        renderGuilds();
      }
    }
  });

  socket.on("channel:created", ({ serverId, channel }) => {
    if (currentServer?.id !== serverId) return;
    if (!currentChannels.find((c) => c.id === channel.id)) {
      currentChannels.push(channel);
      renderChannels();
    }
  });
}

async function tryRestoreSession() {
  const userId = localStorage.getItem(STORAGE_USER);
  if (!isValidUserId(userId)) {
    if (userId) clearSession();
    return;
  }

  const res = await apiPost("auth/restore", { userId });
  if (res?.ok) {
    enterApp(res);
    return;
  }

  clearSession();
  showLogin(res?.error || "Session expired — please log in again.");
  Toast.error("Your session was reset. Log in again to continue.");
}

async function boot() {
  try {
    wireAuth();
    wireModals();
    wireChat();
    wireGlobalTyping();

    const apiOk = await checkApiHealth();
    try {
      initSocket();
    } catch {
      /* optional websocket */
    }

    if (apiOk) {
      await tryRestoreSession();
    } else {
      showLogin("Cannot reach the API. Upload api/ to httpdocs and refresh.");
    }
  } catch (error) {
    console.error("App failed to start:", error);
    showLogin("App failed to load. Hard refresh the page (Ctrl+F5).");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
