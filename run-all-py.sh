#!/bin/bash

rm -rf data_objects/db
mkdir data_objects/db
python ./record-build.py
python ./copy_entities.py
# cp hugo/examplecom.md hugo/content/db/
rm matched_output/*
python ./rosetta-build.py
cp matched_output/* data_objects/db/
python ./tag-build.py
