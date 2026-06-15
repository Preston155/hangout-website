<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);
$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
send_json(200, ['ok' => true, 'dms' => get_user_dms($userId)]);
