<?php
/**
 * Veltrix admin API — save command edits & publish to live JSON.
 * Copy config.example.php → config.php and set your password.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Admin API not configured. Copy api/config.example.php to api/config.php on the server.']);
    exit;
}

$config = require $configFile;
$dataDir = $config['data_dir'] ?? dirname(__DIR__) . '/data';
$password = (string) ($config['password'] ?? '');

session_start();

function jsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(array $payload, int $code = 200): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function readJson(string $path, array $fallback = []): array {
    if (!is_file($path)) return $fallback;
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : $fallback;
}

function writeJson(string $path, array $data): void {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n", LOCK_EX);
}

function authed(array $body, string $password): bool {
    if (!empty($_SESSION['admin_ok'])) return true;
    $pass = (string) ($body['password'] ?? $_SERVER['HTTP_X_ADMIN_PASS'] ?? '');
    return $pass !== '' && hash_equals($password, $pass);
}

function mergeCmd(array $base, array $patch): array {
    return array_merge($base, $patch);
}

function pushOverridesToBot(array $config, array $overrides): ?array {
    $url = trim((string) ($config['bot_apply_url'] ?? ''));
    $secret = (string) ($config['bot_apply_secret'] ?? '');
    if ($url === '') {
        return null;
    }

    $payload = json_encode(['overrides' => $overrides]);
    if (!function_exists('curl_init')) {
        throw new RuntimeException('cURL not available — run npm run sync:to-bot on your PC');
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Admin-Secret: ' . $secret,
        ],
        CURLOPT_POSTFIELDS => $payload,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode((string) $body, true);
    if ($code >= 200 && $code < 300 && is_array($data) && !empty($data['ok'])) {
        return $data;
    }
    $err = is_array($data) ? ($data['error'] ?? $body) : $body;
    throw new RuntimeException('Bot apply failed: ' . (string) $err);
}

function applyOverrides(array $bot, array $overrides): array {
    $hidden = array_flip($overrides['hiddenKeys'] ?? []);
    foreach ($bot['categories'] as &$cat) {
        $cmds = [];
        foreach ($cat['commands'] as $cmd) {
            $type = $cmd['type'] ?? 'system';
            $key = $cat['id'] . ':' . $cmd['name'] . ':' . $type;
            if (isset($hidden[$key])) continue;
            $alt = $type . ':' . $cmd['name'];
            $patch = $overrides['commands'][$key] ?? $overrides['commands'][$alt] ?? null;
            if (is_array($patch)) $cmd = mergeCmd($cmd, $patch);
            $cmds[] = $cmd;
        }
        $cat['commands'] = $cmds;
    }
    unset($cat);
    if (!empty($overrides['meta']['botName'])) $bot['botName'] = $overrides['meta']['botName'];
    if (!empty($overrides['meta']['subtitle'])) $bot['subtitle'] = $overrides['meta']['subtitle'];
    if (!empty($overrides['meta']['prefix'])) $bot['prefix'] = $overrides['meta']['prefix'];
    $bot['updatedAt'] = date('Y-m-d');
    return $bot;
}

$body = jsonBody();
$action = (string) ($body['action'] ?? $_GET['action'] ?? '');

if ($action === 'login') {
    if (!hash_equals($password, (string) ($body['password'] ?? ''))) {
        respond(['ok' => false, 'error' => 'Invalid password'], 401);
    }
    $_SESSION['admin_ok'] = true;
    respond(['ok' => true, 'token' => 'session']);
}

if ($action === 'logout') {
    $_SESSION['admin_ok'] = false;
    respond(['ok' => true]);
}

if (!authed($body, $password)) {
    respond(['ok' => false, 'error' => 'Unauthorized'], 401);
}

$overridesPath = $dataDir . '/admin-overrides.json';
$botPath = $dataDir . '/bot-commands.json';
$previewsPath = $dataDir . '/command-previews.json';

if ($action === 'get') {
    respond([
        'ok' => true,
        'overrides' => readJson($overridesPath, ['commands' => [], 'previews' => [], 'systems' => [], 'meta' => []]),
        'commands' => readJson($botPath, []),
        'previews' => readJson($previewsPath, []),
    ]);
}

if ($action === 'save-command') {
    $key = (string) ($body['key'] ?? '');
    $patch = $body['patch'] ?? null;
    if ($key === '' || !is_array($patch)) {
        respond(['ok' => false, 'error' => 'Missing key or patch'], 400);
    }
    $overrides = readJson($overridesPath, ['commands' => [], 'previews' => [], 'systems' => [], 'meta' => [], 'hiddenKeys' => []]);
    $overrides['commands'][$key] = array_merge($overrides['commands'][$key] ?? [], $patch);
    $overrides['updatedAt'] = date('c');
    writeJson($overridesPath, $overrides);
    respond(['ok' => true, 'overrides' => $overrides]);
}

if ($action === 'save-preview') {
    $key = (string) ($body['key'] ?? '');
    $patch = $body['patch'] ?? null;
    if ($key === '' || !is_array($patch)) {
        respond(['ok' => false, 'error' => 'Missing key or patch'], 400);
    }
    $overrides = readJson($overridesPath, ['commands' => [], 'previews' => [], 'systems' => [], 'meta' => [], 'hiddenKeys' => []]);
    $overrides['previews'][$key] = $patch;
    $overrides['updatedAt'] = date('c');
    writeJson($overridesPath, $overrides);
    respond(['ok' => true, 'overrides' => $overrides]);
}

if ($action === 'save-overrides') {
    $overrides = $body['overrides'] ?? null;
    if (!is_array($overrides)) {
        respond(['ok' => false, 'error' => 'Missing overrides object'], 400);
    }
    $overrides['updatedAt'] = date('c');
    writeJson($overridesPath, $overrides);
    respond(['ok' => true]);
}

if ($action === 'publish') {
    $overrides = readJson($overridesPath, ['commands' => [], 'previews' => [], 'systems' => [], 'meta' => []]);
    $bot = readJson($botPath, []);
    $previews = readJson($previewsPath, []);

    $mergedBot = applyOverrides($bot, $overrides);
    foreach ($overrides['previews'] ?? [] as $k => $v) {
        $previews[$k] = $v;
    }

    writeJson($botPath, $mergedBot);
    writeJson($previewsPath, $previews);
    $overrides['publishedAt'] = date('c');
    writeJson($overridesPath, $overrides);

    $gitMsg = null;
    $repo = $config['git_repo'] ?? '';
    if ($repo && is_dir($repo . '/.git')) {
        $cmds = 'cd ' . escapeshellarg($repo) . ' && git add data/bot-commands.json data/command-previews.json data/admin-overrides.json 2>&1';
        @shell_exec($cmds);
        $commit = @shell_exec('cd ' . escapeshellarg($repo) . ' && git commit -m ' . escapeshellarg('Publish admin dashboard edits') . ' 2>&1');
        $push = @shell_exec('cd ' . escapeshellarg($repo) . ' && git push origin main 2>&1');
        $gitMsg = trim(($commit ?? '') . "\n" . ($push ?? ''));
    }

    $botMsg = null;
    try {
        $botResult = pushOverridesToBot($config, $overrides);
        if ($botResult !== null) {
            $botMsg = 'Bot updated';
        }
    } catch (Throwable $e) {
        $botMsg = $e->getMessage();
    }

    respond(['ok' => true, 'publishedAt' => $overrides['publishedAt'], 'git' => $gitMsg, 'bot' => $botMsg]);
}

if ($action === 'apply-bot') {
    $overrides = readJson($overridesPath, ['commands' => [], 'previews' => [], 'systems' => [], 'meta' => [], 'hiddenKeys' => []]);
    try {
        $botResult = pushOverridesToBot($config, $overrides);
        if ($botResult === null) {
            respond(['ok' => false, 'error' => 'Bot apply URL not configured in api/config.php'], 503);
        }
        respond(['ok' => true, 'bot' => $botResult]);
    } catch (Throwable $e) {
        respond(['ok' => false, 'error' => $e->getMessage()], 500);
    }
}

respond(['ok' => false, 'error' => 'Unknown action'], 400);
