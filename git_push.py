import subprocess
import os
import ctypes
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD),
        ('Type', wintypes.DWORD),
        ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR),
        ('LastWritten', wintypes.FILETIME),
        ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_byte)),
        ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD),
        ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR),
        ('UserName', wintypes.LPWSTR),
    ]

advapi32 = ctypes.windll.advapi32
CredReadW = advapi32.CredReadW
CredReadW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(ctypes.POINTER(CREDENTIAL))]
CredReadW.restype = wintypes.BOOL
CredFree = advapi32.CredFree
CredFree.argtypes = [ctypes.c_void_p]

def get_token():
    pcred = ctypes.POINTER(CREDENTIAL)()
    if CredReadW('git:https://Your-friend-mo@github.com', 1, 0, ctypes.byref(pcred)):
        blob = bytes((ctypes.c_char * pcred.contents.CredentialBlobSize).from_address(ctypes.addressof(pcred.contents.CredentialBlob.contents)))
        CredFree(pcred)
        for enc in ['utf-8', 'utf-16-le', 'latin1']:
            try:
                s = blob.decode(enc).strip('\x00 \r\n\t')
                if s.isprintable() and len(s) > 10:
                    return s
            except:
                pass
    return None

token = get_token()
repo_dir = r'c:\Users\m\Documents\plugineasy'

def run_git(cmd):
    p = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True, shell=True)
    if p.returncode != 0:
        print(f'Error running {cmd}: {p.stderr}')
    return p.stdout.strip()

print('Init:', run_git('git init -b main'))
print('Config user:', run_git('git config user.name "Your-friend-mo"'))
print('Config email:', run_git('git config user.email "elmehdi.connect@gmail.com"'))
print('Add:', run_git('git add .'))
print('Commit:', run_git('git commit -m "Initial commit: Complete PluginEasy project with smart search, content locker, and full SEO suite"'))

# Push
push_url = f'https://Your-friend-mo:{token}@github.com/Your-friend-mo/plugineasy.git'
run_git('git remote remove origin')
print('Remote add:', run_git(f'git remote add origin {push_url}'))
print('Push:', run_git('git push -u origin main --force'))

# Reset origin URL without token
clean_url = 'https://github.com/Your-friend-mo/plugineasy.git'
print('Reset remote:', run_git(f'git remote set-url origin {clean_url}'))
print('Status:', run_git('git status'))
