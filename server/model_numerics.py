"""Local zero-denominator guard for the pinned ArtifactNet graph; weights stay untouched.

Only two HPSS divisions by add_35 are changed. A zero denominator uses 1,
so the silent-bin 0/0 becomes 0/1. Every nonzero denominator is unchanged.
Uses a small protobuf wire reader to avoid adding an ONNX editing dependency.
"""
from hashlib import sha256
from pathlib import Path
import struct

SOURCE_HASH = 'a923b53899fbb01fcf4436cc5e1837628516de6044c9f238b31b4b02ed601a19'

def _varint(data, offset):
    result = shift = 0
    while offset < len(data) and shift < 70:
        byte = data[offset]; offset += 1
        result |= (byte & 127) << shift
        if byte < 128:
            return result, offset
        shift += 7
    raise ValueError('Invalid protobuf varint')

def _fields(data):
    offset = 0
    while offset < len(data):
        start = offset
        tag, offset = _varint(data, offset)
        kind = tag & 7
        if kind == 2:
            length, offset = _varint(data, offset)
            value = data[offset:offset + length]; offset += length
        elif kind == 0:
            value, offset = _varint(data, offset)
        elif kind in (1, 5):
            length = 8 if kind == 1 else 4
            value = data[offset:offset + length]; offset += length
        else:
            raise ValueError('Unsupported protobuf wire type')
        if offset > len(data):
            raise ValueError('Truncated protobuf')
        yield tag >> 3, value, data[start:offset]

def _encode(value):
    result = bytearray()
    while value > 127:
        result.append((value & 127) | 128); value >>= 7
    result.append(value)
    return bytes(result)

def _field(number, value):
    return _encode(number * 8 + 2) + _encode(len(value)) + value

def _node(op, inputs, output):
    return _field(1, b''.join(_field(1, name.encode()) for name in inputs) +
                  _field(2, output.encode()) + _field(3, output.encode()) + _field(4, op.encode()))

def _scalar(name, value):
    # TensorProto: FLOAT scalar, name, little-endian raw data.
    return _field(5, b'\x10\x01' + _field(8, name.encode()) + _field(9, struct.pack('<f', value)))

def guarded_model(source):
    source = Path(source)
    data = source.read_bytes()
    if sha256(data).hexdigest() != SOURCE_HASH:
        raise ValueError('Model revision differs; numerical guard requires the pinned graph.')
    graph = next(value for number, value, _ in _fields(data) if number == 7)
    parts = []; patched = 0
    for number, value, raw in _fields(graph):
        if number == 1:
            attrs = list(_fields(value))
            op = next((v for k, v, _ in attrs if k == 4), None)
            inputs = [v for k, v, _ in attrs if k == 1]
            if op == b'Div' and len(inputs) == 2 and inputs[1] == b'add_35':
                if patched == 0:
                    parts.append(_node('Equal', ['add_35','ytm_guard_zero'], 'ytm_guard_is_zero'))
                    parts.append(_node('Where', ['ytm_guard_is_zero','ytm_guard_one','add_35'], 'ytm_guard_denominator'))
                input_index = 0; fields = []
                for k, v, field_raw in attrs:
                    if k == 1:
                        input_index += 1
                        if input_index == 2:
                            field_raw = _field(1, b'ytm_guard_denominator')
                    fields.append(field_raw)
                raw = _field(1, b''.join(fields)); patched += 1
        parts.append(raw)
    if patched != 2:
        raise ValueError('Expected exactly two HPSS divisions; refusing to patch.')
    graph = b''.join(parts) + _scalar('ytm_guard_zero', 0) + _scalar('ytm_guard_one', 1)
    guarded = b''.join(_field(7, graph) if k == 7 else raw for k, _, raw in _fields(data))
    target = source.with_name('artifactnet_v94_zero_guard.onnx')
    if not target.exists() or target.read_bytes() != guarded:
        temp = target.with_suffix('.tmp')
        temp.write_bytes(guarded); temp.replace(target)
    return target
