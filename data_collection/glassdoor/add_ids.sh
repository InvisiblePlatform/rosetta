#!/bin/bash

wc -l fulllist.list.test
while read id; do 
    lynx -dump -listonly -nonumbers "https://www.glassdoor.com/Overview/-EI_IE${id}.htm" \
        | grep "\.glassdoor\." \
        | grep "\-E" \
        | sed -e "s/.*-//g" \
        | sed -e "s/\..*$//g" \
        | sed -e "s/[^0-9]//g" \
        | sort -u \
        | tee -a inbetweenlist
    sleep 5s
done < fulllist.list.test
cat inbetweenlist >> fulllist.list.test
sort -uo fulllist.list.test{,}
wc -l fulllist.list.test
