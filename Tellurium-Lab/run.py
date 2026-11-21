"""Run locally with Python 3.10+ and astronomy-engine installed."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import webbrowser

from model import request_json


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=Path(__file__).resolve().parent, **kwargs)

    def do_POST(self):
        if self.path != '/api':
            self.send_error(404)
            return
        try:
            payload = self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 4096))
            result = request_json(payload).encode()
        except (ValueError, TypeError, KeyError):
            self.send_error(400, 'Invalid astronomy request')
            return
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(result)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    url = f'http://127.0.0.1:{args.port}/'
    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        print(f'Tellurium Lab · {url}', flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        server.serve_forever()
