<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$serverId = (string) ($body['serverId'] ?? '');
$name = array_key_exists('name', $body) ? trim((string) $body['name']) : null;
$hasIcon = array_key_exists('icon', $body);
$icon = $body['icon'] ?? null;

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
if (($server['ownerId'] ?? '') !== $userId) send_json(403, ['ok' => false, 'error' => 'Only the server owner can change settings.']);

if ($name !== null) {
  if ($name === '') send_json(400, ['ok' => false, 'error' => 'Server name required.']);
  $server['name'] = substr($name, 0, 100);
}

if ($hasIcon) {
  if ($icon && is_string($icon) && $icon !== '') {
    $saved = save_image_from_data_url($icon, 'server-icons', $serverId);
    if ($saved) $server['icon'] = $saved;
  } else {
    $server['icon'] = null;
  }
}

write_store('servers', $servers);
send_json(200, ['ok' => true, 'server' => $server]);
