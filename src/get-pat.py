# A script to generate a user API key on a Discourse site.
# Authorized by author on https://shuiyuan.sjtu.edu.cn/t/topic/123808 to use this code under MIT license.
 
import base64
import json
import secrets
import urllib.parse
import uuid
import webbrowser
from collections.abc import Iterable
from dataclasses import dataclass
 
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
 
# From: https://github.com/discourse/discourse/blob/main/app/models/user_api_key_scope.rb
ALL_SCOPES = [
    'read',
    'message_bus',
    'notifications',
    'bookmarks_calendar',
]
DEFAULT_SCOPES = ['read']
 
 
@dataclass
class UserApiKeyPayload:
    key: str
    nonce: str
    push: bool
    api: int
 
 
@dataclass
class UserApiKeyRequestResult:
    client_id: str
    payload: UserApiKeyPayload
 
 
# Ref:
# https://meta.discourse.org/t/user-api-keys-specification/48536
# https://github.com/discourse/discourse/blob/main/app/controllers/user_api_keys_controller.rb
def generate_user_api_key(
    site_url_base: str,
    application_name: str, *,
    client_id: str | None = None,
    scopes: Iterable[str] | None = None,
) -> UserApiKeyRequestResult:
    # Generate RSA key pair.
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
    )
    public_key = private_key.public_key()
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode('ascii')
 
    # Generate a random client ID if not provided.
    client_id_to_use = str(uuid.uuid4()) if client_id is None else client_id
    nonce = secrets.token_urlsafe(32)
 
    # Validate scopes.
    scopes_list = DEFAULT_SCOPES if scopes is None else list(scopes)
    if not set(scopes_list) <= set(ALL_SCOPES):
        raise ValueError('Invalid scopes')
 
    # Build request URL and open in browser.
    params_dict: dict[str, str] = {
        'application_name': application_name,
        'client_id': client_id_to_use,
        'scopes': ','.join(scopes_list),
        'public_key': public_key_pem,
        'nonce': nonce,
    }
    params_str = '&'.join(f'{k}={urllib.parse.quote(v)}' for k, v in params_dict.items())
    webbrowser.open(f'{site_url_base}/user-api-key/new?{params_str}')
 
    # Receive, decrypt and check response payload from server.
    enc_payload = input('Paste the response payload here: ')
    dec_payload = UserApiKeyPayload(**json.loads(private_key.decrypt(
        base64.b64decode(enc_payload),
        padding.PKCS1v15(),
    )))
    if dec_payload.nonce != nonce:
        raise ValueError('Nonce mismatch')
 
    # Return client ID and response payload.
    return UserApiKeyRequestResult(
        client_id=client_id_to_use,
        payload=dec_payload,
    )
 
 
def test_user_api_key(site_url_base: str, key: str) -> None:
    # Get the current session information from the Discourse site.
    r = requests.get(
        f'https://linux.do/new.json',
        headers={
            'User-Api-Key': key,
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        timeout=5,
    )
    # Expect some results.
    if r.status_code != 200:
        raise ValueError('Invalid key')
    else:
        print('PAT Token:', key)
 
 
def main() -> None:
    site_url_base = 'https://linux.do'
    # Generate a user API key and test it.
    result = generate_user_api_key(site_url_base, 'Linux Do MCP Server')
    print(result)  # Store this somewhere
    test_user_api_key(site_url_base, result.payload.key)
 
if __name__ == '__main__':
    main()