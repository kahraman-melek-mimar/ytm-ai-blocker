"""Loopback-only PCM inference. No track uploads, downloads or metadata guesses."""
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class AnalysisError(ValueError):
    def __init__(self, message, code):
        super().__init__(message)
        self.code = code


SAMPLES = 44100 * 4
MODEL_PATH = Path(__file__).parent / 'models' / 'artifactnet_v94_full.onnx'
VERSION = json.loads((Path(__file__).parents[1] / 'extension/manifest.json').read_text())['version']


def validate_pcm(body):
    import numpy as np
    if len(body) != SAMPLES * 4:
        raise ValueError('Tam 4 saniye, 44100 Hz mono float32 ses gerekli.')
    audio = np.frombuffer(body, dtype='<f4').copy()
    if not np.isfinite(audio).all() or np.max(np.abs(audio)) > 1.1:
        raise ValueError('Geçersiz PCM ses verisi.')
    if float(np.sqrt(np.mean(audio ** 2))) < 0.0001:
        raise AnalysisError('Sessizlik: analiz için yeterli ses yok.', 'insufficientAudio')
    return audio.reshape(1, -1)


class Handler(BaseHTTPRequestHandler):
    model = None
    lock = threading.Lock()

    def respond(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def valid_host(self):
        return self.headers.get('Host') == '127.0.0.1:5050'

    def do_GET(self):
        if not self.valid_host():
            return self.respond(403, {'error': 'Geçersiz Host.'})
        if self.path != '/health':
            return self.respond(404, {'error': 'Bulunamadı.'})
        self.respond(200, {'ok': self.model is not None, 'model': 'ArtifactNet v9.4', 'serverVersion': VERSION, 'protocolVersion': 2, 'numericalGuard': 'hpss-zero-denominator-v1'})

    def do_POST(self):
        if not self.valid_host():
            return self.respond(403, {'error': 'Geçersiz Host.'})
        origin = self.headers.get('Origin', '')
        if origin and not origin.startswith('chrome-extension://'):
            return self.respond(403, {'error': 'Yalnızca tarayıcı eklentisi erişebilir.'})
        if self.path != '/analyze':
            return self.respond(404, {'error': 'Bulunamadı.'})
        if self.headers.get('Content-Type') != 'application/octet-stream':
            return self.respond(415, {'error': 'PCM içerik türü gerekli.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            length = 0
        if length != SAMPLES * 4:
            return self.respond(400, {'error': 'Ses paketi boyutu geçersiz.'})
        # Consume the bounded request before returning busy. Rejecting mid-upload
        # can break the connection before Chrome receives the actual error.
        try:
            self.connection.settimeout(5)
            body = self.rfile.read(length)
        except (TimeoutError, ConnectionError, OSError):
            return self.respond(408, {'error': 'Ses paketi tamamlanamadı.', 'code': 'invalidAudio'})
        if not self.lock.acquire(blocking=False):
            return self.respond(429, {'error': 'Model meşgul.', 'code': 'modelBusy'})
        try:
            import numpy as np
            audio = validate_pcm(body)
            probability = float(np.asarray(self.model.run(None, {'audio': audio})[0]).reshape(-1)[0])
            if not np.isfinite(probability) or not 0 <= probability <= 1:
                raise AnalysisError('Model geçerli bir skor üretmedi.', 'invalidScore')
            self.respond(200, {'probability': probability, 'seconds': 4, 'model': 'ArtifactNet v9.4'})
        except ValueError as error:
            self.respond(422, {'error': str(error), 'code': getattr(error, 'code', 'invalidAudio')})
        except Exception:
            self.respond(503, {'error': 'Model analizi başarısız.', 'code': 'modelFailure'})
        finally:
            self.lock.release()

    def log_message(self, fmt, *args):
        pass  # Do not log listening activity.


def main():
    import onnxruntime as ort
    if not MODEL_PATH.exists() or not Path(str(MODEL_PATH) + '.data').exists():
        raise SystemExit('Model eksik. Önce Kurulum.command dosyasını çalıştırın.')
    from model_numerics import guarded_model
    Handler.model = ort.InferenceSession(str(guarded_model(MODEL_PATH)), providers=['CPUExecutionProvider'])
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 5050), Handler)
    except OSError as error:
        raise SystemExit(f'5050 portu açılamadı. Başka bir sunucu açıksa kapatın. Ayrıntı: {error}') from error
    server.daemon_threads = True
    version = json.loads((Path(__file__).parents[1] / 'extension/manifest.json').read_text())['version']
    print(f'YTM AI Blocker v{version} · Local model ready / Yerel model hazır · 127.0.0.1:5050', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
