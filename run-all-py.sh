#!/bin/bash

rm -rf hugo/content/db
mkdir hugo/content/db
python ./record-build.py
cp hugo/examplecom.md hugo/content/db/
rm matched_output/*
python ./rosetta-build.py
cp matched_output/* hugo/content/db/
python ./tag-build.py
