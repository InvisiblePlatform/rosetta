#!/bin/bash

for file in $(ls -1 ../wikipedia/wikipedia_templates); do
    if ! [[ -s "content/$file" ]]; then
        cp ../wikipedia/wikipedia_templates/$file content/
        printf '%s\n' "$file"
    fi
done
