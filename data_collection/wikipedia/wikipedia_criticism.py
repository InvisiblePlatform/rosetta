from sys import argv
import wikipediaapi
import urllib
from simplejson.errors import JSONDecodeError

wiki_wiki = wikipediaapi.Wikipedia('en')
def main():
    prepend = argv[2].replace('_', ' ').replace('%26','&')
    if prepend == "0":
        prepend = ''
    quicklist = [
        'racist',
        'ideology',
        'allegations',
        'defamation',
        'persona',
        'political',
        'backlash',
        'efforts',
        'transphobia',
        'sexism',
        'sexist'
    ]
    page = wiki_wiki.page(urllib.parse.unquote(argv[2]))
    wikistylingtitle = '{ class="wikititle" }'
    #wikistylingp = "{: class='wikiparagraph' }"
    try:
        title_list = []
        for title in open(argv[1]).read().splitlines():
            title_list.append(title)
        for section in page.sections:
            for item in quicklist:
                if item in section.title:
                    title_list.append(section.title)
                    break
            if section.title in title_list:
                if prepend != '': print(f"# {prepend}'s {section.title} {wikistylingtitle}")
                if prepend == '': print(f"# {section.title} {wikistylingtitle}")
                if section.sections.__len__() > 1:
                    for s in section.sections:
                        if s.sections.__len__() > 1:
                            for l in s.sections:
                                if prepend != '': print(f"## {prepend}'s {l.title} {wikistylingtitle}")
                                if prepend == '':  print(f"## {l.title} {wikistylingtitle}")
                                print(f"""{l.text}""")
                        if prepend != '': print(f"## {prepend}'s {s.title} {wikistylingtitle}")
                        if prepend == '':  print(f"## {s.title} {wikistylingtitle}")
                        print(f"""{s.text}""")
                else:
                    print(f"""{section.text}""")
    except JSONDecodeError:
        return

main()
