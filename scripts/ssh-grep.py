import paramiko
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('172.82.64.171', username='root', password='0625$$Odie$$', timeout=25)
for f in ['purge.js','server-status.js']:
    _i,o,_e=c.exec_command(f'grep -n "SlashCommandBuilder\\|setName\\|setDescription\\|prefixName\\|aliases" /root/bots/bot3/src/commands/{f}')
    print('===',f,'===')
    print(o.read().decode())
c.close()
