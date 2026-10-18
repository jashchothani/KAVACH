"""
KAVACH Local Device Identity & Secret Management.

Features:
- Local asymmetric key-pair generation (RSA-2048)
- Windows DPAPI (CryptProtectData / CryptUnprotectData) encrypted private-key storage
- Non-plaintext persistence with machine-entropy fallback for non-Windows environments
- Cryptographic challenge-response signing for zero-trust device enrollment
- Device credential lifecycle: load, verify, rotate, and clear
"""

from __future__ import annotations

import base64
import ctypes
import hashlib
import json
import os
import platform
import socket
import sys
import uuid
from ctypes import wintypes
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.logging import get_logger

logger = get_logger("kavach_identity")


# ---------------------------------------------------------------------------
# Windows DPAPI Ctypes Binding
# ---------------------------------------------------------------------------

class DATA_BLOB(ctypes.Structure):
    _fields_ = [
        ("cbData", wintypes.DWORD),
        ("pbData", ctypes.POINTER(ctypes.c_byte)),
    ]


def _get_fallback_key() -> bytes:
    """Generate deterministic machine-bound key for environments without Windows DPAPI."""
    node_id = hex(uuid.getnode())[2:]
    machine_id = f"{platform.node()}-{node_id}-{platform.system()}"
    return hashlib.sha256(machine_id.encode("utf-8")).digest()


def _fallback_protect(data: bytes) -> bytes:
    """AES-256-GCM fallback encryption."""
    key = _get_fallback_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return b"KAVACH_GCM_v1:" + nonce + ciphertext


def _fallback_unprotect(data: bytes) -> bytes:
    """AES-256-GCM fallback decryption."""
    if not data.startswith(b"KAVACH_GCM_v1:"):
        raise ValueError("Invalid encrypted data format.")
    raw = data[len(b"KAVACH_GCM_v1:"):]
    nonce = raw[:12]
    ciphertext = raw[12:]
    key = _get_fallback_key()
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)


def dpapi_protect(data: bytes, description: str = "KAVACH Device Credential") -> bytes:
    """Encrypt byte payload using Windows DPAPI with seamless cross-platform fallback."""
    if sys.platform != "win32":
        return _fallback_protect(data)

    try:
        crypt32 = ctypes.windll.crypt32
        kernel32 = ctypes.windll.kernel32

        in_blob = DATA_BLOB(
            len(data),
            ctypes.cast(ctypes.create_string_buffer(data, len(data)), ctypes.POINTER(ctypes.c_byte)),
        )
        out_blob = DATA_BLOB()

        # CRYPTPROTECT_UI_FORBIDDEN = 0x1
        if not crypt32.CryptProtectData(
            ctypes.byref(in_blob),
            description,
            None,
            None,
            None,
            0x1,
            ctypes.byref(out_blob),
        ):
            return _fallback_protect(data)

        encrypted = ctypes.string_at(out_blob.pbData, out_blob.cbData)
        kernel32.LocalFree(out_blob.pbData)
        return b"KAVACH_DPAPI_v1:" + encrypted
    except Exception as exc:
        logger.warning("dpapi_protect_fallback", error=str(exc))
        return _fallback_protect(data)


def dpapi_unprotect(data: bytes) -> bytes:
    """Decrypt byte payload using Windows DPAPI."""
    if data.startswith(b"KAVACH_GCM_v1:"):
        return _fallback_unprotect(data)

    if not data.startswith(b"KAVACH_DPAPI_v1:"):
        # Legacy or raw GCM fallback attempt
        try:
            return _fallback_unprotect(data)
        except Exception:
            raise ValueError("Unrecognized credential encryption envelope.")

    raw_dpapi = data[len(b"KAVACH_DPAPI_v1:"):]
    if sys.platform != "win32":
        raise RuntimeError("Cannot unprotect DPAPI data on non-Windows platform.")

    try:
        crypt32 = ctypes.windll.crypt32
        kernel32 = ctypes.windll.kernel32

        in_blob = DATA_BLOB(
            len(raw_dpapi),
            ctypes.cast(ctypes.create_string_buffer(raw_dpapi, len(raw_dpapi)), ctypes.POINTER(ctypes.c_byte)),
        )
        out_blob = DATA_BLOB()

        if not crypt32.CryptUnprotectData(
            ctypes.byref(in_blob),
            None,
            None,
            None,
            None,
            0x1,
            ctypes.byref(out_blob),
        ):
            raise ctypes.WinError()

        decrypted = ctypes.string_at(out_blob.pbData, out_blob.cbData)
        kernel32.LocalFree(out_blob.pbData)
        return decrypted
    except Exception as exc:
        logger.error("dpapi_unprotect_failed", error=str(exc))
        raise


# ---------------------------------------------------------------------------
# Device Identity Manager
# ---------------------------------------------------------------------------

@dataclass
class LocalDeviceIdentity:
    device_id: str
    device_token: str
    public_key_pem: str
    private_key_pem: str
    hostname: str
    registered_at: str
    expires_at: str | None = None


class DeviceIdentityManager:
    """
    Manages local cryptographic identity and authenticated tokens for KAVACH endpoints.
    Ensures zero plaintext secret storage on disk.
    """

    DEFAULT_STORE_DIR = Path(os.environ.get("LOCALAPPDATA", "data")) / "kavach"

    def __init__(
        self,
        store_dir: Path | str | None = None,
        storage_path: Path | str | None = None,
    ) -> None:
        if storage_path is not None:
            p = Path(storage_path)
            if p.suffix:
                self.store_file = p
                self.store_dir = p.parent
            else:
                self.store_dir = p
                self.store_file = self.store_dir / "device_identity.enc"
        elif store_dir is not None:
            self.store_dir = Path(store_dir)
            self.store_file = self.store_dir / "device_identity.enc"
        else:
            self.store_dir = self.DEFAULT_STORE_DIR
            self.store_file = self.store_dir / "device_identity.enc"
        self._identity: LocalDeviceIdentity | None = None

    def ensure_device_identity(self) -> dict[str, Any]:
        """
        Capture and return device identity metadata fingerprint.
        If the endpoint has an enrolled cryptographic identity, injects the device_id
        and hostname into the returned metadata dict.
        """
        from app.agent.shipper import get_host_fingerprint

        meta = get_host_fingerprint()
        ident = self.load_identity()
        if ident:
            meta["host_id"] = ident.device_id
            meta["hostname"] = ident.hostname
        return meta


    @staticmethod
    def generate_keypair() -> tuple[str, str]:
        """
        Generate an RSA-2048 keypair.
        Returns (private_key_pem, public_key_pem).
        """
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )

        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

        public_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

        return private_pem, public_pem

    @staticmethod
    def sign_nonce(private_key_pem: str, nonce: str) -> str:
        """
        Sign a challenge nonce using the device's private key.
        Returns base64-encoded signature.
        """
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode("utf-8"),
            password=None,
            backend=default_backend(),
        )
        if not isinstance(private_key, rsa.RSAPrivateKey):
            raise TypeError("Unsupported private key type. Expected RSA.")

        signature = private_key.sign(
            nonce.encode("utf-8"),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return base64.b64encode(signature).decode("utf-8")

    @staticmethod
    def verify_nonce_signature(public_key_pem: str, nonce: str, signature_b64: str) -> bool:
        """
        Verify a challenge nonce signature using the device's public key.
        Returns True if signature is valid.
        """
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode("utf-8"),
                backend=default_backend(),
            )
            if not isinstance(public_key, rsa.RSAPublicKey):
                return False

            raw_sig = base64.b64decode(signature_b64.encode("utf-8"))
            public_key.verify(
                raw_sig,
                nonce.encode("utf-8"),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False

    def is_enrolled(self) -> bool:
        """Check if a valid, readable device identity exists locally."""
        if self._identity is not None:
            return True
        return self.load_identity() is not None

    def save_identity(
        self,
        device_id: str,
        device_token: str,
        public_key_pem: str,
        private_key_pem: str,
        hostname: str | None = None,
        expires_at: str | None = None,
    ) -> LocalDeviceIdentity:
        """Encrypt and persist device credentials using DPAPI."""
        self.store_dir.mkdir(parents=True, exist_ok=True)
        hostname = hostname or socket.gethostname()

        data_dict = {
            "device_id": device_id,
            "device_token": device_token,
            "public_key_pem": public_key_pem,
            "private_key_pem": private_key_pem,
            "hostname": hostname,
            "registered_at": platform.node(),
            "expires_at": expires_at,
        }

        raw_json = json.dumps(data_dict).encode("utf-8")
        encrypted = dpapi_protect(raw_json, description="KAVACH Protected Device Identity")

        self.store_file.write_bytes(encrypted)
        logger.info("device_identity_saved", device_id=device_id, path=str(self.store_file))

        self._identity = LocalDeviceIdentity(
            device_id=device_id,
            device_token=device_token,
            public_key_pem=public_key_pem,
            private_key_pem=private_key_pem,
            hostname=hostname,
            registered_at=data_dict["registered_at"],
            expires_at=expires_at,
        )
        return self._identity

    def load_identity(self) -> LocalDeviceIdentity | None:
        """Read and decrypt device credentials."""
        if not self.store_file.exists():
            return None

        try:
            encrypted = self.store_file.read_bytes()
            raw_json = dpapi_unprotect(encrypted)
            data = json.loads(raw_json.decode("utf-8"))

            self._identity = LocalDeviceIdentity(
                device_id=data["device_id"],
                device_token=data["device_token"],
                public_key_pem=data["public_key_pem"],
                private_key_pem=data["private_key_pem"],
                hostname=data.get("hostname", socket.gethostname()),
                registered_at=data.get("registered_at", ""),
                expires_at=data.get("expires_at"),
            )
            return self._identity
        except Exception as exc:
            logger.error("failed_loading_device_identity", error=str(exc))
            return None

    def clear_identity(self) -> None:
        """Revoke local credentials and delete stored file."""
        self._identity = None
        if self.store_file.exists():
            try:
                self.store_file.unlink()
                logger.info("device_identity_cleared", path=str(self.store_file))
            except Exception as exc:
                logger.warning("failed_clearing_identity_file", error=str(exc))

    def get_auth_headers(self) -> dict[str, str]:
        """Generate transmission headers with device token."""
        ident = self.load_identity()
        if not ident:
            return {}
        return {
            "X-Device-ID": ident.device_id,
            "X-Device-Token": ident.device_token,
            "X-Hostname": ident.hostname,
        }
