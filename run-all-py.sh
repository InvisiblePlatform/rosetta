#!/bin/bash
DEBUGGING=0

PYTHONBINARY=pypy3
#PYTHONBINARY=python

rm -rf data_objects/db
mkdir data_objects/db
[ $DEBUGGING ] && echo "Record Build Start ${SECONDS}"
python ./record-build.py
[ $DEBUGGING ] && echo "Copy Entities Start ${SECONDS}"
$PYTHONBINARY ./copy_entities.py
rm matched_output/*
[ $DEBUGGING ] && echo "Rosetta Start ${SECONDS}"
$PYTHONBINARY ./rosetta-build.py
[ $DEBUGGING ] && echo "Copy Files Start ${SECONDS}"
cp matched_output/* data_objects/db/
[ $DEBUGGING ] && echo "Tags Start ${SECONDS}"
$PYTHONBINARY ./tag-build.py
[ $DEBUGGING ] && echo "End ${SECONDS}"
~/notification.sh "Run all done"
