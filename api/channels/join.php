<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
$body = read_json_body();
$channelId = (string) ($body['channelId'] ?? $_GET['channelId'] ?? '');
$userId = (string) ($body['userId'] ?? $_GET['userId'] ?? '');
if ($channelId === '') send_json(400, ['ok' => false, 'error' => 'channelId required.']);

$channels = read_store('channels', ['items' => []]);
$channel = find_channel($channelId);
if (!$channel) send_json(404, ['ok' => false, 'error' => 'Channel not found.']);
if (($channel['type'] ?? '') === 'category') {
  send_json(200, ['ok' => false, 'error' => 'Cannot join a category.']);
}

$servers = read_store('servers', ['items' => []]);
$server = null;
foreach ($servers['items'] as $s) {
  if (($s['id'] ?? '') === ($channel['serverId'] ?? '')) { $server = $s; break; }
}
if (!$server) send_json(404, ['ok' => false, 'error' => 'Server not found.']);

$memberIds = $server['memberIds'] ?? [];
$isMember = in_array($userId, $memberIds, true) || ($server['ownerId'] ?? '') === $userId;
if ($userId !== '' && !$isMember) {
  send_json(403, ['ok' => false, 'error' => 'You are not a member of this server.']);
}

$messages = ($channel['type'] ?? 'text') === 'voice'
  ? []
  : get_channel_messages($channelId);
send_json(200, [
  'ok' => true,
  'channel' => $channel,
  'server' => $server,
  'messages' => $messages,
  'members' => enrich_members($memberIds),
]);
