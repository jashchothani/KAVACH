import ctypes
from ctypes import wintypes
import psutil

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

for p in psutil.process_iter(['pid', 'name']):
    if 'kavach' in (p.info['name'] or '').lower():
        pid = p.info['pid']
        proc = psutil.Process(pid)
        print(f"Process: {proc.name()} (PID: {pid}), Status: {proc.status()}, Memory: {proc.memory_info().rss / 1024 / 1024:.1f} MB")
        
        threads = proc.threads()
        print(f"Total Threads: {len(threads)}")
        for t in threads:
            tid = t.id
            def thread_cb(hwnd, _):
                txt = ctypes.create_unicode_buffer(256)
                user32.GetWindowTextW(hwnd, txt, 256)
                cls = ctypes.create_unicode_buffer(256)
                user32.GetClassNameW(hwnd, cls, 256)
                vis = bool(user32.IsWindowVisible(hwnd))
                rect = wintypes.RECT()
                user32.GetWindowRect(hwnd, ctypes.byref(rect))
                print(f"  [Thread {tid}] HWND: {hwnd}, Class: '{cls.value}', Title: '{txt.value}', Visible: {vis}, Rect: ({rect.left},{rect.top},{rect.right},{rect.bottom})")
                return True

            user32.EnumThreadWindows(tid, ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)(thread_cb), 0)
