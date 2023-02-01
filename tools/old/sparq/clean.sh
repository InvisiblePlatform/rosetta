#!/bin/bash
cut -d, -f1,4 $1 | awk -F"," '{ print $2,$1}' | sed -e "s@http://www.wikidata.org/entity/@@g;s@http[s]*://@@g" | sed -e "s/\/ / /g" | sed -e "s/ /\",\"/g;s/^/\"/g;s/$/\"/g"
