import ctypes
from ctypes import wintypes
import psutil

user32 = ctypes.windll.user32

found = False
for p in psutil.process_iter(['pid', 'name']):
    name = (p.info['name'] or '').lower()
    if 'kavach' in name:
        found = True
        pid = p.info['pid']
        print(f"Found process: {p.info['name']} (PID: {pid})")
        
        def cb(hwnd, _):
            w_pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(w_pid))
            if w_pid.value == pid:
                txt = ctypes.create_unicode_buffer(256)
                user32.GetWindowTextW(hwnd, txt, 256)
                cls = ctypes.create_unicode_buffer(256)
                user32.GetClassNameW(hwnd, cls, 256)
                vis = bool(user32.IsWindowVisible(hwnd))
                rect = wintypes.RECT()
                user32.GetWindowRect(hwnd, ctypes.byref(rect))
                print(f"  HWND: {hwnd}, Class: '{cls.value}', Title: '{txt.value}', Visible: {vis}, Rect: ({rect.left},{rect.top},{rect.right},{rect.bottom})")
            return True

        user32.EnumWindows(ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)(cb), 0)

if not found:
    print("No process named 'kavach' found.")
