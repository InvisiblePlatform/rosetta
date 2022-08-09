#!/bin/bash

wget -O entity_map.json https://raw.githubusercontent.com/duckduckgo/tracker-radar/main/build-data/generated/entity_map.json
python3 ./reshape.py
