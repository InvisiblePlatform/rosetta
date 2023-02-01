#!/bin/bash

listing(){
    lynx -dump -listonly -nonumbers "$1" \
     | grep '//en.wikipedia.org/wiki' \
     | sed -e "/Special:/d;/Wikipedia:/d" \
           -e "/Portal:/d;/Main_Page/d;/#/d" \
           -e "/Help:/d;/talk:/d;/Talk:/d;/Template:/d" \
     | sort -u
}
#TEMPFILE=$(mktemp)
# listing "https://en.wikipedia.org/wiki/Category:Lists_of_companies_by_industry" > $TEMPFILE

while read entry; do
    listing "$entry" | tee -a round2.list
done < round1_seed.list



rm $TEMPFILE
