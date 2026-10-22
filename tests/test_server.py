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

if __name__ == '__main__':
    unittest.main()
