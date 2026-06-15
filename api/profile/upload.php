<?php
declare(strict_types=1);
require __DIR__ . '/../common.php';
handle_options();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') send_json(405, ['ok' => false, 'error' => 'POST required.']);

$userId = (string) ($_POST['userId'] ?? '');
$type = (string) ($_POST['type'] ?? '');
if ($userId === '' || !find_user($userId)) send_json(200, ['ok' => false, 'error' => 'Not authenticated.']);
if (!in_array($type, ['avatar', 'banner'], true)) send_json(200, ['ok' => false, 'error' => 'Invalid upload type.']);

$file = $_FILES['image'] ?? null;
if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  send_json(200, ['ok' => false, 'error' => 'No image uploaded.']);
}
if (($file['size'] ?? 0) > 8 * 1024 * 1024) {
  send_json(200, ['ok' => false, 'error' => 'Image too large (max 8MB).']);
}

$mime = 'image/jpeg';
if (class_exists('finfo')) {
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $detected = $finfo->file($file['tmp_name']);
  if ($detected) $mime = $detected;
}
if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
  send_json(200, ['ok' => false, 'error' => 'Invalid image format.']);
}

if ($mime === 'image/png') $ext = 'png';
elseif ($mime === 'image/gif') $ext = 'gif';
elseif ($mime === 'image/webp') $ext = 'webp';
else $ext = 'jpg';

$subdir = $type === 'avatar' ? 'avatars' : 'banners';
$destDir = uploads_dir() . '/' . $subdir;
if (!is_dir($destDir)) mkdir($destDir, 0775, true);

$filename = $userId . '.' . $ext;
$destPath = $destDir . '/' . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
  send_json(200, ['ok' => false, 'error' => 'Could not save image. Check uploads/ folder permissions.']);
}

$url = 'uploads/' . $subdir . '/' . $filename . '?v=' . time();

$users = read_store('users', ['items' => []]);
$user = null;
foreach ($users['items'] as &$u) {
  if (($u['id'] ?? '') === $userId) {
    $user = &$u;
    break;
  }
}
if (!$user) send_json(200, ['ok' => false, 'error' => 'User not found.']);

if ($type === 'avatar') $user['avatar'] = $url;
else $user['banner'] = $url;
write_store('users', $users);

send_json(200, ['ok' => true, 'url' => $url, 'user' => public_user($user)]);
