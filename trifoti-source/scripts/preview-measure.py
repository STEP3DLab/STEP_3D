"""Local QA only: count response-body bytes for a clean browser request trace."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json,time
ROOT=Path(__file__).resolve().parents[1]/'dist'
LOG=Path(__file__).with_name('group10-candidate-requests.jsonl')
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        self.body_bytes=0;self.status=None
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def send_response(self,code,message=None):
        self.status=code
        super().send_response(code,message)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def copyfile(self,source,outputfile):
        while chunk:=source.read(65536):
            outputfile.write(chunk);self.body_bytes+=len(chunk)
    def do_GET(self):
        try: super().do_GET()
        except (BrokenPipeError,ConnectionResetError): pass
        finally:
            with LOG.open('a') as f:f.write(json.dumps({'time':time.time(),'path':self.path,'status':self.status,'bytes':self.body_bytes})+'\n')
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
