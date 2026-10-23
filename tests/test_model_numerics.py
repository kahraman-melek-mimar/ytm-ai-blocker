import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from hashlib import sha256

spec = importlib.util.spec_from_file_location('numerics', Path(__file__).parents[1]/'server/model_numerics.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class NumericsTests(unittest.TestCase):
    def test_only_target_divisors_change_and_source_is_preserved(self):
        graph = m._node('Div', ['a','add_35'], 'first') + m._node('Div', ['b','add_35'], 'second') + m._node('Div', ['c','other'], 'third')
        source = m._field(7, graph) + m._field(2,b'unchanged-model-metadata')
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'source.onnx';path.write_bytes(source)
            with patch.object(m,'SOURCE_HASH',sha256(source).hexdigest()):
                target=m.guarded_model(path); first=target.read_bytes()
                self.assertEqual(m.guarded_model(path).read_bytes(),first)
            self.assertEqual(path.read_bytes(),source)
            result_graph=next(v for k,v,_ in m._fields(first) if k==7)
            nodes=[list(m._fields(v)) for k,v,_ in m._fields(result_graph) if k==1]
            divisors=[[v for k,v,_ in node if k==1][1] for node in nodes if any(k==4 and v==b'Div' for k,v,_ in node)]
            self.assertEqual(divisors,[b'ytm_guard_denominator',b'ytm_guard_denominator',b'other'])
            self.assertEqual(sum(any(k==4 and v==b'Where' for k,v,_ in n) for n in nodes),1)
            self.assertIn(m._field(2,b'unchanged-model-metadata'),first)

    def test_unknown_models_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'source.onnx';path.write_bytes(b'not the pinned model')
            with self.assertRaises(ValueError):m.guarded_model(path)
            self.assertFalse((Path(folder)/'artifactnet_v94_zero_guard.onnx').exists())

    def test_unexpected_division_count_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            source=m._field(7,m._node('Div',['a','add_35'],'only_one'))
            path=Path(folder)/'source.onnx';path.write_bytes(source)
            with patch.object(m,'SOURCE_HASH',sha256(source).hexdigest()):
                with self.assertRaises(ValueError):m.guarded_model(path)
