
import pty
import os
import sys
import select
import time

SERVER = "u502220155@153.92.9.217"
PORT = "65002"
PASS = "080987Ag#"
CMD = sys.argv[1] if len(sys.argv) > 1 else "uname -a"

pid, fd = pty.fork()
if pid == 0:
    # Child process: run ssh
    # StrictHostKeyChecking=no to avoid yes/no prompt for new hosts
    os.execvp('ssh', ['ssh', '-o', 'StrictHostKeyChecking=no', '-p', PORT, SERVER, CMD])
else:
    # Parent process: handle password
    password_sent = False
    output = b""
    start_time = time.time()
    
    while True:
        # Timeout after 20 seconds
        if time.time() - start_time > 20:
            break

        r, _, _ = select.select([fd], [], [], 1.0)
        if not r: 
            continue
        
        try:
            data = os.read(fd, 1024)
        except OSError:
            break
            
        if not data:
            break
            
        output += data
        
        # Simple heuristic to send password
        if b'password:' in data.lower() and not password_sent:
            os.write(fd, PASS.encode() + b'\n')
            password_sent = True
            
    # Print the full output so we can see the result
    sys.stdout.buffer.write(output)
