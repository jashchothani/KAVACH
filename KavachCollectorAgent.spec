# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['backend\\collector_agent_entry.py'],
    pathex=['backend'],
    binaries=[],
    datas=[],
    hiddenimports=['win32timezone', 'win32service', 'win32serviceutil', 'win32event', 'collectors.base', 'collectors.process_collector', 'collectors.network_collector', 'collectors.file_monitor', 'collectors.login_collector', 'collectors.powershell_collector', 'collectors.supplementary_collectors', 'collectors.sysmon_collector', 'collectors.windows_eventlog_collector'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='KavachCollectorAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['assets\\kavach.ico'],
)
