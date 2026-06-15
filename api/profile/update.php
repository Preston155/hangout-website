<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);

$users = read_store('users', ['items' => []]);
$user = null;
foreach ($users['items'] as &$u) {
  if (($u['id'] ?? '') === $userId) {
    $user = &$u;
    break;
  }
}
if (!$user) send_json(200, ['ok' => false, 'error' => 'User not found.']);

if (isset($body['displayName'])) {
  $name = substr(trim((string) $body['displayName']), 0, 32);
  if ($name !== '') $user['displayName'] = $name;
}
if (isset($body['bio'])) $user['bio'] = substr((string) $body['bio'], 0, 190);

if (isset($body['avatar']) && is_string($body['avatar']) && $body['avatar'] !== '') {
  $saved = save_image_from_data_url($body['avatar'], 'avatars', $userId);
  if ($saved) {
    $user['avatar'] = $saved;
  } else {
    send_json(200, ['ok' => false, 'error' => 'Avatar too large or invalid. GIF/WebP max 8MB, other images max 2MB.']);
  }
}

if (isset($body['banner']) && is_string($body['banner']) && $body['banner'] !== '') {
  $saved = save_image_from_data_url($body['banner'], 'banners', $userId);
  if ($saved) {
    $user['banner'] = $saved;
  } else {
    send_json(200, ['ok' => false, 'error' => 'Banner too large or invalid. GIF/WebP max 8MB, other images max 2MB.']);
  }
}

if (isset($body['accentColor'])) $user['accentColor'] = (string) $body['accentColor'];
if (isset($body['status'])) $user['status'] = (string) $body['status'];

write_store('users', $users);
send_json(200, ['ok' => true, 'user' => public_user($user)]);
