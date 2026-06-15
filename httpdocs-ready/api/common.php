<?php
declare(strict_types=1);

const DATA_DIR = __DIR__ . '/../data';

function send_json(int $code, array $payload): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

function handle_options(): void {
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    send_json(204, []);
  }
}

function read_json_body(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function ensure_data_dir(): void {
  if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0775, true);
  }
}

function store_path(string $name): string {
  ensure_data_dir();
  return DATA_DIR . '/' . $name . '.json';
}

function read_store(string $name, array $fallback): array {
  $file = store_path($name);
  if (!file_exists($file)) {
    file_put_contents($file, json_encode($fallback, JSON_PRETTY_PRINT));
    return $fallback;
  }
  $parsed = json_decode(file_get_contents($file) ?: '', true);
  return is_array($parsed) ? $parsed : $fallback;
}

function write_store(string $name, array $data): void {
  file_put_contents(store_path($name), json_encode($data, JSON_PRETTY_PRINT));
}

function uuid_v4(): string {
  $data = random_bytes(16);
  $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
  $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function public_user(?array $user): ?array {
  if (!$user) return null;
  return [
    'id' => $user['id'],
    'username' => $user['username'],
    'displayName' => $user['displayName'],
    'bio' => $user['bio'] ?? '',
    'avatar' => $user['avatar'] ?? null,
    'banner' => $user['banner'] ?? null,
    'accentColor' => $user['accentColor'] ?? '#5865f2',
    'status' => $user['status'] ?? 'online',
  ];
}

function get_user_servers(string $userId): array {
  $servers = read_store('servers', ['items' => []]);
  return array_values(array_filter($servers['items'], static function ($s) use ($userId) {
    $isOwner = ($s['ownerId'] ?? '') === $userId;
    $isMember = in_array($userId, $s['memberIds'] ?? [], true);
    return $isOwner || $isMember;
  }));
}

function find_user(string $userId): ?array {
  $users = read_store('users', ['items' => []]);
  foreach ($users['items'] as $user) {
    if (($user['id'] ?? '') === $userId) return $user;
  }
  return null;
}

function register_user(string $username, string $displayName): array {
  $users = read_store('users', ['items' => []]);
  $clean = strtolower(preg_replace('/[^a-z0-9_]/', '', trim($username)) ?? '');
  if (strlen($clean) < 3) {
    return ['ok' => false, 'error' => 'Username must be at least 3 characters (letters, numbers, underscore).'];
  }
  foreach ($users['items'] as $u) {
    if (($u['username'] ?? '') === $clean) {
      return ['ok' => false, 'error' => 'Username already taken.'];
    }
  }

  $user = [
    'id' => uuid_v4(),
    'username' => $clean,
    'displayName' => substr(trim($displayName) ?: $clean, 0, 32),
    'bio' => '',
    'avatar' => null,
    'banner' => null,
    'accentColor' => '#5865f2',
    'status' => 'online',
    'createdAt' => (int) round(microtime(true) * 1000),
  ];
  $users['items'][] = $user;
  write_store('users', $users);

  return ['ok' => true, 'user' => public_user($user), 'servers' => get_user_servers($user['id'])];
}

function login_user(string $username): array {
  $users = read_store('users', ['items' => []]);
  $clean = strtolower(preg_replace('/[^a-z0-9_]/', '', trim($username)) ?? '');
  foreach ($users['items'] as $user) {
    if (($user['username'] ?? '') === $clean) {
      return ['ok' => true, 'user' => public_user($user), 'servers' => get_user_servers($user['id'])];
    }
  }
  return ['ok' => false, 'error' => 'User not found. Register first.'];
}

function restore_user(string $userId): array {
  $user = find_user($userId);
  if (!$user) return ['ok' => false, 'error' => 'Session expired. Please log in again.'];
  return ['ok' => true, 'user' => public_user($user), 'servers' => get_user_servers($user['id'])];
}

function get_server_channels(string $serverId): array {
  $channels = read_store('channels', ['items' => []]);
  $items = array_values(array_filter($channels['items'], static fn($c) => ($c['serverId'] ?? '') === $serverId));
  $items = array_map('normalize_channel_record', $items);
  usort($items, static function ($a, $b) {
    $pos = ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
    if ($pos !== 0) return $pos;
    return ($a['createdAt'] ?? 0) <=> ($b['createdAt'] ?? 0);
  });
  return $items;
}

function normalize_channel_record(array $channel): array {
  if (!isset($channel['type'])) $channel['type'] = 'text';
  if (!array_key_exists('categoryId', $channel)) $channel['categoryId'] = null;
  if (!isset($channel['position'])) $channel['position'] = (int) ($channel['createdAt'] ?? 0);
  if (!isset($channel['topic'])) $channel['topic'] = '';
  return $channel;
}

function find_channel(string $channelId): ?array {
  $channels = read_store('channels', ['items' => []]);
  foreach ($channels['items'] as $channel) {
    if (($channel['id'] ?? '') === $channelId) {
      return normalize_channel_record($channel);
    }
  }
  return null;
}

function next_channel_position(string $serverId, ?string $categoryId, string $type): int {
  $channels = get_server_channels($serverId);
  $max = -1;
  foreach ($channels as $ch) {
    if ($type === 'category') {
      if (($ch['type'] ?? '') !== 'category') continue;
    } else {
      if (($ch['categoryId'] ?? null) !== $categoryId) continue;
    }
    if (($ch['position'] ?? 0) > $max) $max = (int) $ch['position'];
  }
  return $max + 1;
}

function is_message_channel(array $channel): bool {
  $type = $channel['type'] ?? 'text';
  return in_array($type, ['text', 'announcement', 'dm'], true);
}

function get_channel_messages(string $channelId, int $since = 0, int $limit = 100): array {
  $messages = read_store('messages', ['items' => []]);
  $users = read_store('users', ['items' => []]);
  $userMap = [];
  foreach ($users['items'] as $u) $userMap[$u['id']] = $u;

  $filtered = array_values(array_filter($messages['items'], static function ($m) use ($channelId, $since) {
    return ($m['channelId'] ?? '') === $channelId && (int) ($m['timestamp'] ?? 0) > $since;
  }));
  usort($filtered, static fn($a, $b) => ($a['timestamp'] ?? 0) <=> ($b['timestamp'] ?? 0));
  $filtered = array_slice($filtered, -$limit);

  return array_map(static function ($m) use ($userMap) {
    $author = $userMap[$m['authorId'] ?? ''] ?? null;
    return format_message_payload($m, $author);
  }, $filtered);
}

function format_message_payload(array $m, ?array $author): array {
  $payload = [
    'id' => $m['id'],
    'channelId' => $m['channelId'],
    'authorId' => $m['authorId'],
    'content' => $m['content'] ?? '',
    'timestamp' => (int) ($m['timestamp'] ?? 0),
    'author' => public_user($author) ?? ['id' => 'system', 'displayName' => 'System', 'username' => 'system', 'avatar' => null],
  ];
  if (!empty($m['attachments'])) {
    $payload['attachments'] = $m['attachments'];
  }
  return $payload;
}

function user_can_access_channel(string $userId, string $channelId): bool {
  if (is_dm_channel($channelId)) {
    return is_dm_participant($channelId, $userId);
  }
  $channels = read_store('channels', ['items' => []]);
  foreach ($channels['items'] as $ch) {
    if (($ch['id'] ?? '') !== $channelId) continue;
    $serverId = $ch['serverId'] ?? '';
    $servers = read_store('servers', ['items' => []]);
    foreach ($servers['items'] as $s) {
      if (($s['id'] ?? '') !== $serverId) continue;
      return ($s['ownerId'] ?? '') === $userId || in_array($userId, $s['memberIds'] ?? [], true);
    }
  }
  return false;
}

function enrich_members(array $memberIds): array {
  $users = read_store('users', ['items' => []]);
  $members = [];
  foreach ($users['items'] as $u) {
    if (in_array($u['id'], $memberIds, true)) $members[] = public_user($u);
  }
  return $members;
}

function find_user_by_username(string $username): ?array {
  $clean = strtolower(preg_replace('/[^a-z0-9_]/', '', trim($username)) ?? '');
  if ($clean === '') return null;
  $users = read_store('users', ['items' => []]);
  foreach ($users['items'] as $user) {
    if (($user['username'] ?? '') === $clean) return $user;
  }
  return null;
}

function get_user_friends_list(string $userId): array {
  $friends = read_store('friends', ['items' => []]);
  $friendIds = [];
  foreach ($friends['items'] as $f) {
    if (($f['userId'] ?? '') === $userId) $friendIds[] = $f['friendId'];
    if (($f['friendId'] ?? '') === $userId) $friendIds[] = $f['userId'];
  }
  $friendIds = array_values(array_unique($friendIds));
  $users = read_store('users', ['items' => []]);
  $result = [];
  foreach ($users['items'] as $u) {
    if (in_array($u['id'], $friendIds, true)) $result[] = public_user($u);
  }
  usort($result, static fn($a, $b) => strcasecmp($a['displayName'] ?? '', $b['displayName'] ?? ''));
  return $result;
}

function add_friendship(string $userId, string $targetUsername): array {
  $target = find_user_by_username($targetUsername);
  if (!$target) return ['ok' => false, 'error' => 'User not found. Check the username and try again.'];
  if ($target['id'] === $userId) return ['ok' => false, 'error' => 'You cannot add yourself.'];

  $friends = read_store('friends', ['items' => []]);
  foreach ($friends['items'] as $f) {
    $a = $f['userId'] ?? '';
    $b = $f['friendId'] ?? '';
    if (($a === $userId && $b === $target['id']) || ($a === $target['id'] && $b === $userId)) {
      return ['ok' => false, 'error' => 'Already friends with this user.'];
    }
  }

  $friends['items'][] = [
    'userId' => $userId,
    'friendId' => $target['id'],
    'createdAt' => (int) round(microtime(true) * 1000),
  ];
  write_store('friends', $friends);
  return ['ok' => true, 'friend' => public_user($target)];
}

function dm_channel_id(string $userA, string $userB): string {
  $ids = [$userA, $userB];
  sort($ids);
  return 'dm_' . substr(md5($ids[0] . ':' . $ids[1]), 0, 16);
}

function is_dm_channel(string $channelId): bool {
  return strncmp($channelId, 'dm_', 3) === 0;
}

function is_dm_participant(string $channelId, string $userId): bool {
  if (!is_dm_channel($channelId)) return false;
  $dms = read_store('dms', ['items' => []]);
  foreach ($dms['items'] as $dm) {
    if (($dm['id'] ?? '') === $channelId) {
      return in_array($userId, $dm['participantIds'] ?? [], true);
    }
  }
  return false;
}

function ensure_dm(string $userId, string $targetUserId): array {
  if ($targetUserId === '' || !find_user($targetUserId)) {
    return ['ok' => false, 'error' => 'User not found.'];
  }
  if ($targetUserId === $userId) return ['ok' => false, 'error' => 'Cannot message yourself.'];

  $channelId = dm_channel_id($userId, $targetUserId);
  $dms = read_store('dms', ['items' => []]);
  $existing = null;
  foreach ($dms['items'] as $dm) {
    if (($dm['id'] ?? '') === $channelId) {
      $existing = $dm;
      break;
    }
  }
  if (!$existing) {
    $existing = [
      'id' => $channelId,
      'participantIds' => [$userId, $targetUserId],
      'createdAt' => (int) round(microtime(true) * 1000),
    ];
    $dms['items'][] = $existing;
    write_store('dms', $dms);
  }

  $target = find_user($targetUserId);
  return [
    'ok' => true,
    'dm' => $existing,
    'channel' => ['id' => $channelId, 'type' => 'dm', 'name' => $target['displayName'] ?? 'DM'],
    'peer' => public_user($target),
    'messages' => get_channel_messages($channelId),
  ];
}

function get_user_dms(string $userId): array {
  $dms = read_store('dms', ['items' => []]);
  $result = [];
  foreach ($dms['items'] as $dm) {
    if (!in_array($userId, $dm['participantIds'] ?? [], true)) continue;
    $peerId = null;
    foreach ($dm['participantIds'] as $pid) {
      if ($pid !== $userId) {
        $peerId = $pid;
        break;
      }
    }
    if (!$peerId) continue;
    $peer = find_user($peerId);
    if (!$peer) continue;
    $result[] = [
      'id' => $dm['id'],
      'peer' => public_user($peer),
      'createdAt' => $dm['createdAt'] ?? 0,
    ];
  }
  usort($result, static fn($a, $b) => strcasecmp($a['peer']['displayName'] ?? '', $b['peer']['displayName'] ?? ''));
  return $result;
}

function search_users(string $query, string $excludeUserId, int $limit = 8): array {
  $clean = strtolower(preg_replace('/[^a-z0-9_]/', '', trim($query)) ?? '');
  if (strlen($clean) < 2) return [];
  $users = read_store('users', ['items' => []]);
  $results = [];
  foreach ($users['items'] as $u) {
    if (($u['id'] ?? '') === $excludeUserId) continue;
    $username = $u['username'] ?? '';
    if (strpos($username, $clean) !== false) {
      $results[] = public_user($u);
      if (count($results) >= $limit) break;
    }
  }
  return $results;
}

function uploads_dir(): string {
  $dir = DATA_DIR . '/../uploads';
  if (!is_dir($dir)) mkdir($dir, 0775, true);
  return $dir;
}

function save_image_from_data_url(string $dataUrl, string $subdir, string $userId): ?string {
  if (!preg_match('#^data:image/(png|jpe?g|gif|webp);base64,#i', $dataUrl)) {
    if (strncmp($dataUrl, 'uploads/', 8) === 0 || strncmp($dataUrl, 'http', 4) === 0) {
      return $dataUrl;
    }
    return null;
  }
  $parts = explode(',', $dataUrl, 2);
  $raw = base64_decode($parts[1] ?? '', true);
  if ($raw === false) return null;

  $ext = 'jpg';
  if (preg_match('#^data:image/(png|jpe?g|gif|webp);#i', $dataUrl, $m)) {
    $t = strtolower($m[1]);
    $ext = $t === 'png' ? 'png' : ($t === 'gif' ? 'gif' : ($t === 'webp' ? 'webp' : 'jpg'));
  }

  $maxBytes = 2 * 1024 * 1024;
  if (in_array($ext, ['gif', 'webp'], true)) {
    $maxBytes = 8 * 1024 * 1024;
  } elseif ($ext === 'png' && strpos($raw, 'acTL') !== false) {
    $maxBytes = 8 * 1024 * 1024;
  }
  if (strlen($raw) > $maxBytes) return null;

  $dir = uploads_dir() . '/' . $subdir;
  if (!is_dir($dir)) mkdir($dir, 0775, true);
  $file = $dir . '/' . $userId . '.' . $ext;
  if (file_put_contents($file, $raw) === false) {
    return strlen($dataUrl) <= 180000 ? $dataUrl : null;
  }
  return 'uploads/' . $subdir . '/' . $userId . '.' . $ext . '?v=' . time();
}

function set_typing(string $userId, string $channelId): void {
  $typing = read_store('typing', ['items' => []]);
  $now = (int) round(microtime(true) * 1000);
  $items = array_values(array_filter($typing['items'], static function ($t) use ($channelId, $userId) {
    return !(($t['channelId'] ?? '') === $channelId && ($t['userId'] ?? '') === $userId);
  }));
  $items[] = ['userId' => $userId, 'channelId' => $channelId, 'at' => $now];
  $items = array_values(array_filter($items, static fn($t) => $now - (int) ($t['at'] ?? 0) < 6000));
  write_store('typing', ['items' => $items]);
}

function get_typing_users(string $channelId, string $excludeUserId): array {
  $typing = read_store('typing', ['items' => []]);
  $now = (int) round(microtime(true) * 1000);
  $ids = [];
  foreach ($typing['items'] as $t) {
    if (($t['channelId'] ?? '') !== $channelId) continue;
    if (($t['userId'] ?? '') === $excludeUserId) continue;
    if ($now - (int) ($t['at'] ?? 0) > 4000) continue;
    $ids[$t['userId']] = true;
  }
  $users = [];
  foreach (array_keys($ids) as $id) {
    $u = find_user($id);
    if ($u) $users[] = public_user($u);
  }
  return $users;
}
