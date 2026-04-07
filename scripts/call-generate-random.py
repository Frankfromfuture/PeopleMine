import json
import urllib.error
import urllib.request

for port in (3001, 3002):
    body = json.dumps({'count': 1, 'tagVariability': 73}).encode()
    req = urllib.request.Request(
        f'http://localhost:{port}/api/contacts/generate-random',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    print('PORT', port)
    try:
        with urllib.request.urlopen(req, timeout=240) as res:
            print(res.read().decode())
    except urllib.error.HTTPError as e:
        print(e.code)
        print(e.read().decode())
    except Exception as e:
        print(type(e).__name__, str(e))
