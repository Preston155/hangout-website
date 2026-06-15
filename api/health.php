<?php
declare(strict_types=1);
require __DIR__ . '/common.php';
handle_options();
send_json(200, ['ok' => true, 'mode' => 'php', 'engine' => 'plesk']);
