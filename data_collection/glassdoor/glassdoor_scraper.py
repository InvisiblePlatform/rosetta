import json
import sys
import requests
import yaml
from bs4 import BeautifulSoup as bs
try:
    from yaml import CDumper as Dumper
except ImportError:
    from yaml import Dumper


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/83.0.4103.116 Safari/537.36'
}

def get_info(url):
    found = False
    overview = False
    try:
        req = requests.get(url, headers=headers)
    except Exception as e:
        sys.stderr.write("Exception in request {}, ({})\n".format(e, url))
        return None
    page = req.content
    soup = bs(page, features="html.parser")
    entities = soup.findAll(name='li', attrs={'class': 'align-items-center'})
    out = dict()
    for entity in entities:
        key = entity.label.string.replace(":",'').lower()
        try:
            value = str(entity.a.string)
        except:
            try:
                value = str(entity.div.string)
            except Exception as e:
                sys.stderr.write("Exception in Entity loop {}, ({})\n".format(e, url))
                pass
        out[key] = str(value)

    # sys.stderr.write("itemReviewed {}, ({})\n".format(thing.string, url))
    
    for thing in soup.findAll(name='script', attrs={'type': 'application/ld+json'}):
        obj = json.loads(thing.string)
        try:
            if obj["@type"] == "Review":
                continue
            if obj["@type"] == "EmployerAggregateRating":
                found = True
                ratingDict = dict()
                for item in obj:
                    if item == "@type":
                        continue
                    if item == "itemReviewed":
                        try:
                            out["website"] = obj[item]["sameAs"]
                        except Exception as e:
                            sys.stderr.write("Exception in itemReviewed {}, ({})\n".format(e, url))
                        continue
                    if item == "@context":
                        continue
                    ratingDict[item] = obj[item]
                out["glasroom_rating"] = ratingDict
                break;
            else:
                overview = obj['mainEntity'][0]['acceptedAnswer']['text'].split('"')[1]
        except Exception as e:
            sys.stderr.write("Exception in thingLoop {}, ({})\n".format(e, url))
            continue
    out["url"] = url
    try:
        links = json.loads("{}".format(
            soup.findAll(name="script")[-3]
            .string.split('\n')[3]
            .replace("        $.extend(GD.page,", "")
            .split("},")[0]) + "}}}")
        
        overview = links['employerHeaderData']['eiOverviewUrl']
    except:
        links = False

    if found:
        try:
            if out["revenue"]:
                return out
        except:
            if overview:
                return get_info("https://www.glassdoor.co.uk"+overview)
            else:
                sys.stderr.write("no true output on: {}\n".format(url))
                return out
    else:
        sys.stderr.write("no true output on: {}\n".format(url))
        if overview:
            return get_info("https://www.glassdoor.co.uk"+overview)
        else:
            sys.stderr.write("no overview on: {}\n".format(url))
            return out

url = sys.argv[1]
item = get_info(url)
data = {str(i): k for i, k in item.items()}
print(yaml.dump(data, allow_unicode=True, Dumper=Dumper, sort_keys=False))
