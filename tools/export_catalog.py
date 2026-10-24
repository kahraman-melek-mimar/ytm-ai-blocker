"""Export a reviewed local catalog. No network connection or public write endpoint."""
import argparse,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from catalog import Catalog

def main():
    p=argparse.ArgumentParser();p.add_argument('database',type=Path);p.add_argument('output',type=Path)
    args=p.parse_args()
    if not args.database.is_file():p.error('Database does not exist; refusing to silently create an empty catalog')
    catalog=Catalog(args.database)
    try:payload=catalog.snapshot()
    finally:catalog.db.close()
    temp=args.output.with_suffix(args.output.suffix+'.tmp')
    temp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(args.output)
if __name__=='__main__':main()
