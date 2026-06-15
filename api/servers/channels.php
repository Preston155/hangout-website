<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
$body = read_json_body();
$serverId = (string) ($body['serverId'] ?? $_GET['serverId'] ?? '');
if ($serverId === '') send_json(400, ['ok' => false, 'error' => 'serverId required.']);
$servers = read_store('servers', ['items' => []]);
$server = null;
foreach ($servers['items'] as $s) {
  if (($s['id'] ?? '') === $serverId) { $server = $s; break; }
}
if (!$server) send_json(404, ['ok' => false, 'error' => 'Server not found.']);
send_json(200, ['ok' => true, 'channels' => get_server_channels($serverId), 'server' => $server]);
