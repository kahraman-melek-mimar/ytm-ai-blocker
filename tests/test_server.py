import importlib.util
from pathlib import Path
import unittest
import numpy as np

spec = importlib.util.spec_from_file_location('server', Path(__file__).parents[1] / 'server/server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)

class PCMTests(unittest.TestCase):
    def test_valid_audio(self):
        audio = (np.sin(np.arange(server.SAMPLES) * .03) * .1).astype('<f4')
        self.assertEqual(server.validate_pcm(audio.tobytes()).shape, (1, server.SAMPLES))

    def test_reject_invalid_audio(self):
        for body in [b'', bytes(server.SAMPLES * 4),
                     np.full(server.SAMPLES, np.nan, dtype='<f4').tobytes(),
                     np.full(server.SAMPLES, 9, dtype='<f4').tobytes()]:
            with self.assertRaises(ValueError):
                server.validate_pcm(body)

class HTTPTests(unittest.TestCase):
    def test_busy_response_survives_full_audio_upload(self):
        import threading
        import urllib.request
        import urllib.error
        import json
        class TestHandler(server.Handler):
            lock = threading.Lock()
            def valid_host(self):
                return True  # Ephemeral loopback port in this test only.
        http = server.ThreadingHTTPServer(('127.0.0.1', 0), TestHandler)
        thread = threading.Thread(target=http.serve_forever, daemon=True)
        thread.start()
        TestHandler.lock.acquire()
        try:
            data = (np.sin(np.arange(server.SAMPLES)*.03)*.1).astype('<f4').tobytes()
            req = urllib.request.Request(f'http://127.0.0.1:{http.server_port}/analyze', data=data,
                headers={'Content-Type':'application/octet-stream'})
            with self.assertRaises(urllib.error.HTTPError) as ctx:
                urllib.request.urlopen(req, timeout=5)
            self.assertEqual(ctx.exception.code, 429)
            self.assertEqual(json.loads(ctx.exception.read())['code'], 'modelBusy')
        finally:
            TestHandler.lock.release()
            http.shutdown(); http.server_close(); thread.join()

if __name__ == '__main__':
    unittest.main()
