import json
import re
import sys
import paramiko

HOST = "172.82.64.171"
USER = "root"
PASS = "0625$$Odie$$"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=25)

# Fetch all command js files + config + index for prefix commands
cmd = r"""python3 << 'PY'
import os, re, json

def extract_slash(path):
    text = open(path, encoding='utf-8').read()
    name = re.search(r"setName\(['\"]([^'\"]+)['\"]\)", text)
    desc = re.search(r"setDescription\(['\"]([^'\"]+)['\"]\)", text)
    opts = re.findall(r"\.add(?:String|Integer|Boolean|User|Channel|Role)?Option\([^)]*?setName\(['\"]([^'\"]+)['\"]\)[^)]*?setDescription\(['\"]([^'\"]+)['\"]\)", text, re.S)
    sub = re.findall(r"\.addSubcommand\([^)]*?setName\(['\"]([^'\"]+)['\"]\)[^)]*?setDescription\(['\"]([^'\"]+)['\"]\)", text, re.S)
    return {
        'file': path.replace('/root/bots/bot3/', ''),
        'name': name.group(1) if name else os.path.basename(path).replace('.js',''),
        'description': desc.group(1) if desc else '',
        'options': [{'name': o[0], 'description': o[1]} for o in opts],
        'subcommands': [{'name': s[0], 'description': s[1]} for s in sub],
    }

commands = []
for root, _, files in os.walk('/root/bots/bot3/src/commands'):
    for f in sorted(files):
        if f.endswith('.js'):
            commands.append(extract_slash(os.path.join(root, f)))

# prefix from config
cfg = open('/root/bots/bot3/src/config.js', encoding='utf-8').read()
prefix = re.search(r"prefix:\s*['\"]([^'\"]+)['\"]", cfg)
prefix = prefix.group(1) if prefix else '!'

# prefix handlers from index - rough extract case strings
idx = open('/root/bots/bot3/src/index.js', encoding='utf-8').read()
prefix_cmds = re.findall(r"case\s+['\"]([^'\"]+)['\"]", idx)
prefix_cmds = sorted(set(prefix_cmds))

# session aliases from latest backup or session-system
try:
    ss = open('/root/bots/bot3/src/systems/session-system.js', encoding='utf-8').read()
    session_help = re.search(r"session help[^\\n]*|aliases[^\\n]*", ss, re.I)
except Exception:
    session_help = None

print(json.dumps({
    'botName': 'Bot3',
    'package': 'veltrix-lcrp-bot',
    'prefix': prefix,
    'slashCommands': commands,
    'prefixCommands': prefix_cmds,
}, indent=2))
PY"""

_stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
client.close()

if err.strip():
    print(err, file=sys.stderr)

# write commands json
with open(r'C:\Users\Preston\Desktop\guns\public\data\bot-commands.json', 'w', encoding='utf-8') as f:
    # find json in output
    start = out.find('{')
    data = out[start:]
    f.write(data)
    print('Wrote', len(data), 'bytes')
