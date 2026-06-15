<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$inviteCode = trim((string) ($body['inviteCode'] ?? ''));

if ($userId === '' || !find_user($userId)) send_json(401, ['ok' => false, 'error' => 'Not authenticated.']);
if ($inviteCode === '') send_json(400, ['ok' => false, 'error' => 'Server ID required.']);

$servers = read_store('servers', ['items' => []]);
$server = null;
foreach ($servers['items'] as &$s) {
  if (($s['id'] ?? '') === $inviteCode || strtolower($s['name'] ?? '') === strtolower($inviteCode)) {
    $server = &$s;
    break;
  }
}

if (!$server) send_json(404, ['ok' => false, 'error' => 'Server not found. Check the ID and try again.']);

if (!in_array($userId, $server['memberIds'] ?? [], true) && ($server['ownerId'] ?? '') !== $userId) {
  $server['memberIds'][] = $userId;
  write_store('servers', $servers);
}

send_json(200, [
  'ok' => true,
  'server' => $server,
  'channels' => get_server_channels($server['id']),
]);
