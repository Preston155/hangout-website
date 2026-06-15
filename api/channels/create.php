<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$serverId = (string) ($body['serverId'] ?? '');
$rawName = trim((string) ($body['name'] ?? ''));
$type = strtolower(trim((string) ($body['type'] ?? 'text')));
$categoryId = isset($body['categoryId']) && $body['categoryId'] !== '' ? (string) $body['categoryId'] : null;
$topic = substr(trim((string) ($body['topic'] ?? '')), 0, 1024);

if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
if ($serverId === '' || $rawName === '') send_json(200, ['ok' => false, 'error' => 'Server and name are required.']);

$allowedTypes = ['text', 'voice', 'category', 'announcement'];
if (!in_array($type, $allowedTypes, true)) $type = 'text';

$servers = read_store('servers', ['items' => []]);
$server = null;
foreach ($servers['items'] as &$s) {
  if (($s['id'] ?? '') === $serverId) {
    $server = &$s;
    break;
  }
}
if (!$server) send_json(200, ['ok' => false, 'error' => 'Server not found.']);
if (($server['ownerId'] ?? '') !== $userId) {
  send_json(200, ['ok' => false, 'error' => 'Only the server owner can create channels.']);
}

if ($type === 'category') {
  $categoryId = null;
  $name = substr($rawName, 0, 100);
} else {
  $name = strtolower(preg_replace('/[^a-z0-9-]+/', '-', preg_replace('/\s+/', '-', $rawName)) ?? '');
  $name = trim($name, '-');
  if ($name === '') send_json(200, ['ok' => false, 'error' => 'Invalid channel name.']);
  $name = substr($name, 0, 100);
}

if ($categoryId !== null) {
  $parent = find_channel($categoryId);
  if (!$parent || ($parent['serverId'] ?? '') !== $serverId || ($parent['type'] ?? '') !== 'category') {
    send_json(200, ['ok' => false, 'error' => 'Invalid category.']);
  }
}

$channels = read_store('channels', ['items' => []]);
$channel = [
  'id' => uuid_v4(),
  'serverId' => $serverId,
  'name' => $name,
  'type' => $type,
  'categoryId' => $categoryId,
  'position' => next_channel_position($serverId, $categoryId, $type),
  'topic' => in_array($type, ['text', 'announcement'], true) ? $topic : '',
  'createdAt' => (int) round(microtime(true) * 1000),
];

$channels['items'][] = $channel;
$server['channelIds'][] = $channel['id'];
write_store('channels', $channels);
write_store('servers', $servers);
send_json(200, ['ok' => true, 'channel' => $channel]);
