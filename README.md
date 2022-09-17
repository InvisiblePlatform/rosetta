# Invisible Rosetta

What's going on, but with everything. 

In this repo will be a collection of scripts and tools to bootstrap collecting 
data to use in the newest Invisible Voice iteration. 

## Extension
[https://github.com/ixt/invisible/](https://github.com/ixt/invisible)

## Current Sources:
- Bcorp
- Glassdoor 
- Goodonyou.eco
- Mediabiasfactcheck
- Similar-sites.org [1]
- ToS;DR
- TrustPilot [1]
- WikiData
- Wikipedia
    - Article
    - Infocard
- Yahoo Finance
- World Benchmark Alliance
    - https://www.worldbenchmarkingalliance.org/research/2022-social-transformation-baseline-assessment/
    - https://www.worldbenchmarkingalliance.org/food-and-agriculture-benchmark/
    - https://www.worldbenchmarkingalliance.org/research/2021-just-transition-assessment/

## Future Sources
- World Benchmark Alliance
    - https://www.worldbenchmarkingalliance.org/nature-benchmark/

## Potential:
- Crunchbase
- OpenSecret
- OpenCorporates
- OpenOwnership
- Adasina impact datasets 
    - https://adasina.com/education/#impact-datasets
- Allsides
    - https://www.allsides.com/media-bias/ratings
- Ethical Consumer:
    - https://www.ethicalconsumer.org/

## Magic bookmark
- javascript:void(window.open('https://test.reveb.la/'+(location.href.split('/')[2]).replace(/\./g,'')));

## TODO (Not Priority Order):
- Cleanup the Wikidata dir 
- Reorganise sources into a folder seperate from root
- Decouple record-build.sh from the websites.list generation
- Updating wikidatacache with latest-all.bz2.json
- https://en.wikipedia.org/api/rest_v1/page/mobile-sections/
- https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=Kofoworola_Abeni_Pratt&format=json


## Ordering 

1st: All information that isn’t wikipedia or Wikidata first

Separate wikipedia card info and wikipedia body text information for company

2nd: Then have wikipedia card

3rd: Have wikipedia information from that company

4th: Then have wiki data information

5th: Then have Wikidata companies and people / - and their wikipedia

---
[1]: trustpilot and similarsites are a unique case and will be done last, also they employ rate limiting so the crawling takes a while
