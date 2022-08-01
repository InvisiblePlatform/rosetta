# Invisible Rosetta

What's going on, but with everything. 

In this repo will be a collection of scripts and tools to bootstrap collecting 
data to use in the newest Invisible Voice iteration. 

## Currently working:
- Wikidata
- bcorporation
- good on you
- World Benchmark Alliance
    - https://www.worldbenchmarkingalliance.org/research/2022-social-transformation-baseline-assessment/
    - https://www.worldbenchmarkingalliance.org/food-and-agriculture-benchmark/
    - https://www.worldbenchmarkingalliance.org/research/2021-just-transition-assessment/
    - https://www.worldbenchmarkingalliance.org/nature-benchmark/
- Trustpilot [1]
- Mediabiasfactcheck
- Glass Door 
    - https://www.glassdoor.com/
- Key for datasources
- Tying together in Hugo

## TODO:
- Wikipedia scrape with new data
- Glassdoor scraper improvements
- Trustpilot scraper improvements

## Potential:
- Crunchbase
- OpenSecret
- Yahoo Finance
- OpenCorporates
- OpenOwnership
- Adasina impact datasets 
    - https://adasina.com/education/#impact-datasets
- CSR Hub (ESG Ratings)
    - https://www.csrhub.com/
- Allsides
    - https://www.allsides.com/media-bias/ratings

## Magic bookmark
- javascript:void(window.open('https://test.reveb.la/'+(location.href.split('/')[2]).replace(/\./g,'')));


## Ordering 

1st: All information that isn’t wikipedia or Wikidata first

Separate wikipedia card info and wikipedia body text information for company

2nd: Then have wikipedia card

3rd: Have wikipedia information from that company

4th: Then have wiki data information

5th: Then have Wikidata companies and people / - and their wikipedia

---
[1]: trustpilot is a unique case and will be done last, also they employ rate limiting so the crawling takes more time than previously assumed, napkin is around but can be made faster with smarter scripts after initial grab (frequent updating on known entries and less frequent updating on non-entries)
