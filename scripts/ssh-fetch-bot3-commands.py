import sys
import paramiko

HOST = "172.82.64.171"
USER = "root"
PASS = "0625$$Odie$$"

cmds = [
    "find /root/bots/bot3/src/commands -type f -name '*.js' 2>/dev/null | sort",
    "cat /root/bots/bot3/src/register-commands.js",
    "cat /root/bots/bot3/src/index.js",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=25)

for cmd in cmds:
    print(f"\n===== CMD: {cmd[:80]} =====\n")
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode(errors="replace")
    sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))
    sys.stdout.buffer.write(b"\n")

client.close()
