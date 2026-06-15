<?php
declare(strict_types=1);

function cad_load_config(): array {
  static $config = null;
  if ($config !== null) return $config;

  $defaults = [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => (int) (getenv('DB_PORT') ?: 3306),
    'user' => getenv('DB_USER') ?: 'prestonh_database',
    'pass' => getenv('DB_PASSWORD') ?: '',
    'name' => getenv('DB_NAME') ?: 'prestonh_database',
    'dev_login' => (getenv('DEV_LOGIN') ?: 'true') === 'true',
    'dev_login_password' => getenv('DEV_LOGIN_PASSWORD') ?: 'admin123',
    'server_name' => getenv('SERVER_NAME') ?: 'Liberty County CAD',
    'server_logo' => getenv('SERVER_LOGO') ?: '',
    'setup_key' => getenv('CAD_SETUP_KEY') ?: 'liberty-cad-setup-2026',
  ];

  $paths = [
    __DIR__ . '/../../database/plesk.local.php',
    __DIR__ . '/../database/plesk.local.php',
  ];
  foreach ($paths as $path) {
    if (file_exists($path)) {
      $loaded = require $path;
      $config = array_merge($defaults, is_array($loaded) ? $loaded : []);
      return $config;
    }
  }

  $config = $defaults;
  return $config;
}

function cad_pdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $c = cad_load_config();
  if (($c['pass'] ?? '') === '') {
    throw new RuntimeException('Database password not configured. Create database/plesk.local.php from plesk.local.example.php');
  }

  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['name']);
  $pdo = new PDO($dsn, $c['user'], $c['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function cad_session_start(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  session_name('erlc_cad_sid');
  session_set_cookie_params([
    'lifetime' => 7 * 24 * 60 * 60,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ]);
  session_start();
}

function cad_json(int $code, array $payload): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

function cad_body(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function cad_method(): string {
  return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function cad_query(string $sql, array $params = []): array {
  $stmt = cad_pdo()->prepare($sql);
  $stmt->execute($params);
  return $stmt->fetchAll();
}

function cad_query_one(string $sql, array $params = []): ?array {
  $rows = cad_query($sql, $params);
  return $rows[0] ?? null;
}

function cad_exec(string $sql, array $params = []): int {
  $stmt = cad_pdo()->prepare($sql);
  $stmt->execute($params);
  return (int) cad_pdo()->lastInsertId();
}

function cad_public_user(?array $row): ?array {
  if (!$row) return null;
  $perms = $row['permissions'] ?? null;
  if (is_string($perms)) $perms = json_decode($perms, true);
  return [
    'id' => (int) $row['id'],
    'username' => $row['username'],
    'displayName' => $row['display_name'],
    'email' => $row['email'] ?? null,
    'avatar' => $row['avatar'] ?? null,
    'role' => $row['role'],
    'departmentId' => $row['department_id'] ? (int) $row['department_id'] : null,
    'rankId' => $row['rank_id'] ? (int) $row['rank_id'] : null,
    'permissions' => is_array($perms) ? $perms : [],
  ];
}

function cad_user_full(int $id): ?array {
  $row = cad_query_one(
    'SELECT u.*, d.name AS department_name, d.type AS department_type, r.name AS rank_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN ranks r ON r.id = u.rank_id
     WHERE u.id = ? AND u.is_active = 1',
    [$id]
  );
  if (!$row) return null;
  $user = cad_public_user($row);
  $user['departmentName'] = $row['department_name'];
  $user['departmentType'] = $row['department_type'];
  $user['rankName'] = $row['rank_name'];
  return $user;
}

function cad_require_auth(): array {
  cad_session_start();
  if (empty($_SESSION['user']['id'])) {
    cad_json(401, ['ok' => false, 'error' => 'Not authenticated.']);
  }
  return $_SESSION['user'];
}

function cad_require_role(array $user, string ...$roles): void {
  if ($user['role'] === 'admin' || in_array($user['role'], $roles, true)) return;
  cad_json(403, ['ok' => false, 'error' => 'Access denied.']);
}

function cad_audit(?int $userId, string $action, ?string $entityType = null, ?int $entityId = null, ?array $details = null): void {
  try {
    cad_exec(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip) VALUES (?,?,?,?,?,?)',
      [
        $userId,
        $action,
        $entityType,
        $entityId,
        $details ? json_encode($details) : null,
        $_SERVER['REMOTE_ADDR'] ?? null,
      ]
    );
  } catch (Throwable) {
    /* non-fatal */
  }
}

function cad_char_row(array $r): array {
  return [
    'id' => (int) $r['id'],
    'userId' => (int) $r['user_id'],
    'firstName' => $r['first_name'],
    'lastName' => $r['last_name'],
    'dob' => $r['dob'],
    'gender' => $r['gender'],
    'address' => $r['address'],
    'phone' => $r['phone'],
    'licenses' => $r['licenses'] ? json_decode($r['licenses'], true) : new stdClass(),
    'notes' => $r['notes'],
    'createdAt' => $r['created_at'],
  ];
}

function cad_vehicle_row(array $r): array {
  return [
    'id' => (int) $r['id'],
    'characterId' => (int) $r['character_id'],
    'plate' => $r['plate'],
    'make' => $r['make'],
    'model' => $r['model'],
    'color' => $r['color'],
    'year' => $r['year'] ? (int) $r['year'] : null,
    'stolen' => (bool) $r['stolen'],
    'registrationStatus' => $r['registration_status'],
    'ownerFirst' => $r['first_name'] ?? null,
    'ownerLast' => $r['last_name'] ?? null,
  ];
}

function cad_call_row(array $r): array {
  return [
    'id' => (int) $r['id'],
    'callerName' => $r['caller_name'],
    'callerPhone' => $r['caller_phone'],
    'location' => $r['location'],
    'description' => $r['description'],
    'type' => $r['type'],
    'priority' => (int) $r['priority'],
    'status' => $r['status'],
    'createdBy' => $r['created_by'] ? (int) $r['created_by'] : null,
    'createdAt' => $r['created_at'],
    'closedAt' => $r['closed_at'],
    'assignedUnits' => !empty($r['assigned_units']) ? explode(',', $r['assigned_units']) : [],
  ];
}

function cad_ensure_dev_admin(): void {
  $c = cad_load_config();
  $existing = cad_query_one('SELECT * FROM users WHERE username = ? AND is_active = 1', ['admin']);
  $hash = password_hash($c['dev_login_password'], PASSWORD_BCRYPT);
  if ($existing) {
    if (empty($existing['password_hash'])) {
      cad_exec('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [$hash, 'admin', $existing['id']]);
    }
    return;
  }
  $dept = cad_query_one("SELECT id FROM departments WHERE type = 'admin' LIMIT 1");
  cad_exec(
    'INSERT INTO users (username, display_name, role, department_id, password_hash, permissions) VALUES (?,?,?,?,?,?)',
    ['admin', 'System Administrator', 'admin', $dept['id'] ?? null, $hash, '["admin.all"]']
  );
}

function cad_path(): string {
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
  $uri = preg_replace('#/+#', '/', $uri);
  if (str_starts_with($uri, '/api/')) {
    return trim(substr($uri, 5), '/');
  }
  return trim($uri, '/');
}
