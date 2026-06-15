<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
$channelId = (string) ($_GET['channelId'] ?? '');
$userId = (string) ($_GET['userId'] ?? '');
if ($channelId === '') send_json(200, ['ok' => false, 'error' => 'channelId required.']);
send_json(200, ['ok' => true, 'users' => get_typing_users($channelId, $userId)]);
