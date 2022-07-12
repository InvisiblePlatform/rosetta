#!/bin/bash

cp wikidata/wikidatacache/ -r hugo/data/wikidata/
cp bcorp/split_files/* hugo/data/bcorp/
cp goodonyou/brands/* hugo/data/goodonyou/
cp wikipedia/pages -r hugo/data/wikipedia/
cp wikipedia/wikicard -r hugo/data/wikipedia/
cp similar-sites/sites -r hugo/data/similar/
cp trust-pilot/sites -r hugo/data/trust-pilot/
