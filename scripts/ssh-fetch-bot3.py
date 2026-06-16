import sys
import paramiko

HOST = "172.82.64.171"
USER = "root"
PASS = "0625$$Odie$$"

cmds = [
    "ls -la /root/bots/bot3",
    "find /root/bots/bot3 -maxdepth 4 -type f \\( -name '*.js' -o -name '*.json' \\) ! -path '*/node_modules/*' 2>/dev/null",
    "cat /root/bots/bot3/package.json 2>/dev/null",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=25)

for cmd in cmds:
    print(f"\n=== {cmd} ===")
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode(errors="replace")
    sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err.strip():
        print("ERR:", err)

client.close()
