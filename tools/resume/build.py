"""Prints resume.html and cv.html to files/ as PDFs.

Edit the HTML, then run it from the project root:  python tools/resume/build.py
Needs playwright. The PDFs are public once pushed, so keep private details such as a phone number out.
"""
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
DOCUMENTS = [('resume', 'Hans-Santos-Resume'), ('cv', 'Hans-Santos-CV')]


def main():
    (ROOT / 'files').mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for source, name in DOCUMENTS:
            page.goto((ROOT / 'tools' / 'resume' / f'{source}.html').as_uri(), wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            page.pdf(path=str(ROOT / 'files' / f'{name}.pdf'), prefer_css_page_size=True, print_background=True)
            print('wrote', name)
        browser.close()


if __name__ == '__main__':
    main()
