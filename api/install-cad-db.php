<?php
declare(strict_types=1);
/**
 * One-time ER:LC CAD database installer for Plesk.
 * Visit: /api/install-cad-db.php?key=YOUR_SETUP_KEY
 * DELETE THIS FILE after successful install.
 */

header('Content-Type: text/plain; charset=utf-8');

$configFile = __DIR__ . '/../database/plesk.local.php';
$config = file_exists($configFile) ? require $configFile : [];

$setupKey = $config['setup_key'] ?? getenv('CAD_SETUP_KEY') ?: '';
$providedKey = (string) ($_GET['key'] ?? '');

if ($setupKey === '' || !hash_equals($setupKey, $providedKey)) {
  http_response_code(403);
  exit("Forbidden. Set setup_key in database/plesk.local.php or CAD_SETUP_KEY env, then visit ?key=...\n");
}

$host = $config['host'] ?? getenv('DB_HOST') ?: 'localhost';
$port = (int) ($config['port'] ?? getenv('DB_PORT') ?: 3306);
$user = $config['user'] ?? getenv('DB_USER') ?: 'prestonh_database';
$pass = $config['pass'] ?? getenv('DB_PASSWORD') ?: '';
$name = $config['name'] ?? getenv('DB_NAME') ?: 'prestonh_database';

if ($pass === '') {
  http_response_code(500);
  exit("Database password not set. Copy database/plesk.local.example.php to database/plesk.local.php and fill in your Plesk Connection info.\n");
}

$sqlFile = __DIR__ . '/../database/install-all.sql';
if (!file_exists($sqlFile)) {
  $sqlFile = __DIR__ . '/install-all.sql';
}
if (!file_exists($sqlFile)) {
  http_response_code(500);
  exit("Missing install-all.sql\n");
}

try {
  $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  ]);

  $sql = file_get_contents($sqlFile);
  $statements = array_filter(
    array_map('trim', explode(';', $sql)),
    static fn ($s) => $s !== '' && !str_starts_with($s, '--')
  );

  $count = 0;
  foreach ($statements as $statement) {
    $pdo->exec($statement);
    $count++;
  }

  echo "OK — CAD database installed in {$name}\n";
  echo "Executed {$count} SQL statements.\n";
  echo "Tables: departments, users, characters, vehicles, calls, units, etc.\n\n";
  echo "NEXT STEPS:\n";
  echo "1. Delete api/install-cad-db.php (this file)\n";
  echo "2. Enable Node.js on Plesk with startup file app.js\n";
  echo "3. Set DB_* env vars in Node.js settings\n";
  echo "4. Visit https://prestonhq.com/api/health\n";
} catch (Throwable $e) {
  http_response_code(500);
  echo "Install failed: " . $e->getMessage() . "\n";
}
