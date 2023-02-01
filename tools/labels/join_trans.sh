#!/bin/bash

labels=()

while read label; do 
    labels+=("$label")
done < newLabelLabels

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a en.labelsNew
    : $(( count += 1))
done < en.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a ar.labelsNew
    : $(( count += 1))
done < ar.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a de.labelsNew
    : $(( count += 1))
done < de.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a fr.labelsNew
    : $(( count += 1))
done < fr.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a eo.labelsNew
    : $(( count += 1))
done < eo.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a es.labelsNew
    : $(( count += 1))
done < es.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a hi.labelsNew
    : $(( count += 1))
done < hi.new

count=0
while read line; do
    echo \"${labels[$count]}\": \"$line\", | tee -a zh.labelsNew
    : $(( count += 1))
done < zh.new
