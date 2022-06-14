#!/bin/bash
cat $1 | python -c 'import csv, json, sys; print(json.dumps([dict(r) for r in csv.DictReader(sys.stdin)]))' > ${1//.*/}
