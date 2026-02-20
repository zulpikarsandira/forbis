
import pty
import os
import sys
import select
import time

SERVER = "u502220155@153.92.9.217"
PORT = "65002"
PASS = "080987Ag#"
SRC = "build.tar.gz"
DEST_PATH = "domains/tes.smkalamahsindulang.sch.id/public_html/app/"
DEST = f"{SERVER}:{DEST_PATH}"

print(f"Uploading {SRC} to {DEST}...")

pid, fd = pty.fork()
if pid == 0:
    os.execvp('scp', ['scp', '-o', 'StrictHostKeyChecking=no', '-P', PORT, SRC, DEST])
else:
    password_sent = False
    start_time = time.time()
    
    while True:
        # 5 minute timeout for upload
        if time.time() - start_time > 300:
            print("\nTimeout waiting for upload completion")
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
            
        sys.stdout.buffer.write(data)
        sys.stdout.flush()
        
        if b'password:' in data.lower() and not password_sent:
            os.write(fd, PASS.encode() + b'\n')
            password_sent = True
