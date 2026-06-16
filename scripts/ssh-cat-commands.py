import sys
import paramiko

HOST = "172.82.64.171"
USER = "root"
PASS = "0625$$Odie$$"

files = [
    "/root/bots/bot3/src/commands/admin/setup.js",
    "/root/bots/bot3/src/commands/admin/fix-erlc-channel-permissions.js",
    "/root/bots/bot3/src/commands/admin/fix-erlc-role-order.js",
    "/root/bots/bot3/src/commands/admin/setup-erlc-roles.js",
    "/root/bots/bot3/src/commands/purge.js",
    "/root/bots/bot3/src/commands/server-roles.js",
    "/root/bots/bot3/src/commands/server-status.js",
    "/root/bots/bot3/src/commands/ticket-panel.js",
    "/root/bots/bot3/src/config.js",
    "/root/bots/bot3/src/systems/session-system.js",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=25)

for f in files:
    print(f"\n\n========== {f} ==========\n")
    _stdin, stdout, _stderr = client.exec_command(f"cat {f}", timeout=60)
    sys.stdout.buffer.write(stdout.read())

client.close()
