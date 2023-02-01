sed -e "s/[&,\/]//g;s/-/_/g;s/  / /g;s/ /_/g;s/__/_/g;s/__/_/g" newLabels | tr '[:upper:]' '[:lower:]' > newLabelLabels
