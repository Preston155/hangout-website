<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);
$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$channelId = (string) ($body['channelId'] ?? '');
if ($userId === '' || $channelId === '' || !find_user($userId)) {
  send_json(200, ['ok' => false, 'error' => 'Invalid request.']);
}
set_typing($userId, $channelId);
send_json(200, ['ok' => true]);
