#!/bin/bash

rsync -ah wikidata/longcache hugo/data/wikidata/
rsync -ah bcorp/split_files/* hugo/data/bcorp/
rsync -ah goodonyou/brands/* hugo/data/goodonyou/
rsync -ah wikipedia/pages hugo/wikipedia/
rsync -ah wikipedia/wikicard hugo/wikipedia/
rsync -ah similar-sites/sites hugo/data/similar/
rsync -ah trust-pilot/sites hugo/data/trust-pilot/
rsync -ah glassdoor/data_json hugo/data/glassdoor
rsync -ah yahoo/ticker/* hugo/data/yahoo/
