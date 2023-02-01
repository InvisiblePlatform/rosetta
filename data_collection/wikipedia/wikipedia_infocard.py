from bs4 import BeautifulSoup
from urllib.request import urlopen
import json
from sys import argv
site= argv[1]
hdr = {'User-Agent': 'Mozilla/5.0'}
page = urlopen(site)
soup = BeautifulSoup(page.read(), features="html5lib")
table = soup.find('table', class_='infobox')
print(table)
# result = {}
# exceptional_row_count = 0
# for tr in table.find_all('tr'):
#     if tr.find('th'):
#         result[tr.find('th').text] = tr.find('td').text
#     else:
#         # the first row Logos fall here
#         exceptional_row_count += 1
# print(json.dumps(result))
