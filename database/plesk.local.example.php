<?php
/**
 * Plesk database credentials — copy to plesk.local.php and fill in.
 * plesk.local.php is gitignored (never commit your password).
 */
return [
  'host' => 'localhost',
  'port' => 3306,
  'user' => 'prestonh_database',
  'pass' => 'PASTE_PASSWORD_FROM_PLESK_CONNECTION_INFO',
  'name' => 'prestonh_database',
  'dev_login' => true,
  'dev_login_password' => 'admin123',
  'server_name' => 'Liberty County CAD',
  'setup_key' => 'liberty-cad-setup-2026',
];
