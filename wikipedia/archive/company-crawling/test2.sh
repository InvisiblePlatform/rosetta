#!/bin/bash

get_categories(){
    for i in $(seq 10000 500 56500); do
        lynx -dump -listonly -nonumbers "https://en.wikipedia.org/w/index.php?title=Special:Search&limit=500&offset=$i&ns14=1&search=companies" | grep '//en.wikipedia.org/wiki/Category' | tee -a categories_companies.list
    done
}

get_categories
