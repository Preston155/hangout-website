<?php
/**
 * Copy to config.php on the server (do not commit config.php).
 */
return [
    // Admin dashboard password (same as you use in the UI)
    'password' => 'COARP',

    // Path to data folder (default: ../data from this file)
    'data_dir' => dirname(__DIR__) . '/data',

    // Optional: absolute path to git repo on server for auto-push on publish
    'git_repo' => '',
];
