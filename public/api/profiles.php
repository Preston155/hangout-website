<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
session_start(['cookie_httponly'=>true,'cookie_samesite'=>'Lax','cookie_secure'=>isset($_SERVER['HTTPS'])]);

$dataDir = dirname(__DIR__) . '/data';
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);
$dbPath = $dataDir . '/profiles.sqlite';

function respond(array $payload, int $code = 200): void { http_response_code($code); echo json_encode($payload, JSON_UNESCAPED_SLASHES); exit; }
function body(): array { $raw = file_get_contents('php://input') ?: ''; $json = json_decode($raw, true); return is_array($json) ? $json : []; }
function db(): PDO { global $dbPath; static $pdo = null; if ($pdo) return $pdo; $pdo = new PDO('sqlite:' . $dbPath, null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]); $pdo->exec('PRAGMA journal_mode=WAL'); migrate($pdo); return $pdo; }
function migrate(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  $pdo->exec("CREATE TABLE IF NOT EXISTS profiles (user_id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT, status TEXT NOT NULL DEFAULT 'public', profile_json TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, featured INTEGER NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)");
  $pdo->exec("CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY AUTOINCREMENT, profile_username TEXT NOT NULL, event_type TEXT NOT NULL, meta_json TEXT, ip_hash TEXT, user_agent TEXT, created_at INTEGER NOT NULL)");
  $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL)");
  $pdo->exec("CREATE TABLE IF NOT EXISTS moderation_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, target_username TEXT NOT NULL, action TEXT NOT NULL, reason TEXT, created_at INTEGER NOT NULL)");
}
function cleanUsername(string $u): string { $u = strtolower(trim($u)); if (!preg_match('/^[a-z0-9_\.]{3,24}$/', $u)) respond(['ok'=>false,'error'=>'Username must be 3-24 chars: letters, numbers, underscore, dot.'], 422); return $u; }
function currentUser(): ?array { if (empty($_SESSION['uid'])) return null; $s=db()->prepare('SELECT id,username,email,role FROM users WHERE id=?'); $s->execute([$_SESSION['uid']]); return $s->fetch() ?: null; }
function rateLimit(string $name, int $max, int $window): void { $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown'; $bucket = hash('sha256', $name.'|'.$ip); $now=time(); $pdo=db(); $row=$pdo->prepare('SELECT * FROM rate_limits WHERE bucket=?'); $row->execute([$bucket]); $r=$row->fetch(); if(!$r || (int)$r['reset_at']<$now){$pdo->prepare('REPLACE INTO rate_limits(bucket,hits,reset_at) VALUES(?,?,?)')->execute([$bucket,1,$now+$window]); return;} if((int)$r['hits'] >= $max) respond(['ok'=>false,'error'=>'Rate limited. Try again soon.'],429); $pdo->prepare('UPDATE rate_limits SET hits=hits+1 WHERE bucket=?')->execute([$bucket]); }
function sanitizeProfile(array $p): array {
  $allowedSocials=['discord','youtube','tiktok','roblox','spotify','link','kick','twitch'];
  $allowedCards=['link','video','music','discord','roblox','image','announcement','countdown','donation'];
  $p['username']=cleanUsername((string)($p['username'] ?? 'profile'));
  foreach(['displayName','headline','bio','avatar','banner','backgroundVideo','music','font','cursor'] as $k) $p[$k]=mb_substr(trim((string)($p[$k] ?? '')),0,$k==='bio'?500:220);
  $p['socials']=array_values(array_slice(array_filter($p['socials'] ?? [], 'is_array'),0,80));
  foreach($p['socials'] as &$s){$s=['type'=>in_array($s['type']??'link',$allowedSocials,true)?$s['type']:'link','label'=>mb_substr(trim((string)($s['label']??'Link')),0,80),'url'=>filter_var($s['url']??'',FILTER_VALIDATE_URL)?$s['url']:'#'];}
  $p['cards']=array_values(array_slice(array_filter($p['cards'] ?? [], 'is_array'),0,80));
  foreach($p['cards'] as &$c){$type=$c['type']??'link'; if($type==='html') $type='announcement'; $c=['type'=>in_array($type,$allowedCards,true)?$type:'link','title'=>mb_substr(trim((string)($c['title']??'Card')),0,120),'body'=>mb_substr(trim((string)($c['body']??'')),0,900),'url'=>filter_var($c['url']??'',FILTER_VALIDATE_URL)?$c['url']:'','date'=>mb_substr(trim((string)($c['date']??'')),0,80)];}
  $p['badges']=array_values(array_slice(array_map(fn($b)=>mb_substr(trim((string)$b),0,30), $p['badges'] ?? []),0,20));
  $p['effects']=['particles'=>!empty($p['effects']['particles']),'rain'=>!empty($p['effects']['rain']),'snow'=>!empty($p['effects']['snow']),'glow'=>!empty($p['effects']['glow'])];
  $p['theme']=array_merge(['name'=>'Cyber Glass','accent'=>'#66f7ff','accent2'=>'#ff4ecd','glass'=>72,'radius'=>26], is_array($p['theme']??null)?$p['theme']:[]);
  return $p;
}
function defaultProfile(string $username): array { return ['username'=>$username,'displayName'=>$username,'headline'=>'New PrestonHQ creator','bio'=>'This profile is getting built.','avatar'=>'','banner'=>'','backgroundVideo'=>'','music'=>'','theme'=>['name'=>'Cyber Glass','accent'=>'#66f7ff','accent2'=>'#ff4ecd','glass'=>72,'radius'=>26],'effects'=>['particles'=>true,'rain'=>false,'snow'=>false,'glow'=>true],'socials'=>[],'badges'=>['New'], 'cards'=>[], 'analytics'=>['views'=>0,'visitors'=>0,'clicks'=>0,'today'=>0], 'moderation'=>['status'=>'public','featured'=>false,'verified'=>false]]; }

$action = $_GET['action'] ?? (body()['action'] ?? '');
$input = body();
try {
  if ($action === 'signup') { rateLimit('signup', 6, 3600); $u=cleanUsername((string)($input['username']??'')); $email=filter_var($input['email']??'',FILTER_VALIDATE_EMAIL) ?: null; $pass=(string)($input['password']??''); if(strlen($pass)<8) respond(['ok'=>false,'error'=>'Password must be 8+ chars.'],422); $pdo=db(); $hash=password_hash($pass,PASSWORD_DEFAULT); $now=time(); $pdo->prepare('INSERT INTO users(username,email,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)')->execute([$u,$email,$hash,$now,$now]); $id=(int)$pdo->lastInsertId(); $profile=defaultProfile($u); $pdo->prepare('INSERT INTO profiles(user_id,username,display_name,profile_json,updated_at) VALUES(?,?,?,?,?)')->execute([$id,$u,$u,json_encode($profile),$now]); $_SESSION['uid']=$id; respond(['ok'=>true,'user'=>['id'=>$id,'username'=>$u,'email'=>$email,'role'=>'user'],'profile'=>$profile]); }
  if ($action === 'login') { rateLimit('login', 12, 900); $u=cleanUsername((string)($input['username']??'')); $s=db()->prepare('SELECT * FROM users WHERE username=?'); $s->execute([$u]); $user=$s->fetch(); if(!$user || !password_verify((string)($input['password']??''),$user['password_hash'])) respond(['ok'=>false,'error'=>'Invalid login.'],401); $_SESSION['uid']=(int)$user['id']; $p=db()->prepare('SELECT profile_json FROM profiles WHERE user_id=?'); $p->execute([$user['id']]); respond(['ok'=>true,'user'=>['id'=>(int)$user['id'],'username'=>$user['username'],'email'=>$user['email'],'role'=>$user['role']], 'profile'=>json_decode($p->fetchColumn() ?: '{}', true)]); }
  if ($action === 'me') { $u=currentUser(); respond(['ok'=>true,'user'=>$u]); }
  if ($action === 'save-profile') { $u=currentUser(); if(!$u) respond(['ok'=>false,'error'=>'Login required.'],401); rateLimit('save', 80, 3600); $profile=sanitizeProfile($input['profile']??[]); if($profile['username'] !== $u['username'] && $u['role'] !== 'admin') $profile['username']=$u['username']; $now=time(); db()->prepare('UPDATE profiles SET username=?, display_name=?, profile_json=?, updated_at=? WHERE user_id=?')->execute([$profile['username'],$profile['displayName'],json_encode($profile),$now,$u['id']]); respond(['ok'=>true,'profile'=>$profile]); }
  if ($action === 'profile') { $username=cleanUsername((string)($input['username']??$_GET['username']??'preston')); $s=db()->prepare("SELECT profile_json,status,views FROM profiles WHERE username=? AND status!='banned'"); $s->execute([$username]); $row=$s->fetch(); if(!$row) respond(['ok'=>false,'error'=>'Profile not found.'],404); $profile=json_decode($row['profile_json'],true) ?: defaultProfile($username); $profile['analytics']['views']=(int)$row['views']+1; db()->prepare('UPDATE profiles SET views=views+1 WHERE username=?')->execute([$username]); db()->prepare('INSERT INTO analytics_events(profile_username,event_type,ip_hash,user_agent,created_at) VALUES(?,?,?,?,?)')->execute([$username,'view',hash('sha256',$_SERVER['REMOTE_ADDR']??''),substr($_SERVER['HTTP_USER_AGENT']??'',0,250),time()]); respond(['ok'=>true,'profile'=>$profile]); }
  if ($action === 'admin-list') { $u=currentUser(); if(!$u || $u['role']!=='admin') respond(['ok'=>false,'error'=>'Admin only.'],403); $rows=db()->query('SELECT username,display_name,status,views,featured,verified,updated_at FROM profiles ORDER BY updated_at DESC LIMIT 200')->fetchAll(); respond(['ok'=>true,'profiles'=>$rows]); }
  respond(['ok'=>false,'error'=>'Unknown action'],400);
} catch (Throwable $e) { respond(['ok'=>false,'error'=>'Server error','detail'=>$e->getMessage()],500); }
