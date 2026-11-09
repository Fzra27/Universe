"""Download public catalog snapshots. No credentials or runtime API dependency."""
import csv, io, json, pathlib, urllib.request, urllib.parse, datetime, gzip
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'public/data'
ROOT.mkdir(parents=True, exist_ok=True)
def get(url):
    req = urllib.request.Request(url, headers={'User-Agent':'UniverseExplorer/1.0'})
    with urllib.request.urlopen(req, timeout=180) as r: return r.read()
def save(name, data):
    (ROOT / name).write_text(json.dumps(data, separators=(',',':')), encoding='utf-8')
query = 'select pl_name,hostname,ra,dec,sy_dist,pl_orbsmax,pl_rade,discoverymethod,disc_year from pscomppars'
url = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?' + urllib.parse.urlencode({'query':query,'format':'json'})
raw = json.loads(get(url))
planets = []
for p in raw:
    if p['ra'] is None or p['dec'] is None or p['sy_dist'] is None or p['sy_dist'] <= 0: continue
    planets.append([p['pl_name'],p['hostname'],round(p['ra'],7),round(p['dec'],7),round(p['sy_dist']*3.261563777,7),p['pl_orbsmax'],p['pl_rade'],p['discoverymethod'],p['disc_year']])
print('Exoplanets with measured distance:', len(planets), 'of', len(raw), flush=True)
hyg_url = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'
try: data = get(hyg_url)
except Exception:
    hyg_url = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv.gz'
    data = gzip.decompress(get(hyg_url))
stars = []
for s in csv.DictReader(io.StringIO(data.decode('utf-8'))):
    d = float(s['dist'] or 0)
    if d <= 0 or d >= 100000: continue # HYG sentinel means missing distance
    # Every HYG star with a finite measured distance, not just naked-eye stars.
    stars.append([int(s['id']),s['proper'] or s['bf'] or ('HIP '+s['hip'] if s['hip'] else 'HYG '+s['id']),round(float(s['ra'])*15,7),round(float(s['dec']),7),round(d*3.261563777,7),float(s['mag'] or 15),s['spect'],s['ci']])
# Replace snapshots only after both sources were successfully downloaded and parsed.
save('exoplanets.json', planets)
save('stars.json',stars)
print('HYG stars with measured distance:',len(stars),flush=True)
save('manifest.json',{'retrieved':datetime.date.today().isoformat(),'exoplanets':len(planets),'archiveTotal':len(raw),'stars':len(stars),'sources':{'exoplanets':url,'stars':hyg_url},'omittedExoplanets':len(raw)-len(planets),'note':'Only objects with positive finite catalog distances are mapped. Exoplanets are placed at their host-star coordinates; planetary orbits are unresolved.'})
