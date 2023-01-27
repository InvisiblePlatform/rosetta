#!/bin/bash
rm static/document_isin.list
jq -r ".[].ISIN" static/2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.json | sed -e 's/^/static\/2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.json:/g' > static/document_isin.list
jq -r ".[].ISIN" static/2022-January_Just-Transition-Assessment_Datasheet_SocialData.json | sed -e 's/^/static\/2022-January_Just-Transition-Assessment_Datasheet_SocialData.json:/g' >> static/document_isin.list
jq -r ".[].ISIN" static/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.json | sed -e 's/^/static\/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.json:/g' >> static/document_isin.list
jq -r '.[]."Company ISIN"' static/WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.json | sed -e "s/^/static\/WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.json:/g" >> static/document_isin.list
sed -i 's/^/"/g;s/$/"/g' static/document_isin.list
