import './style.css';
import {Body, Kind, Scale, Catalog, solar, landmarks, loadCatalog, distance, formatLy, importBodies} from './catalog';
import {UniverseEngine} from './engine';
const arrow=`<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>`;
const icons={orbit:'◉',search:'⌕',home:'⌂',arrow:'↗',close:'×',plus:'+',game:'⌘'};
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<div id="universe"></div>
<div class="vignette"></div>
<header class="topbar">
 <a class="brand" href="#" aria-label="Universe home"><span class="brand-symbol">◌</span><span>UNIVERSE<small>THE COSMIC ATLAS</small></span></a>
 <nav class="scale-nav" aria-label="Exploration scale"><button data-scale="solar" class="active">Solar System</button><button data-scale="stellar">Stellar neighborhood</button><button data-scale="cosmic">Deep universe</button></nav>
 <div class="top-actions"><span id="pad-status" class="status" title="Connect a standard-mapped gamepad and press a button"><i></i> FLIGHT SYSTEMS ONLINE</span><button id="help-open" class="icon-button" aria-label="Open controls and science notes">?</button></div>
</header>
<main>
 <section class="scene-heading" aria-label="Current view"><div class="eyebrow"><span class="live-dot"></span><span id="sector">ORION SPUR / SOL SYSTEM</span></div><h1 id="scene-title">A little closer<br>to <em>infinity.</em></h1><p id="scene-subtitle">One universe. An extraordinary place to call home.</p><div class="view-meta"><span id="view-count">09 OBJECTS IN VIEW</span><span class="divider"></span><span id="scale-note">ORBITAL DISTANCES TO SCALE · RADII ENLARGED</span></div></section>
 <aside class="rail" aria-label="Explorer tools"><button id="catalog-open" title="Search the atlas (C)" aria-label="Search the atlas">${icons.search}</button><span></span><button id="home" title="Return to Earth (H)" aria-label="Return to Earth">${icons.home}</button><button id="overview" title="View entire region" aria-label="View entire region">◎</button><button id="tour" title="Take a guided tour" aria-label="Take a guided tour">▷</button><span></span><button id="matter" title="Toggle illustrative dark matter" aria-label="Toggle illustrative dark matter" aria-pressed="false">⌁</button><button id="labels" title="Toggle object labels" aria-label="Toggle object labels" aria-pressed="true">Aa</button></aside>
 <div id="reticle" aria-hidden="true"><span></span><span></span></div>
 <div id="flight-banner" hidden>FLIGHT ACTIVE <span>WASD to move · Shift to boost · Double-click to select · Esc to release mouse</span></div>
 <article class="object-card glass" aria-label="Selected celestial object"><div class="card-eyebrow"><span id="object-kind">TERRESTRIAL PLANET</span><span id="home-tag">⌂ OUR HOME</span></div><h2 id="object-name">Earth</h2><p id="object-description"></p><div class="object-stats"><div><span>FROM EARTH</span><strong id="object-distance">0 <small>ly</small></strong></div><div><span id="stat-label">MEAN RADIUS</span><strong id="object-stat">6,371 <small>km</small></strong></div></div><div id="object-note" class="object-note"></div><div class="card-actions"><button id="focus" class="primary">Travel to object <span>${arrow}</span></button><a id="object-source" target="_blank" rel="noopener noreferrer" title="Open data source">Source ${arrow}</a></div></article>
 <section class="distance-card glass" aria-label="Measure distance"><div class="section-label"><span class="line-icon">↔</span> DISTANCE BETWEEN WORLDS <button id="distance-collapse" aria-label="Collapse distance tool" aria-expanded="true">−</button></div><div id="distance-content"><div class="endpoints"><button id="endpoint-a"><i class="endpoint-dot"></i><span>Earth</span><small>⌄</small></button><div class="endpoint-line"></div><button id="endpoint-b"><i class="endpoint-dot secondary"></i><span>Mars</span><small>⌄</small></button></div><div class="distance-result"><strong id="distance-value">—</strong><span>LIGHT-YEARS</span></div><p id="distance-note">Approximate separation at illustrative orbital phases.</p></div></section>
 <div id="tour-card" class="glass" hidden><span class="eyebrow">GUIDED JOURNEY</span><strong id="tour-title"></strong><span id="tour-index"></span><div><button id="tour-prev">← Previous</button><button id="tour-next" class="primary">Next stop →</button><button id="tour-stop" aria-label="Stop tour">×</button></div></div>
 <div class="flight-dock glass"><button id="enter-flight"><span class="play-icon"><svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M3 1.5 10 6l-7 4.5z"/></svg></span><span>Enter flight<small>CLICK TO EXPLORE FREELY</small></span></button><div class="dock-divider"></div><label for="speed">FLIGHT SPEED <output id="speed-value">1×</output><input id="speed" type="range" min="-1" max="3" step=".1" value="0" aria-label="Flight speed"/></label><span class="dock-key">W A S D</span></div>
</main>
<footer><div><span class="live-dot"></span><span id="catalog-status">LOADING REAL-WORLD CATALOGS…</span><button id="science-open">Data & science ${arrow}</button></div><div><span id="fps">— FPS</span><span class="footer-divider">/</span><span>WEBGL · 3D EXPLORER</span></div></footer>
<div id="toast" role="status" hidden></div>
<div id="drawer-backdrop" class="backdrop" hidden></div>
<aside id="catalog-drawer" class="drawer" hidden aria-label="Object catalog"><div class="drawer-top"><div><span class="eyebrow">YOUR FIELD GUIDE</span><h2>The atlas<span>.</span></h2></div><button id="catalog-close" class="icon-button" aria-label="Close catalog">×</button></div><p id="catalog-purpose">Find your next destination.</p><label class="search-field"><span>⌕</span><input id="search" type="search" placeholder="Search stars, planets, galaxies…" autocomplete="off" aria-label="Search catalog"/><kbd>/</kbd></label><div class="filters" role="group" aria-label="Filter by type"><button data-kind="All" class="active">All</button><button data-kind="Planet">Planets</button><button data-kind="Star">Stars</button><button data-kind="Black hole">Black holes</button><button data-kind="Galaxy">Galaxies</button></div><div class="result-heading"><span id="result-count"></span><span>FROM EARTH</span></div><div id="results"></div><div class="pagination"><button id="page-prev">← Previous</button><span id="page-info"></span><button id="page-next">Next →</button></div><div class="import-area"><span>Expand your universe</span><label for="import-file">Import catalog ↗</label><input type="file" id="import-file" accept=".json,application/json" hidden/><small>JSON · J2000 coordinates · <button id="import-help">View format</button></small></div></aside>
<dialog id="help"><div class="modal-top"><span class="eyebrow">EXPLORER HANDBOOK</span><button id="help-close" class="icon-button" aria-label="Close handbook">×</button></div><h2>A universe at your fingertips.</h2><div class="help-columns"><section><h3>Mouse & keyboard</h3><dl><dt>Click scene / Enter flight</dt><dd>Capture mouse to look around</dd><dt>W A S D</dt><dd>Move forward, left, back, right</dd><dt>Space / Ctrl or Q</dt><dd>Rise / descend</dd><dt>Shift</dt><dd>Boost flight speed ×8</dd><dt>Double-click scene</dt><dd>Select object at crosshair</dd><dt>H / F / C</dt><dd>Home / focus selection / catalog</dd><dt>Esc</dt><dd>Release mouse / close dialog</dd></dl></section><section><h3>Gamepad · standard mapping</h3><dl><dt>Left stick</dt><dd>Move forward / back and strafe</dd><dt>Right stick</dt><dd>Look around</dd><dt>RT / LT</dt><dd>Rise / descend</dd><dt>LB</dt><dd>Boost flight speed ×8</dd><dt>A / Cross</dt><dd>Travel to selected object</dd><dt>B / Circle</dt><dd>Release mouse</dd><dt>X / Square</dt><dd>Return to Earth</dd><dt>Y / Triangle</dt><dd>Select next landmark</dd><dt>Start / Options</dt><dd>Open / close catalog</dd></dl><p class="muted">Connect a controller and press a button. Unsupported mappings are ignored. Catalog menus use mouse or keyboard.</p></section></div><section class="science-notes"><h3>An honest map of an enormous place.</h3><p id="data-details">Catalog loading…</p><p>The Solar System uses mean orbital radii with fixed, illustrative circular orbits. This is not a live ephemeris. Planet sizes are enlarged. Stellar and cosmic maps preserve sky directions but logarithmically compress radial distances. Visual separations are therefore not a measuring ruler.</p><p>Measurements use uncompressed three-dimensional catalog coordinates in light-years. Exoplanets share their host-star coordinates, so separations between planets in the same unresolved system cannot be determined. Galaxy distances are approximate, local Euclidean estimates, not cosmological comoving distances.</p><p>Dark matter does not emit light. The optional violet filaments are an artistic visualization, not an observed reconstruction. The Earth texture is by Solar System Scope (CC BY 4.0); other surface patterns, galaxy shapes, background stars, and black-hole disks are procedural illustrations. Galaxy sizes, orientations, and appearances are not to scale. These illustrations are not live imagery.</p><p>No single complete catalog contains every discovered celestial object. This atlas includes a measured-distance HYG snapshot, confirmed NASA archive exoplanets with usable distances, eight Solar System planets, and a small curated set of black holes and galaxies. Missing or uncertain distances limit what can be mapped.</p><div class="source-links"><a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Earth texture · Solar System Scope · CC BY 4.0 ↗</a><a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noopener noreferrer">NASA Exoplanet Archive ↗</a><a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noopener noreferrer">HYG Database · CC BY-SA 4.0 ↗</a><a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener noreferrer">NASA Planetary Fact Sheets ↗</a></div></section><div class="settings"><label><input id="quality" type="checkbox" checked/> High-resolution rendering</label><span id="controller-details">No standard gamepad detected</span></div></dialog>
`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let bodies:Body[]=[...solar,...landmarks],manifest:Catalog['manifest']|undefined;
let selected=solar.find(b=>b.id==='earth')!,endpointA=selected,endpointB=solar.find(b=>b.id==='mars')!;
let filter:Kind|'All'='All',page=0,endpointMode:'a'|'b'|null=null,query='',drawerOpen=false;
let engine:UniverseEngine|undefined;let toastTimer:ReturnType<typeof setTimeout>;
function toast(message:string){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function setPaused(){if(engine)engine.paused=drawerOpen||$<HTMLDialogElement>('help').open;}
function select(b:Body,travel=false){
 selected=b;engine?.select(b);$('object-name').textContent=b.name;$('object-kind').textContent=b.id==='earth'?'TERRESTRIAL PLANET':b.host?'EXOPLANET':b.kind.toUpperCase();$('home-tag').hidden=b.id!=='earth';$('object-description').textContent=b.description;
 $('object-distance').replaceChildren(document.createTextNode(formatLy(distance(solar[3],b))+' '),Object.assign(document.createElement('small'),{textContent:'ly'}));
 $('stat-label').textContent=b.radius?'MEAN RADIUS':b.host?'HOST STAR':'CATALOG';
 $('object-stat').textContent=b.radius?b.radius.toLocaleString('en-US')+' km':b.host|| (b.id.startsWith('hyg-')?'HYG v4.1':'CURATED');
 $('object-note').textContent=b.distanceNote || 'Approximate catalog distance. Illustrative appearance.';
 const source=$<HTMLAnchorElement>('object-source');source.hidden=!b.source;source.href=b.source||'#';
 if(travel){engine?.focus(b);updateScale(b.scale);}
}
function updateScale(scale:Scale){
 document.querySelectorAll<HTMLButtonElement>('[data-scale]').forEach(b=>{b.classList.toggle('active',b.dataset.scale===scale);b.setAttribute('aria-pressed',String(b.dataset.scale===scale));});
 $('sector').textContent={solar:'ORION SPUR / SOL SYSTEM',stellar:'MILKY WAY / STELLAR ATLAS',cosmic:'BEYOND THE MILKY WAY / DEEP FIELD'}[scale];
 $('scene-title').innerHTML={solar:'A little closer<br>to <em>infinity.</em>',stellar:'Every star,<br>a <em>possibility.</em>',cosmic:'Beyond our<br><em>horizon.</em>'}[scale];
 $('scene-subtitle').textContent={solar:'One universe. An extraordinary place to call home.',stellar:'Chart a course through our galactic neighborhood.',cosmic:'Island universes, scattered across the dark.'}[scale];
 $('scale-note').textContent=scale==='solar'?'ORBITAL DISTANCES TO SCALE · RADII ENLARGED':'LOGARITHMIC DISTANCE COMPRESSION · ILLUSTRATIVE RADII';
 $('view-count').textContent=scale==='solar'?'09 OBJECTS IN VIEW':scale==='stellar'?`${(bodies.filter(b=>b.scale==='stellar').length).toLocaleString('en-US')} CATALOG OBJECTS`:'CURATED GALAXIES & BLACK HOLES';
 const speed=scale==='solar'?3:50;if(engine)engine.controls.speed=speed*Math.pow(10,Number($<HTMLInputElement>('speed').value));
}
function updateDistance(){
 $('endpoint-a').querySelector('span')!.textContent=endpointA.name;$('endpoint-b').querySelector('span')!.textContent=endpointB.name;
 const unresolved=endpointA.host&&endpointB.host&&endpointA.host===endpointB.host&&endpointA.id!==endpointB.id;
 $('distance-value').textContent=unresolved?'Unresolved':formatLy(distance(endpointA,endpointB));
 $('distance-note').textContent=unresolved?'These planets share unresolved host coordinates. Their separation is not available.':endpointA.scale==='solar'&&endpointB.scale==='solar'?'Approximate separation at illustrative orbital phases.':'Approximate 3D separation from catalog coordinates. Uncertainties are not propagated.';
}
function setDrawer(open:boolean,mode:'a'|'b'|null=null){
 drawerOpen=open;endpointMode=mode;$('catalog-drawer').hidden=!open;$('drawer-backdrop').hidden=!open;
 if(open){engine?.controls.release();$('catalog-purpose').textContent=mode?`Choose ${mode==='a'?'the first':'the second'} distance endpoint.`:'Find your next destination.';renderResults();$<HTMLInputElement>('search').focus();}else $('catalog-open').focus();setPaused();
}
function renderResults(){
 const q=query.toLowerCase();let result=bodies.filter(b=>(filter==='All'||b.kind===filter)&&(!q||b.name.toLowerCase().includes(q)||b.host?.toLowerCase().includes(q)));
 if(!q&&filter==='All')result=[...solar,...landmarks,...result.filter(b=>!solar.includes(b)&&!landmarks.includes(b))];
 const max=Math.max(0,Math.ceil(result.length/50)-1);page=Math.min(page,max);$('result-count').textContent=result.length.toLocaleString('en-US')+' OBJECTS';
 const root=$('results');root.replaceChildren();
 for(const b of result.slice(page*50,(page+1)*50)){
  const button=document.createElement('button');button.className='result-row';const orb=document.createElement('span');orb.className='result-orb';orb.style.setProperty('--orb',b.color);
  const name=document.createElement('span');name.className='result-name';const title=document.createElement('strong');title.textContent=b.name;const sub=document.createElement('small');sub.textContent=b.kind+(b.host?` · ${b.host}`:b.id==='earth'?' · Our home':'');name.append(title,sub);
  const d=document.createElement('span');d.className='result-distance';d.textContent=formatLy(distance(solar[3],b))+' ly';button.append(orb,name,d);
  button.addEventListener('click',()=>{if(endpointMode){if(endpointMode==='a')endpointA=b;else endpointB=b;updateDistance();setDrawer(false);}else{select(b,true);setDrawer(false);}});root.append(button);
 }
 if(!result.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No objects found. Try another name or filter.';root.append(empty);}
 $('page-info').textContent=`${page+1} / ${max+1}`;$<HTMLButtonElement>('page-prev').disabled=page===0;$<HTMLButtonElement>('page-next').disabled=page===max;
}
$('catalog-open').onclick=()=>setDrawer(true);$('catalog-close').onclick=()=>setDrawer(false);$('drawer-backdrop').onclick=()=>setDrawer(false);
$<HTMLInputElement>('search').oninput=e=>{query=(e.target as HTMLInputElement).value;page=0;renderResults();};
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-kind]'))b.onclick=()=>{filter=b.dataset.kind as Kind|'All';page=0;document.querySelectorAll('[data-kind]').forEach(el=>el.classList.toggle('active',el===b));renderResults();};
$('page-prev').onclick=()=>{page--;renderResults();$('results').scrollTop=0;};$('page-next').onclick=()=>{page++;renderResults();$('results').scrollTop=0;};
$('endpoint-a').onclick=()=>setDrawer(true,'a');$('endpoint-b').onclick=()=>setDrawer(true,'b');
$('distance-collapse').onclick=()=>{const hidden=!$('distance-content').hidden;$('distance-content').hidden=hidden;$('distance-collapse').textContent=hidden?'+':'−';$('distance-collapse').setAttribute('aria-expanded',String(!hidden));};
function home(){select(solar[3],true);}
$('home').onclick=home;document.querySelector<HTMLAnchorElement>('.brand')!.onclick=e=>{e.preventDefault();home();};$('focus').onclick=()=>{engine?.focus(selected);updateScale(selected.scale);};
$('overview').onclick=()=>engine?.overview();
$('enter-flight').onclick=()=>{if(!engine){toast('3D rendering is unavailable. The searchable atlas and distance tool still work.');return;}engine.controls.capture();};
$<HTMLInputElement>('speed').oninput=e=>{const v=Math.pow(10,Number((e.target as HTMLInputElement).value));$('speed-value').textContent=v<1?v.toFixed(1)+'×':Math.round(v)+'×';if(engine)engine.controls.speed=(engine.scale==='solar'?3:50)*v;};
$('matter').onclick=()=>{if(!engine)return;engine.darkMatter=!engine.darkMatter;$('matter').setAttribute('aria-pressed',String(engine.darkMatter));if(engine.darkMatter)toast('Dark matter filaments are an artistic illustration, not observational data.');};
$('labels').onclick=()=>{if(!engine)return;engine.labels=!engine.labels;$('labels').setAttribute('aria-pressed',String(engine.labels));};
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-scale]'))b.onclick=()=>{const scale=b.dataset.scale as Scale;engine?.setScale(scale);engine?.overview();updateScale(scale);};
function help(){engine?.controls.release();$<HTMLDialogElement>('help').showModal();setPaused();}
$('help-open').onclick=help;$('science-open').onclick=help;$('help-close').onclick=()=>$<HTMLDialogElement>('help').close();$('help').addEventListener('close',()=>{setPaused();$('help-open').focus();});
$<HTMLInputElement>('quality').onchange=e=>engine?.setQuality((e.target as HTMLInputElement).checked);
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&drawerOpen)setDrawer(false);if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!$<HTMLDialogElement>('help').open){e.preventDefault();setDrawer(true);}});
$('import-help').onclick=()=>{toast('JSON format: [{"name":"Example","kind":"Star","ra":219.9,"dec":-60.8,"distanceLy":4.37}] — details in README.');};
$<HTMLInputElement>('import-file').onchange=async e=>{
 const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
 try{if(file.size>12*1024*1024)throw new Error('Maximum import size is 12 MB.');const added=importBodies(JSON.parse(await file.text()));bodies.push(...added);engine?.setCatalog(bodies);renderResults();toast(`Imported ${added.length.toLocaleString('en-US')} objects. User-supplied data is not verified.`);}catch(e){toast(e instanceof Error?e.message:'Could not import catalog.');}finally{input.value='';}
};
let tourIndex=-1;const stops=['earth','saturn','neptune','hyg-71683','sgr-a','andromeda','m87-bh'];
function tourStep(step:number){tourIndex=(step+stops.length)%stops.length;const b=bodies.find(b=>b.id===stops[tourIndex])||landmarks[0];select(b,true);$('tour-card').hidden=false;$('tour-title').textContent=b.name;$('tour-index').textContent=`${String(tourIndex+1).padStart(2,'0')} / ${String(stops.length).padStart(2,'0')}`;}
$('tour').onclick=()=>tourStep(0);$('tour-next').onclick=()=>tourStep(tourIndex+1);$('tour-prev').onclick=()=>tourStep(tourIndex-1);$('tour-stop').onclick=()=>{$('tour-card').hidden=true;tourIndex=-1;};
try{
 engine=new UniverseEngine($('universe'),{
  onSelect:b=>select(b),onFrame:fps=>{
    $('fps').textContent=fps+' FPS';const connected=!!engine?.controls.gamepadName;$('pad-status').classList.toggle('connected',connected);$('pad-status').lastChild!.textContent=connected?' GAMEPAD CONNECTED':' FLIGHT SYSTEMS ONLINE';$('controller-details').textContent=engine?.controls.gamepadName||'No standard gamepad detected';
  },onAction:a=>{if(a==='home')home();if(a==='focus'){engine?.focus(selected);updateScale(selected.scale);}if(a==='catalog')setDrawer(!drawerOpen);if(a==='next'){const index=landmarks.indexOf(selected);select(landmarks[(index+1)%landmarks.length],true);}if(a==='lock-failed')toast('Mouse capture was blocked. Open the app in its own tab, then click Enter flight.');},
  onLock:locked=>{$('flight-banner').hidden=!locked;$('reticle').classList.toggle('active',locked);$('enter-flight').classList.toggle('active',locked);}
 });engine.setCatalog(bodies);engine.focus(selected,true);
}catch(e){console.error(e);$('universe').classList.add('fallback');toast('WebGL could not start. Enable hardware acceleration or try a modern browser. The atlas and distance tool remain available.');}
select(selected);updateDistance();
loadCatalog().then(data=>{
 manifest=data.manifest;bodies=[...data.bodies,...bodies.filter(b=>b.id.startsWith('custom-'))];engine?.setCatalog(bodies);
 const alpha=bodies.find(b=>b.name==='Rigil Kentaurus')||bodies.find(b=>b.name==='Proxima Centauri');if(alpha)stops[3]=alpha.id;
 const total=bodies.length.toLocaleString('en-US');$('catalog-status').textContent=total+' CATALOGED OBJECTS · REAL COORDINATES';
 $('data-details').textContent=`Snapshot retrieved ${manifest.retrieved}: ${manifest.stars.toLocaleString('en-US')} HYG stars with usable distances, ${manifest.exoplanets.toLocaleString('en-US')} of ${manifest.archiveTotal.toLocaleString('en-US')} confirmed NASA archive exoplanets (${manifest.omittedExoplanets} omitted for missing distances), plus eight Solar System planets, the Sun, and ${landmarks.length} curated landmarks. Coordinates are J2000 equatorial, expressed as Earth/Sun-centered positions; the Earth–Sun offset is negligible at interstellar scales.`;
 if(drawerOpen)renderResults();if(engine)updateScale(engine.scale);
}).catch(e=>{console.error(e);$('catalog-status').textContent='LIMITED CATALOG · DATA LOAD FAILED';$('data-details').textContent='The full catalog could not load. Only Solar System objects and curated landmarks are available. Reload to retry.';toast('Could not load the full catalogs. Solar System and curated landmarks remain available. Reload to retry.');});
