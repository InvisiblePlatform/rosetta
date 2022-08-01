import json
import sys
import datetime
import re
import requests
import time
import yaml
from bs4 import BeautifulSoup as bs
from os import listdir
from os.path import isfile, join
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
}


def get_info(url):
    try:
        req = requests.get(url, headers=headers)
    except requests.exceptions.MissingSchema:
        return None
    page = req.content
    soup = bs(page, features="html.parser")

    rating = json.loads(soup.findAll(name='script', attrs={'type': 'application/ld+json'})[0].string)
    breakpoint()
    overview = rating['mainEntity'][0]['acceptedAnswer']['text'].split('"')[1]
    return overview

url = sys.argv[1]

print(get_info(url), url)
