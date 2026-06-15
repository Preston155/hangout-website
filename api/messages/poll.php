<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
$channelId = (string) ($_GET['channelId'] ?? '');
$since = (int) ($_GET['since'] ?? 0);
$userId = (string) ($_GET['userId'] ?? '');
if ($channelId === '') send_json(200, ['ok' => false, 'error' => 'channelId required.']);
if (is_dm_channel($channelId) && ($userId === '' || !is_dm_participant($channelId, $userId))) {
  send_json(200, ['ok' => false, 'error' => 'Not allowed.']);
}
$messages = get_channel_messages($channelId, $since);
send_json(200, ['ok' => true, 'messages' => $messages]);
