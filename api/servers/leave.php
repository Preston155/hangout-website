<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$serverId = (string) ($body['serverId'] ?? '');

if ($userId === '' || !find_user($userId)) send_json(401, ['ok' => false, 'error' => 'Not authenticated.']);
if ($serverId === '') send_json(400, ['ok' => false, 'error' => 'Server ID required.']);

$servers = read_store('servers', ['items' => []]);
$server = null;
foreach ($servers['items'] as &$s) {
  if (($s['id'] ?? '') === $serverId) {
    $server = &$s;
    break;
  }
}

if (!$server) send_json(404, ['ok' => false, 'error' => 'Server not found.']);
if (($server['ownerId'] ?? '') === $userId) {
  send_json(400, ['ok' => false, 'error' => 'Owners cannot leave — transfer ownership or delete the server first.']);
}

$memberIds = $server['memberIds'] ?? [];
$server['memberIds'] = array_values(array_filter($memberIds, static fn ($id) => $id !== $userId));
write_store('servers', $servers);

send_json(200, ['ok' => true, 'serverId' => $serverId]);
