#!/bin/bash

ID=$1


if grep -q "\"$ID\"" ../wikidata/website_id_list.csv; then
    while read site; do
        echo website: $site
        if grep -q "$site" ../bcorp/website_stub_bcorp.csv; then
            BCORP=$(grep "$site" ../bcorp/website_stub_bcorp.csv| sed -e "s/[^,]*,//g")
            echo bcorpid: $BCORP
            BCORPSCORE=$(jq --arg bcorp ${BCORP//\"/} '.[] | select(.slug == $bcorp) | .latestVerifiedScore' ../bcorp/combined_data.json)
            echo bcorpscore: $BCORPSCORE
        fi
        if grep -q "$site" ../goodonyou/goodforyou_web_brandid.csv; then
            GOY=$(grep "$site" ../goodonyou/goodforyou_web_brandid.csv | sed -e "s/[^,]*,//g")
            echo goodonyouid: $GOY
            IFS=, read -a info < <(jq -r ".pageProps.brand | [.ethicalRating, .ethicalLabel, .labourRating, .labourLabel, .environmentRating, .environmentLabel, .animalRating, .animalLabel, .lastRated] | @csv" ../goodonyou/brands/brand_${GOY//\"/}.json)
            echo goodonyou_ethicalRating: ${info[0]} 
            echo goodonyou_ethicalLabel: ${info[1]}
            echo goodonyou_labourRating: ${info[2]}
            echo goodonyou_labourLabel: ${info[3]}
            echo goodonyou_environmentRating: ${info[4]}
            echo goodonyou_environmentLabel: ${info[5]}
            echo goodonyou_animalRating: ${info[6]}
            echo goodonyou_animalLabel: ${info[7]}
            echo goodonyou_lastRated: ${info[8]}
        fi

    if grep -q "\"$ID\"" ../wikidata/isin_wikidataid.csv; then
        ISIN=$(grep "\"$ID\"" ../wikidata/isin_wikidataid.csv| sed -e "s/,[^,]*$//g" -e "s/\"//g")
        echo ISIN: $ISIN
        JUSTTRANSTION_OVERALLSCORE=$(grep "$ISIN" ../static/2022-January_Just-Transition-Assessment_Datasheet_JustTransitionData.csv | cut -d, -f4)
        JUSTTRANSITION_SOCIAL_SCORE=$(grep "$ISIN" ../static/2022-January_Just-Transition-Assessment_Datasheet_SocialData.csv | cut -d, -f4)
        FAA_SCORE=$(grep "$ISIN" ../static/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.csv | cut -d, -f11)
        FAA_RANK=$(grep "$ISIN" ../static/Food-and-Agriculture-Benchmark-detailed-scoring-sheet-2021-2.csv | cut -d, -f10)
        SOCIALTRANSFORMATION_SCORE=$(grep "$ISIN" ../static/WBA_Social_Transformation_Baseline_Data_JAN_2022_overall_scores.csv | cut -d, -f6)
        [[ $JUSTTRANSTION_OVERALLSCORE != "" ]] && echo wb_just_transition_2022_score: $JUSTTRANSTION_OVERALLSCORE
        [[ $JUSTTRANSITION_SOCIAL_SCORE != "" ]] && echo wb_just_transition_2022_social: $JUSTTRANSITION_SOCIAL_SCORE
        [[ $FAA_SCORE != "" ]] && echo wb_foodag_2021_score: $FAA_SCORE
        [[ $FAA_RANK != "" ]] && echo wb_foodag_2021_rank: $FAA_RANK
        [[ $SOCIALTRANSFORMATION_SCORE != "" ]] && echo wb_social_transformation_2022_score: $SOCIALTRANSFORMATION_SCORE
    fi
    if grep -q "$ID" ../trust-pilot/wikiid_domain_datetaken_reviewcount_score.csv; then
        trustpilot=$(grep "^$ID" ../trust-pilot/wikiid_domain_datetaken_reviewcount_score.csv | cut -d';' -f 4)
        [[ $trustpilot != "" ]] && echo trustpilot_score: $trustpilot

    fi
    done < <(grep "\"$ID\"" ../wikidata/website_id_list.csv | sed -e "s/,.*//g")
fi
