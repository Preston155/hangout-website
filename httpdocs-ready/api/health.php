<?php
declare(strict_types=1);

require __DIR__ . '/common.php';
handle_options();

try {
  require __DIR__ . '/cad/bootstrap.php';
  cad_pdo();
  cad_json(200, ['ok' => true, 'mode' => 'cad', 'database' => 'connected', 'engine' => 'php']);
} catch (Throwable $e) {
  send_json(503, ['ok' => false, 'mode' => 'cad', 'database' => 'disconnected', 'error' => $e->getMessage()]);
}
