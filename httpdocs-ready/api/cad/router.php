<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (cad_method() === 'OPTIONS') {
  cad_json(204, []);
}

try {
  cad_pdo();
} catch (Throwable $e) {
  cad_json(503, ['ok' => false, 'error' => $e->getMessage()]);
}

$method = cad_method();
$path = cad_path();
$segments = $path === '' ? [] : explode('/', $path);
$body = cad_body();

// ─── Auth ────────────────────────────────────────────────────────────────────

if ($path === 'auth/me' && $method === 'GET') {
  cad_session_start();
  if (empty($_SESSION['user']['id'])) {
    cad_json(200, ['ok' => true, 'user' => null]);
  }
  $user = cad_user_full((int) $_SESSION['user']['id']);
  if (!$user) {
    session_destroy();
    cad_json(200, ['ok' => true, 'user' => null]);
  }
  $_SESSION['user'] = $user;
  cad_json(200, ['ok' => true, 'user' => $user]);
}

if ($path === 'auth/logout' && $method === 'POST') {
  cad_session_start();
  session_destroy();
  cad_json(200, ['ok' => true]);
}

if ($path === 'auth/dev-login' && $method === 'POST') {
  $c = cad_load_config();
  if (empty($c['dev_login'])) {
    cad_json(403, ['ok' => false, 'error' => 'Dev login disabled.']);
  }
  cad_ensure_dev_admin();
  $username = trim((string) ($body['username'] ?? 'admin'));
  $password = (string) ($body['password'] ?? '');
  $row = cad_query_one('SELECT * FROM users WHERE username = ? AND is_active = 1', [$username]);
  if (!$row || empty($row['password_hash']) || !password_verify($password, $row['password_hash'])) {
    cad_json(401, ['ok' => false, 'error' => 'Invalid credentials.']);
  }
  cad_session_start();
  cad_exec('UPDATE users SET last_login = NOW() WHERE id = ?', [$row['id']]);
  $user = cad_user_full((int) $row['id']);
  $_SESSION['user'] = $user;
  cad_audit((int) $row['id'], 'auth.dev_login', 'user', (int) $row['id']);
  cad_json(200, ['ok' => true, 'user' => $user]);
}

// ─── Config ──────────────────────────────────────────────────────────────────

if ($path === 'config' && $method === 'GET') {
  $c = cad_load_config();
  $config = ['serverName' => $c['server_name'], 'serverLogo' => $c['server_logo']];
  foreach (cad_query('SELECT config_key, config_value FROM server_config') as $r) {
    if ($r['config_key'] === 'server_name') $config['serverName'] = $r['config_value'];
    if ($r['config_key'] === 'server_logo') $config['serverLogo'] = $r['config_value'];
  }
  cad_json(200, ['ok' => true, 'config' => $config]);
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

if ($path === 'dashboard/stats' && $method === 'GET') {
  cad_require_auth();
  $activeCalls = cad_query_one("SELECT COUNT(*) AS c FROM calls WHERE status IN ('pending','active')");
  $activeUnits = cad_query_one("SELECT COUNT(*) AS c FROM units WHERE status NOT IN ('offduty')");
  $activeBolos = cad_query_one("SELECT COUNT(*) AS c FROM bolos WHERE status='active'");
  $activeWarrants = cad_query_one("SELECT COUNT(*) AS c FROM warrants WHERE status='active'");
  cad_json(200, [
    'ok' => true,
    'stats' => [
      'activeCalls' => (int) ($activeCalls['c'] ?? 0),
      'activeUnits' => (int) ($activeUnits['c'] ?? 0),
      'activeBolos' => (int) ($activeBolos['c'] ?? 0),
      'activeWarrants' => (int) ($activeWarrants['c'] ?? 0),
    ],
  ]);
}

// ─── Characters ──────────────────────────────────────────────────────────────

if ($path === 'characters/mine' && $method === 'GET') {
  $user = cad_require_auth();
  $rows = cad_query('SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC', [$user['id']]);
  cad_json(200, ['ok' => true, 'characters' => array_map('cad_char_row', $rows)]);
}

if ($path === 'characters' && $method === 'POST') {
  $user = cad_require_auth();
  $first = trim((string) ($body['firstName'] ?? ''));
  $last = trim((string) ($body['lastName'] ?? ''));
  if ($first === '' || $last === '') cad_json(400, ['ok' => false, 'error' => 'Name required.']);
  $id = cad_exec(
    'INSERT INTO characters (user_id, first_name, last_name, dob, gender, address, phone, licenses, notes) VALUES (?,?,?,?,?,?,?,?,?)',
    [
      $user['id'], $first, $last,
      $body['dob'] ?? null, $body['gender'] ?? null, $body['address'] ?? null, $body['phone'] ?? null,
      isset($body['licenses']) ? json_encode($body['licenses']) : null,
      $body['notes'] ?? null,
    ]
  );
  cad_audit($user['id'], 'character.create', 'character', $id);
  $row = cad_query_one('SELECT * FROM characters WHERE id = ?', [$id]);
  cad_json(200, ['ok' => true, 'character' => cad_char_row($row)]);
}

if (preg_match('#^characters/(\d+)$#', $path, $m) && $method === 'PUT') {
  $user = cad_require_auth();
  $id = (int) $m[1];
  $char = cad_query_one('SELECT * FROM characters WHERE id = ? AND user_id = ?', [$id, $user['id']]);
  if (!$char) cad_json(404, ['ok' => false, 'error' => 'Character not found.']);
  cad_exec(
    'UPDATE characters SET first_name=?, last_name=?, dob=?, gender=?, address=?, phone=? WHERE id=?',
    [
      $body['firstName'] ?? $char['first_name'],
      $body['lastName'] ?? $char['last_name'],
      $body['dob'] ?? $char['dob'],
      $body['gender'] ?? $char['gender'],
      $body['address'] ?? $char['address'],
      $body['phone'] ?? $char['phone'],
      $id,
    ]
  );
  cad_audit($user['id'], 'character.update', 'character', $id);
  $row = cad_query_one('SELECT * FROM characters WHERE id = ?', [$id]);
  cad_json(200, ['ok' => true, 'character' => cad_char_row($row)]);
}

if ($path === 'characters/search' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'dispatch', 'admin');
  $q = '%' . trim((string) ($_GET['q'] ?? '')) . '%';
  if ($q === '%%') cad_json(200, ['ok' => true, 'results' => []]);
  $rows = cad_query(
    "SELECT * FROM characters WHERE first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name,' ',last_name) LIKE ? LIMIT 50",
    [$q, $q, $q]
  );
  cad_json(200, ['ok' => true, 'results' => array_map('cad_char_row', $rows)]);
}

if (preg_match('#^characters/(\d+)/records$#', $path, $m) && $method === 'GET') {
  $user = cad_require_auth();
  $id = (int) $m[1];
  $char = cad_query_one('SELECT * FROM characters WHERE id = ?', [$id]);
  if (!$char) cad_json(404, ['ok' => false, 'error' => 'Not found.']);
  if ((int) $char['user_id'] !== $user['id'] && !in_array($user['role'], ['police', 'dispatch', 'admin', 'fire', 'ems'], true)) {
    cad_json(403, ['ok' => false, 'error' => 'Access denied.']);
  }
  $citations = cad_query('SELECT c.*, u.display_name AS officer_name FROM citations c JOIN users u ON u.id=c.officer_id WHERE c.character_id=? ORDER BY c.created_at DESC', [$id]);
  $warnings = cad_query('SELECT w.*, u.display_name AS officer_name FROM warnings w JOIN users u ON u.id=w.officer_id WHERE w.character_id=? ORDER BY w.created_at DESC', [$id]);
  $arrests = cad_query('SELECT a.*, u.display_name AS officer_name FROM arrests a JOIN users u ON u.id=a.officer_id WHERE a.character_id=? ORDER BY a.created_at DESC', [$id]);
  $warrants = cad_query('SELECT w.*, u.display_name AS officer_name FROM warrants w JOIN users u ON u.id=w.officer_id WHERE w.character_id=? ORDER BY w.created_at DESC', [$id]);
  $vehicles = cad_query('SELECT * FROM vehicles WHERE character_id=?', [$id]);
  foreach ($arrests as &$a) {
    $a['charges'] = json_decode($a['charges'] ?? '[]', true);
  }
  unset($a);
  cad_json(200, [
    'ok' => true,
    'character' => cad_char_row($char),
    'citations' => $citations,
    'warnings' => $warnings,
    'arrests' => $arrests,
    'warrants' => $warrants,
    'vehicles' => array_map('cad_vehicle_row', $vehicles),
  ]);
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

if ($path === 'vehicles' && $method === 'POST') {
  $user = cad_require_auth();
  $charId = (int) ($body['characterId'] ?? 0);
  $char = cad_query_one('SELECT * FROM characters WHERE id = ? AND user_id = ?', [$charId, $user['id']]);
  if (!$char) cad_json(404, ['ok' => false, 'error' => 'Character not found.']);
  $plate = strtoupper(trim((string) ($body['plate'] ?? '')));
  $make = trim((string) ($body['make'] ?? ''));
  $model = trim((string) ($body['model'] ?? ''));
  if ($plate === '' || $make === '' || $model === '') cad_json(400, ['ok' => false, 'error' => 'Plate, make, and model required.']);
  try {
    $id = cad_exec(
      'INSERT INTO vehicles (character_id, plate, make, model, color, year) VALUES (?,?,?,?,?,?)',
      [$charId, $plate, $make, $model, $body['color'] ?? null, $body['year'] ?? null]
    );
    cad_audit($user['id'], 'vehicle.create', 'vehicle', $id);
    $row = cad_query_one('SELECT v.*, c.first_name, c.last_name FROM vehicles v JOIN characters c ON c.id=v.character_id WHERE v.id=?', [$id]);
    cad_json(200, ['ok' => true, 'vehicle' => cad_vehicle_row($row)]);
  } catch (PDOException $e) {
    if ($e->getCode() === '23000') cad_json(400, ['ok' => false, 'error' => 'Plate already registered.']);
    throw $e;
  }
}

if ($path === 'vehicles/search' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'dispatch', 'admin');
  $plate = strtoupper(trim((string) ($_GET['plate'] ?? '')));
  if ($plate === '') cad_json(200, ['ok' => true, 'results' => []]);
  $rows = cad_query(
    'SELECT v.*, c.first_name, c.last_name FROM vehicles v JOIN characters c ON c.id=v.character_id WHERE v.plate LIKE ? LIMIT 20',
    ["%{$plate}%"]
  );
  cad_json(200, ['ok' => true, 'results' => array_map('cad_vehicle_row', $rows)]);
}

// ─── Police records ──────────────────────────────────────────────────────────

if ($path === 'citations' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'admin');
  $charId = (int) ($body['characterId'] ?? 0);
  $charge = trim((string) ($body['charge'] ?? ''));
  if (!$charId || $charge === '') cad_json(400, ['ok' => false, 'error' => 'Character and charge required.']);
  $id = cad_exec(
    'INSERT INTO citations (character_id, vehicle_id, officer_id, charge, fine_amount, location, notes) VALUES (?,?,?,?,?,?,?)',
    [$charId, $body['vehicleId'] ?? null, $user['id'], $charge, $body['fineAmount'] ?? 0, $body['location'] ?? null, $body['notes'] ?? null]
  );
  cad_audit($user['id'], 'citation.create', 'citation', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'warnings' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'admin');
  $charId = (int) ($body['characterId'] ?? 0);
  $reason = trim((string) ($body['reason'] ?? ''));
  if (!$charId || $reason === '') cad_json(400, ['ok' => false, 'error' => 'Character and reason required.']);
  $id = cad_exec(
    'INSERT INTO warnings (character_id, officer_id, reason, location, notes) VALUES (?,?,?,?,?)',
    [$charId, $user['id'], $reason, $body['location'] ?? null, $body['notes'] ?? null]
  );
  cad_audit($user['id'], 'warning.create', 'warning', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'arrests' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'admin');
  $charId = (int) ($body['characterId'] ?? 0);
  $charges = $body['charges'] ?? [];
  if (!$charId || !is_array($charges) || count($charges) === 0) cad_json(400, ['ok' => false, 'error' => 'Character and charges required.']);
  $id = cad_exec(
    'INSERT INTO arrests (character_id, officer_id, charges, location, narrative) VALUES (?,?,?,?,?)',
    [$charId, $user['id'], json_encode($charges), $body['location'] ?? null, $body['narrative'] ?? null]
  );
  cad_audit($user['id'], 'arrest.create', 'arrest', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'warrants' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'admin');
  $charId = (int) ($body['characterId'] ?? 0);
  $charge = trim((string) ($body['charge'] ?? ''));
  if (!$charId || $charge === '') cad_json(400, ['ok' => false, 'error' => 'Character and charge required.']);
  $id = cad_exec(
    'INSERT INTO warrants (character_id, officer_id, charge, notes) VALUES (?,?,?,?)',
    [$charId, $user['id'], $charge, $body['notes'] ?? null]
  );
  cad_audit($user['id'], 'warrant.create', 'warrant', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

// ─── BOLOs ───────────────────────────────────────────────────────────────────

if ($path === 'bolos' && $method === 'GET') {
  cad_require_auth();
  $status = $_GET['status'] ?? 'active';
  $rows = cad_query(
    'SELECT b.*, u.display_name AS creator_name FROM bolos b JOIN users u ON u.id=b.creator_id WHERE b.status=? ORDER BY b.created_at DESC LIMIT 100',
    [$status]
  );
  cad_json(200, ['ok' => true, 'bolos' => $rows]);
}

if ($path === 'bolos' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'dispatch', 'admin');
  $type = $body['type'] ?? '';
  $subject = trim((string) ($body['subject'] ?? ''));
  $desc = trim((string) ($body['description'] ?? ''));
  if (!$type || $subject === '' || $desc === '') cad_json(400, ['ok' => false, 'error' => 'Type, subject, and description required.']);
  $id = cad_exec(
    'INSERT INTO bolos (creator_id, type, subject, description, plate) VALUES (?,?,?,?,?)',
    [$user['id'], $type, $subject, $desc, $body['plate'] ?? null]
  );
  cad_audit($user['id'], 'bolo.create', 'bolo', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if (preg_match('#^bolos/(\d+)/clear$#', $path, $m) && $method === 'PATCH') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'dispatch', 'admin');
  cad_exec("UPDATE bolos SET status='cleared' WHERE id=?", [(int) $m[1]]);
  cad_audit($user['id'], 'bolo.clear', 'bolo', (int) $m[1]);
  cad_json(200, ['ok' => true]);
}

// ─── Calls ───────────────────────────────────────────────────────────────────

if ($path === 'calls' && $method === 'GET') {
  cad_require_auth();
  $status = $_GET['status'] ?? null;
  $sql = 'SELECT c.*, GROUP_CONCAT(u.callsign) AS assigned_units FROM calls c
    LEFT JOIN call_assignments ca ON ca.call_id = c.id
    LEFT JOIN units u ON u.id = ca.unit_id';
  $params = [];
  if ($status) {
    $sql .= ' WHERE c.status = ?';
    $params[] = $status;
  }
  $sql .= ' GROUP BY c.id ORDER BY c.priority ASC, c.created_at DESC LIMIT 200';
  cad_json(200, ['ok' => true, 'calls' => array_map('cad_call_row', cad_query($sql, $params))]);
}

if ($path === 'calls' && $method === 'POST') {
  $user = cad_require_auth();
  $location = trim((string) ($body['location'] ?? ''));
  $desc = trim((string) ($body['description'] ?? ''));
  if ($location === '' || $desc === '') cad_json(400, ['ok' => false, 'error' => 'Location and description required.']);
  $callType = $body['type'] ?? ($user['role'] === 'civilian' ? 'police' : 'other');
  $id = cad_exec(
    "INSERT INTO calls (caller_name, caller_phone, location, description, type, priority, status, created_by) VALUES (?,?,?,?,?,?,?,?)",
    [
      $body['callerName'] ?? $user['displayName'],
      $body['callerPhone'] ?? null,
      $location, $desc, $callType,
      (int) ($body['priority'] ?? 3),
      'pending',
      $user['id'],
    ]
  );
  cad_audit($user['id'], 'call.create', 'call', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if (preg_match('#^calls/(\d+)$#', $path, $m) && $method === 'PATCH') {
  $user = cad_require_auth();
  cad_require_role($user, 'dispatch', 'police', 'fire', 'ems', 'admin');
  $updates = [];
  $params = [];
  if (isset($body['priority'])) {
    $updates[] = 'priority=?';
    $params[] = (int) $body['priority'];
  }
  if (!empty($body['status'])) {
    $updates[] = 'status=?';
    $params[] = $body['status'];
    if ($body['status'] === 'closed') $updates[] = 'closed_at=NOW()';
  }
  if (!$updates) cad_json(400, ['ok' => false, 'error' => 'Nothing to update.']);
  $params[] = (int) $m[1];
  cad_exec('UPDATE calls SET ' . implode(',', $updates) . ' WHERE id=?', $params);
  cad_audit($user['id'], 'call.update', 'call', (int) $m[1], $body);
  cad_json(200, ['ok' => true]);
}

if (preg_match('#^calls/(\d+)/assign$#', $path, $m) && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'dispatch', 'admin');
  $unitId = (int) ($body['unitId'] ?? 0);
  if (!$unitId) cad_json(400, ['ok' => false, 'error' => 'Unit required.']);
  $callId = (int) $m[1];
  cad_exec('INSERT IGNORE INTO call_assignments (call_id, unit_id) VALUES (?,?)', [$callId, $unitId]);
  cad_exec("UPDATE calls SET status='active' WHERE id=? AND status='pending'", [$callId]);
  cad_exec("UPDATE units SET status='enroute' WHERE id=?", [$unitId]);
  cad_audit($user['id'], 'call.assign', 'call', $callId, ['unitId' => $unitId]);
  cad_json(200, ['ok' => true]);
}

if ($path === 'calls/fire-medical' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'fire', 'ems', 'dispatch', 'admin');
  $rows = cad_query(
    "SELECT c.*, GROUP_CONCAT(u.callsign) AS assigned_units FROM calls c
     LEFT JOIN call_assignments ca ON ca.call_id=c.id LEFT JOIN units u ON u.id=ca.unit_id
     WHERE c.type IN ('fire','medical') AND c.status != 'closed'
     GROUP BY c.id ORDER BY c.priority, c.created_at DESC"
  );
  cad_json(200, ['ok' => true, 'calls' => array_map('cad_call_row', $rows)]);
}

// ─── Units ───────────────────────────────────────────────────────────────────

if ($path === 'units' && $method === 'GET') {
  cad_require_auth();
  $rows = cad_query(
    'SELECT un.*, u.display_name, d.name AS department_name, d.type AS department_type
     FROM units un JOIN users u ON u.id=un.user_id JOIN departments d ON d.id=un.department_id
     ORDER BY un.status, un.callsign'
  );
  cad_json(200, [
    'ok' => true,
    'units' => array_map(static fn ($r) => [
      'id' => (int) $r['id'],
      'userId' => (int) $r['user_id'],
      'displayName' => $r['display_name'],
      'departmentName' => $r['department_name'],
      'departmentType' => $r['department_type'],
      'callsign' => $r['callsign'],
      'status' => $r['status'],
      'lastUpdate' => $r['last_update'],
    ], $rows),
  ]);
}

if ($path === 'units/register' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'fire', 'ems', 'dispatch', 'admin');
  $row = cad_query_one('SELECT department_id FROM users WHERE id=?', [$user['id']]);
  if (empty($row['department_id'])) cad_json(400, ['ok' => false, 'error' => 'No department assigned.']);
  $existing = cad_query_one('SELECT id FROM units WHERE user_id=?', [$user['id']]);
  $callsign = $body['callsign'] ?? strtoupper($user['role']) . '-1';
  if ($existing) {
    cad_exec("UPDATE units SET callsign=?, status='available' WHERE user_id=?", [$callsign, $user['id']]);
    cad_json(200, ['ok' => true, 'id' => (int) $existing['id']]);
  }
  $id = cad_exec(
    "INSERT INTO units (user_id, department_id, callsign, status) VALUES (?,?,?,'available')",
    [$user['id'], $row['department_id'], $callsign]
  );
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'units/status' && $method === 'PATCH') {
  $user = cad_require_auth();
  cad_require_role($user, 'police', 'fire', 'ems', 'dispatch', 'admin');
  $status = $body['status'] ?? '';
  $valid = ['available', 'busy', 'enroute', 'onscene', 'transport', 'panic', 'offduty'];
  if (!in_array($status, $valid, true)) cad_json(400, ['ok' => false, 'error' => 'Invalid status.']);
  cad_exec('UPDATE units SET status=? WHERE user_id=?', [$status, $user['id']]);
  cad_audit($user['id'], $status === 'panic' ? 'unit.panic' : 'unit.status', 'unit', $user['id'], ['status' => $status]);
  cad_json(200, ['ok' => true, 'panic' => $status === 'panic']);
}

// ─── Patient reports ─────────────────────────────────────────────────────────

if ($path === 'patient-reports' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'fire', 'ems', 'admin');
  $name = trim((string) ($body['patientName'] ?? ''));
  if ($name === '') cad_json(400, ['ok' => false, 'error' => 'Patient name required.']);
  $unit = cad_query_one('SELECT id FROM units WHERE user_id=?', [$user['id']]);
  if (!$unit) cad_json(400, ['ok' => false, 'error' => 'Register your unit first.']);
  $id = cad_exec(
    'INSERT INTO patient_reports (call_id, unit_id, patient_name, vitals, treatment, transport_hospital, transport_status) VALUES (?,?,?,?,?,?,?)',
    [
      $body['callId'] ?? null,
      $unit['id'],
      $name,
      isset($body['vitals']) ? json_encode($body['vitals']) : null,
      $body['treatment'] ?? null,
      $body['transportHospital'] ?? null,
      $body['transportStatus'] ?? 'none',
    ]
  );
  cad_audit($user['id'], 'patient_report.create', 'patient_report', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

if ($path === 'admin/users' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  cad_json(200, ['ok' => true, 'users' => cad_query(
    'SELECT u.id, u.username, u.display_name, u.email, u.role, u.is_active, u.last_login, d.name AS department_name, r.name AS rank_name
     FROM users u LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN ranks r ON r.id=u.rank_id ORDER BY u.created_at DESC'
  )]);
}

if (preg_match('#^admin/users/(\d+)$#', $path, $m) && $method === 'PATCH') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  cad_exec(
    'UPDATE users SET role=COALESCE(?,role), department_id=?, rank_id=?, is_active=COALESCE(?,is_active) WHERE id=?',
    [
      $body['role'] ?? null,
      $body['departmentId'] ?? null,
      $body['rankId'] ?? null,
      $body['isActive'] ?? null,
      (int) $m[1],
    ]
  );
  cad_audit($user['id'], 'admin.user_update', 'user', (int) $m[1], $body);
  cad_json(200, ['ok' => true]);
}

if ($path === 'admin/departments' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  cad_json(200, ['ok' => true, 'departments' => cad_query('SELECT * FROM departments ORDER BY name')]);
}

if ($path === 'admin/departments' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  $id = cad_exec(
    'INSERT INTO departments (name, type, callsign_prefix, color) VALUES (?,?,?,?)',
    [$body['name'] ?? '', $body['type'] ?? '', $body['callsignPrefix'] ?? '', $body['color'] ?? '#2563eb']
  );
  cad_audit($user['id'], 'admin.dept_create', 'department', $id);
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'admin/ranks' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  cad_json(200, ['ok' => true, 'ranks' => cad_query(
    'SELECT r.*, d.name AS department_name FROM ranks r JOIN departments d ON d.id=r.department_id ORDER BY d.name, r.level'
  )]);
}

if ($path === 'admin/ranks' && $method === 'POST') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  $id = cad_exec(
    'INSERT INTO ranks (department_id, name, level, permissions) VALUES (?,?,?,?)',
    [
      $body['departmentId'] ?? null,
      $body['name'] ?? '',
      (int) ($body['level'] ?? 1),
      json_encode($body['permissions'] ?? []),
    ]
  );
  cad_json(200, ['ok' => true, 'id' => $id]);
}

if ($path === 'admin/audit' && $method === 'GET') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  $logs = cad_query(
    'SELECT a.*, u.display_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200'
  );
  foreach ($logs as &$log) {
    $log['details'] = $log['details'] ? json_decode($log['details'], true) : null;
  }
  unset($log);
  cad_json(200, ['ok' => true, 'logs' => $logs]);
}

if ($path === 'admin/config' && $method === 'PUT') {
  $user = cad_require_auth();
  cad_require_role($user, 'admin');
  if (!empty($body['serverName'])) {
    cad_exec(
      "INSERT INTO server_config (config_key, config_value) VALUES ('server_name',?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)",
      [$body['serverName']]
    );
  }
  if (array_key_exists('serverLogo', $body)) {
    cad_exec(
      "INSERT INTO server_config (config_key, config_value) VALUES ('server_logo',?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)",
      [$body['serverLogo']]
    );
  }
  cad_audit($user['id'], 'admin.config_update', 'config', null, $body);
  cad_json(200, ['ok' => true]);
}

cad_json(404, ['ok' => false, 'error' => 'Endpoint not found.', 'path' => $path]);
