#!/bin/bash
# jq 'reduce .[] as $item ({}; .[$item.ISIN]=$item)' 2022_FinancialBenchmark.json
rm document_isin.list
jq -r ".[].ISIN" 2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.json | sed -e 's/^/static\/2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.json:/g' > document_isin.list
jq -r ".[].ISIN" 2022-January_Just-Transition-Assessment_Datasheet_SocialData.json | sed -e 's/^/static\/2022-January_Just-Transition-Assessment_Datasheet_SocialData.json:/g' >> document_isin.list
jq -r ".[].ISIN" Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.json | sed -e 's/^/static\/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.json:/g' >> document_isin.list
jq -r ".[].ISIN" 2022_FinancialBenchmark.json | sed -e 's/^/static\/2022_FinancialBenchmark.json:/g' >> document_isin.list
jq -r ".[].ISIN" 2022-TransportBenchmark.json | sed -e 's/^/static\/2022-TransportBenchmark.json:/g' >> document_isin.list
jq -r '.[]."Company ISIN"' WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.json | sed -e "s/^/static\/WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.json:/g" >> document_isin.list
sed -i 's/^/"/g;s/$/"/g' document_isin.list
