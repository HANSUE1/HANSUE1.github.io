"""Measures the public repos for the Build chapter's chart and writes src/data/build-history.json.

Run it from the project root, then `npm run build`:  python tools/build-history.py
It clones each repo in REPOS into a temp folder and only reads their history, so it needs no API token and can
only ever see public work. Lines are counted per language at the end of each week, from what each commit added and
removed. Lockfiles, build output and vendored or generated files don't count (SKIP). A .zip committed to a repo
counts as its contents, on the day it was committed: e-Barangay was uploaded that way.
"""
import collections
import datetime as dt
import io
import json
import os
import re
import subprocess
import tempfile
import zipfile

OWNER = 'HANSUE1'
# Repo, the name on the chart. Soft-Eng is left out: nothing has been pushed to it yet.
REPOS = [
    ('SoftwareEng_Project', 'e-Barangay'),
    ('HANSUE1.github.io', 'This portfolio'),
    ('Web-data-extraction', 'Web Data Extraction'),
    ('React.js-Fundamentals', 'React Fundamentals'),
    ('Test-Bank-system', 'Bank System'),
    ('Brute-Force-Tool', 'Brute-Force Tool'),
    ('LAB-ACT-DF', 'LAB-ACT-DF'),
]
SKIP = re.compile(
    r'(^|/)(node_modules|dist|build|vendor|\.venv|venv|__pycache__|js/react|\.next|\.output|\.tanstack|target|bin|obj|public/assets)/'
    r'|package-lock\.json$|bun\.lockb?$|yarn\.lock$|pnpm-lock|\.min\.|\.map$|\.lock$|routeTree\.gen|\.d\.ts$'
)
GENERATED = {('Web-data-extraction', 'app.js')}  # a Browserify bundle, committed at the repo's root
LANGUAGES = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript',
    '.py': 'Python', '.css': 'CSS', '.html': 'HTML', '.java': 'Java', '.cpp': 'C++', '.hpp': 'C++', '.h': 'C++', '.c': 'C++', '.sql': 'SQL',
}
OUT = 'src/data/build-history.json'


def language(repo, path):
    if SKIP.search(path) or (repo, path) in GENERATED:
        return None
    return LANGUAGES.get(os.path.splitext(path)[1].lower())


def git(folder, *args, binary=False):
    done = subprocess.run(['git', '-C', folder, *args], capture_output=True, check=True)
    return done.stdout if binary else done.stdout.decode('utf-8', 'replace')


def zip_lines(repo, data):
    """Lines per language inside a committed archive. It is only read, never unpacked."""
    lines = collections.Counter()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for name in archive.namelist():
            lang = language(repo, name) if not name.endswith('/') and '__MACOSX' not in name else None
            if lang:
                lines[lang] += archive.read(name).count(b'\n') + 1
    return lines


def history(repo, folder):
    """One (date, {language: change in lines}) per commit, oldest first."""
    log = git(folder, 'log', '--reverse', '--first-parent', '-m', '--no-renames', '--numstat', '--date=short', '--format=@%H %ad')
    commits = []
    for line in log.splitlines():
        if line.startswith('@'):
            sha, date = line[1:].split()
            commits.append((sha, date, collections.Counter()))
        elif line.strip():
            added, removed, path = line.split('\t', 2)
            if path.lower().endswith('.zip') and added == '-':
                try:
                    commits[-1][2].update(zip_lines(repo, git(folder, 'show', f'{commits[-1][0]}:{path}', binary=True)))
                except subprocess.CalledProcessError:
                    pass  # the commit removed the archive
            elif added != '-' and (lang := language(repo, path)):
                commits[-1][2][lang] += int(added) - int(removed)
    return [(date, change) for _, date, change in commits]


def week_of(date):
    day = dt.date.fromisoformat(date)
    return day - dt.timedelta(days=day.weekday())


def main():
    with tempfile.TemporaryDirectory() as temp:
        projects = []
        for repo, name in REPOS:
            folder = os.path.join(temp, repo)
            subprocess.run(['git', 'clone', '-q', '--bare', f'https://github.com/{OWNER}/{repo}.git', folder], check=True)
            projects.append((repo, name, history(repo, folder)))

    dates = [date for _, _, commits in projects for date, _ in commits]
    first, last = week_of(min(dates)), week_of(max(dates))
    weeks = [first + dt.timedelta(days=7 * i) for i in range((last - first).days // 7 + 1)]

    rows = []
    for repo, name, commits in projects:
        totals = collections.Counter()
        per_week = {week: collections.Counter() for week in weeks}
        counts = [0] * len(weeks)
        for date, change in commits:
            per_week[week_of(date)].update(change)
            counts[weeks.index(week_of(date))] += 1
        lines = collections.defaultdict(lambda: [0] * len(weeks))
        for i, week in enumerate(weeks):
            totals.update(per_week[week])
            for lang, count in totals.items():
                lines[lang][i] = max(0, count)
        lines = {lang: series for lang, series in lines.items() if series[-1] > 0}
        if lines:
            rows.append({'name': name, 'url': f'https://github.com/{OWNER}/{repo}', 'lines': lines, 'commits': counts})

    rows.sort(key=lambda row: -sum(series[-1] for series in row['lines'].values()))
    result = {'measured': dt.date.today().isoformat(), 'weeks': [week.isoformat() for week in weeks], 'projects': rows}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as file:
        json.dump(result, file, separators=(',', ':'))
        file.write('\n')

    for row in rows:
        print(f"{row['name']:<22}{sum(row['commits']):>4} commits  " + '  '.join(f'{lang} {series[-1]:,}' for lang, series in sorted(row['lines'].items(), key=lambda item: -item[1][-1])))
    print(f"{len(weeks)} weeks from {weeks[0]} to {weeks[-1]}")


if __name__ == '__main__':
    main()
