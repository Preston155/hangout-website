<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$body = read_json_body();
$userId = (string) ($body['userId'] ?? '');
$channelId = (string) ($body['channelId'] ?? '');
$content = trim((string) ($body['content'] ?? ''));
$attachments = $body['attachments'] ?? [];

if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
$channel = find_channel($channelId);
if (!$channel || !user_can_access_channel($userId, $channelId)) {
  send_json(200, ['ok' => false, 'error' => 'Not allowed in this channel.']);
}
if (!is_message_channel($channel)) {
  send_json(200, ['ok' => false, 'error' => 'You cannot send messages in this channel.']);
}
if ($content === '' && empty($attachments)) {
  send_json(200, ['ok' => false, 'error' => 'Message cannot be empty.']);
}
if (strlen($content) > 2000) send_json(200, ['ok' => false, 'error' => 'Message too long.']);
if (!is_array($attachments) || count($attachments) > 10) {
  send_json(200, ['ok' => false, 'error' => 'Too many attachments.']);
}

$cleanAttachments = [];
foreach ($attachments as $att) {
  if (!is_array($att) || empty($att['url'])) continue;
  $cleanAttachments[] = [
    'id' => (string) ($att['id'] ?? uuid_v4()),
    'url' => (string) $att['url'],
    'name' => substr((string) ($att['name'] ?? 'file'), 0, 200),
    'type' => (string) ($att['type'] ?? 'application/octet-stream'),
    'size' => (int) ($att['size'] ?? 0),
  ];
}
if ($content === '' && empty($cleanAttachments)) {
  send_json(200, ['ok' => false, 'error' => 'Message cannot be empty.']);
}

$messages = read_store('messages', ['items' => []]);
$message = [
  'id' => uuid_v4(),
  'channelId' => $channelId,
  'authorId' => $userId,
  'content' => $content,
  'timestamp' => (int) round(microtime(true) * 1000),
];
if ($cleanAttachments) $message['attachments'] = $cleanAttachments;

$messages['items'][] = $message;
write_store('messages', $messages);

$user = find_user($userId);
send_json(200, ['ok' => true, 'message' => format_message_payload($message, $user)]);
