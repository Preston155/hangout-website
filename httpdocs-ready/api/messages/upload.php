<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$userId = (string) ($_POST['userId'] ?? '');
$channelId = (string) ($_POST['channelId'] ?? '');
if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
if ($channelId === '' || !user_can_access_channel($userId, $channelId)) {
  send_json(200, ['ok' => false, 'error' => 'Not allowed in this channel.']);
}

$file = $_FILES['file'] ?? null;
if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  send_json(200, ['ok' => false, 'error' => 'No file uploaded.']);
}
if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
  send_json(200, ['ok' => false, 'error' => 'File too large (max 10MB).']);
}

$mime = 'application/octet-stream';
if (class_exists('finfo')) {
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $detected = $finfo->file($file['tmp_name']);
  if ($detected) $mime = $detected;
}

$allowed = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'audio/mpeg', 'audio/mp3',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
if (!in_array($mime, $allowed, true) && strncmp($mime, 'image/', 6) !== 0) {
  send_json(200, ['ok' => false, 'error' => 'File type not allowed.']);
}

$original = basename((string) ($file['name'] ?? 'file'));
$original = preg_replace('/[^a-zA-Z0-9._-]/', '_', $original) ?: 'file';
$ext = pathinfo($original, PATHINFO_EXTENSION);
$id = uuid_v4();
$filename = $id . ($ext ? '.' . $ext : '');

$dir = uploads_dir() . '/attachments';
if (!is_dir($dir)) mkdir($dir, 0775, true);
$dest = $dir . '/' . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
  send_json(200, ['ok' => false, 'error' => 'Could not save file. Check uploads/ permissions.']);
}

$attachment = [
  'id' => $id,
  'url' => 'uploads/attachments/' . $filename,
  'name' => $original,
  'type' => $mime,
  'size' => (int) ($file['size'] ?? 0),
];

send_json(200, ['ok' => true, 'attachment' => $attachment]);
