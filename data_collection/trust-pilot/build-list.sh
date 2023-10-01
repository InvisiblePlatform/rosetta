#!/bin/bash
rm websitelist.list
for i in $(ls -1 sites/); do 
    jq -r .name.identifying sites/$i 2>/dev/null \
        | tee -a websitelist.list 
done
