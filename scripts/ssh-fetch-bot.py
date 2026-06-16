import paramiko

HOST = "172.82.64.171"
USER = "root"
PASS = "0625$$Odie$$"

cmds = [
    "ls -la /root",
    "find /root /home /opt /var/www /srv -maxdepth 5 -type f \\( -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.json' \\) 2>/dev/null | head -80",
    "find /root /home /opt /var/www /srv -maxdepth 4 -type d -iname '*bot*' 2>/dev/null",
    "pm2 list 2>/dev/null || systemctl list-units --type=service 2>/dev/null | grep -i bot || true",
    "docker ps 2>/dev/null || true",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=25)

for cmd in cmds:
    print(f"\n=== {cmd} ===")
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    print(stdout.read().decode(errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err.strip():
        print("ERR:", err)

client.close()
