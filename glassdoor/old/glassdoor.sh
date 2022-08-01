cut -d, -f2- glassroom_clean1.csv | sed -e "s/\"//g" | sed -e "s@https://www\.glassdoor\.[comaie]*\.*[auksginh]*/Overview/@@g;s@https://www\.glassdoor\.[com\.uk]*/@@g" > just_needed.list
