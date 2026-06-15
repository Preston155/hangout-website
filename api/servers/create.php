<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);
$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$name = trim((string) ($body['name'] ?? ''));
$icon = $body['icon'] ?? null;
if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
if ($name === '') send_json(200, ['ok' => false, 'error' => 'Server name required.']);

$servers = read_store('servers', ['items' => []]);
$channels = read_store('channels', ['items' => []]);
$serverId = uuid_v4();
$textCategoryId = uuid_v4();
$voiceCategoryId = uuid_v4();
$generalId = uuid_v4();

$server = [
  'id' => $serverId,
  'name' => substr($name, 0, 100),
  'icon' => null,
  'ownerId' => $userId,
  'memberIds' => [$userId],
  'channelIds' => [$textCategoryId, $voiceCategoryId, $generalId],
  'createdAt' => (int) round(microtime(true) * 1000),
];

if ($icon && is_string($icon) && $icon !== '') {
  $saved = save_image_from_data_url($icon, 'server-icons', $serverId);
  if ($saved) {
    $server['icon'] = $saved;
  }
}

$textCategory = [
  'id' => $textCategoryId,
  'serverId' => $serverId,
  'name' => 'Text Channels',
  'type' => 'category',
  'categoryId' => null,
  'position' => 0,
  'topic' => '',
  'createdAt' => (int) round(microtime(true) * 1000),
];
$voiceCategory = [
  'id' => $voiceCategoryId,
  'serverId' => $serverId,
  'name' => 'Voice Channels',
  'type' => 'category',
  'categoryId' => null,
  'position' => 1,
  'topic' => '',
  'createdAt' => (int) round(microtime(true) * 1000) + 1,
];
$general = [
  'id' => $generalId,
  'serverId' => $serverId,
  'name' => 'general',
  'type' => 'text',
  'categoryId' => $textCategoryId,
  'position' => 0,
  'topic' => '',
  'createdAt' => (int) round(microtime(true) * 1000) + 2,
];

$servers['items'][] = $server;
$channels['items'][] = $textCategory;
$channels['items'][] = $voiceCategory;
$channels['items'][] = $general;
write_store('servers', $servers);
write_store('channels', $channels);
send_json(200, ['ok' => true, 'server' => $server, 'channels' => [$textCategory, $voiceCategory, $general]]);
