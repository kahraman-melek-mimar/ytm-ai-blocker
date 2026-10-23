"""Offline-only C2PA trial. Does not upload media or interpret absence as human origin."""
import argparse
import json
from pathlib import Path
from importlib.metadata import version
import c2pa


def inspect_file(path, extract_dir=None, trust_anchors=None):
    result = {'file': Path(path).name, 'library_version': version('c2pa-python'),
              'remote_fetch': False, 'trust': 'not_established', 'ai_origin': 'unverified'}
    config = {'verify': {'remote_manifest_fetch': False, 'ocsp_fetch': False,
                         'verify_after_reading': True, 'verify_trust': True}}
    if trust_anchors:
        pem = Path(trust_anchors).read_text()
        # Support both SDK trust configuration schemas; no leaf allow-list bypass.
        config['trust'] = {'trust_anchors': pem,
                           'anchors': [{'trust_anchors': pem, 'trust_kind': 'manifest'}]}
    settings = c2pa.Settings.from_dict(config)
    try:
        with c2pa.Context(settings) as ctx:
            with c2pa.Reader(Path(path), context=ctx) as reader:
                store = json.loads(reader.json())
        active = store.get('active_manifest')
        result.update(status='manifest_present' if active else 'no_active_manifest', active_manifest=active,
                      validation_status=store.get('validation_status', []),
                      validation_state=store.get('validation_state'))
        result['trust'] = 'verified' if store.get('validation_state') == 'Trusted' else 'not_established'
        active_data = store.get('manifests', {}).get(active, {})
        result['signature_info'] = active_data.get('signature_info', {})
        result['assertions'] = active_data.get('assertions', [])
        ai_asserted = any(action.get('digitalSourceType', '').endswith('/trainedAlgorithmicMedia')
                          for assertion in active_data.get('assertions', [])
                          if assertion.get('label', '').startswith('c2pa.actions')
                          for action in assertion.get('data', {}).get('actions', []))
        result['ai_origin'] = ('verified_ai_assertion' if result['trust'] == 'verified' else 'unverified_ai_assertion') if ai_asserted else 'unverified'
        if extract_dir:
            destination = Path(extract_dir)
            destination.mkdir(parents=True, exist_ok=True)
            output = destination / (Path(path).name + '.manifest.json')
            output.write_text(json.dumps(store, indent=2, ensure_ascii=False))
            result['extracted_manifest'] = str(output)
    except Exception as error:
        name = type(error).__name__
        status = {'_C2paNotSupported': 'unsupported_format',
                  '_C2paManifestNotFound': 'manifest_not_found'}.get(name, 'read_error')
        result.update(status=status, error_type=name, detail=str(error))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+')
    parser.add_argument('--output')
    parser.add_argument('--extract-dir')
    parser.add_argument('--trust-anchors', help='Local PEM file from an independently trusted source')
    args = parser.parse_args()
    report = [inspect_file(path, args.extract_dir, args.trust_anchors) for path in args.files]
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if args.output:
        Path(args.output).write_text(text+'\n')
    print(text)


if __name__ == '__main__':
    main()
