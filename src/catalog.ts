export type Kind = 'Planet' | 'Star' | 'Black hole' | 'Galaxy';
export type Scale = 'solar' | 'stellar' | 'cosmic';
export type Vec3 = [number, number, number];
export interface Body {
  id: string; name: string; kind: Kind; position: Vec3; color: string;
  radius?: number; au?: number; phase?: number; host?: string;
  description: string; source: string; scale: Scale; magnitude?: number;
  distanceNote?: string;
}
export const AU_LY = 1 / 63241.07708426628;
export const PC_LY = 3.261563777;
export function spherical(ra: number, dec: number, ly: number): Vec3 {
  const a = ra * Math.PI / 180, d = dec * Math.PI / 180;
  return [ly * Math.cos(d) * Math.cos(a), ly * Math.sin(d), -ly * Math.cos(d) * Math.sin(a)];
}
export function distance(a: Body, b: Body): number {
  return Math.hypot(...a.position.map((v,i) => v-b.position[i]));
}
export function formatLy(value: number): string {
  if (value === 0) return '0';
  if (value < .001) return value.toExponential(6);
  return new Intl.NumberFormat('en-US',{maximumSignificantDigits:7}).format(value);
}
export function displayPosition(body: Body, scale: Scale): Vec3 {
  if (scale === 'solar') return body.position.map(v => v / AU_LY * 8) as Vec3;
  const r = Math.hypot(...body.position);
  if (!r) return [0,0,0];
  // Preserve sky direction. Radial compression makes interstellar & cosmic scales navigable.
  const target = scale === 'stellar' ? Math.log10(1+r) * 90 : Math.log10(1+r/1000) * 65;
  return body.position.map(v => v/r*target) as Vec3;
}
const solarSource = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';
const planetRows: [string,number,number,string,number,string][] = [
 ['Mercury',.387,2440,'#a49b91',.4,'The smallest planet. A cratered, airless world with an 88-day year.'],
 ['Venus',.723,6052,'#e7c48b',2.0,'A thick carbon-dioxide atmosphere traps heat on our nearest planetary neighbor.'],
 ['Earth',1,6371,'#64c5ef',0,'Our home. The only world known to support life, orbiting an ordinary star in the Milky Way.'],
 ['Mars',1.524,3390,'#df865e',2.8,'A cold desert world with polar ice, giant volcanoes, and traces of ancient water.'],
 ['Jupiter',5.203,69911,'#d7b492',.8,'The largest planet in our Solar System. Its atmosphere hosts immense storms.'],
 ['Saturn',9.537,58232,'#d8c69d',2.1,'An icy ring system surrounds this low-density gas giant.'],
 ['Uranus',19.191,25362,'#a1e1df',3.7,'An ice giant tilted almost onto its side, with a blue-green methane atmosphere.'],
 ['Neptune',30.069,24622,'#527fe9',5.1,'A distant ice giant with powerful winds and a deep blue atmosphere.']
];
export const solar: Body[] = [{id:'sun',name:'Sun',kind:'Star',position:[0,0,0],color:'#ffe4a5',radius:696340,description:'Our star. A G-type main-sequence star, approximately 4.6 billion years old.',source:solarSource,scale:'solar'},
 ...planetRows.map(([name,au,radius,color,phase,description]):Body => ({id:name.toLowerCase(),name,au,radius,color,phase,description,kind:'Planet',position:[Math.cos(phase)*au*AU_LY,0,Math.sin(phase)*au*AU_LY],scale:'solar',source:solarSource,distanceNote:'Illustrative circular, coplanar orbits at mean orbital radii; fixed phases, not current ephemerides.'}))];
export const landmarks: Body[] = [
 {id:'sgr-a',name:'Sagittarius A*',kind:'Black hole',position:spherical(266.4168,-29.0078,26670),color:'#f7a86a',scale:'stellar',description:'The supermassive black hole at the center of the Milky Way. Approximately four million solar masses.',source:'https://science.nasa.gov/resource/sagittarius-a/'},
 {id:'cygnus-x1',name:'Cygnus X-1',kind:'Black hole',position:spherical(299.5903,35.2016,7240),color:'#ffb075',scale:'stellar',description:'A stellar-mass black hole in a binary system. Distance is approximate.',source:'https://science.nasa.gov/mission/chandra/'},
 {id:'gaia-bh1',name:'Gaia BH1',kind:'Black hole',position:spherical(262.171, -0.582,1560),color:'#ffaf7a',scale:'stellar',description:'A dormant stellar-mass black hole in a binary system in Ophiuchus. Approximate catalog distance.',source:'https://www.esa.int/Science_Exploration/Space_Science/Gaia'},
 {id:'milky-way',name:'Milky Way',kind:'Galaxy',position:spherical(266.4168,-29.0078,26670),color:'#b9b8ed',scale:'cosmic',description:'Our home galaxy. Earth lies in the Orion Spur, about 26,670 light-years from its center. This marker denotes the center, not an external galaxy.',source:'https://science.nasa.gov/universe/galaxies/our-milky-way-galaxy/'},
 {id:'andromeda',name:'Andromeda · M31',kind:'Galaxy',position:spherical(10.6847,41.269,2537000),color:'#c5c9ff',scale:'cosmic',description:'The nearest large spiral galaxy. It and the Milky Way dominate the Local Group.',source:'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/'},
 {id:'triangulum',name:'Triangulum · M33',kind:'Galaxy',position:spherical(23.4621,30.6602,2730000),color:'#8fced6',scale:'cosmic',description:'A spiral galaxy in the Local Group, smaller than Andromeda and the Milky Way.',source:'https://science.nasa.gov/mission/hubble/'},
 {id:'lmc',name:'Large Magellanic Cloud',kind:'Galaxy',position:spherical(80.894,-69.756,163000),color:'#b4d4ef',scale:'cosmic',description:'A satellite galaxy of the Milky Way rich in young stars and stellar nurseries.',source:'https://science.nasa.gov/universe/galaxies/'},
 {id:'smc',name:'Small Magellanic Cloud',kind:'Galaxy',position:spherical(13.187,-72.829,200000),color:'#adc9e7',scale:'cosmic',description:'An irregular dwarf galaxy and neighbor of the Large Magellanic Cloud.',source:'https://science.nasa.gov/universe/galaxies/'},
 {id:'m87',name:'Messier 87',kind:'Galaxy',position:spherical(187.7059,12.3911,53500000),color:'#edd8b9',scale:'cosmic',description:'A giant elliptical galaxy in the Virgo Cluster. Its central black hole was imaged by the Event Horizon Telescope.',source:'https://science.nasa.gov/mission/hubble/'},
 {id:'m87-bh',name:'M87*',kind:'Black hole',position:spherical(187.7059,12.3911,53500000),color:'#ffc08e',scale:'cosmic',description:'A supermassive black hole of about 6.5 billion solar masses. Shares its host galaxy’s unresolved catalog position.',source:'https://eventhorizontelescope.org/'},
 {id:'whirlpool',name:'Whirlpool · M51',kind:'Galaxy',position:spherical(202.4696,47.1952,31000000),color:'#bcbef2',scale:'cosmic',description:'An interacting spiral galaxy with sweeping arms, approximately 31 million light-years away.',source:'https://science.nasa.gov/mission/hubble/'},
 {id:'sombrero',name:'Sombrero · M104',kind:'Galaxy',position:spherical(189.9976,-11.6231,29000000),color:'#e5ccac',scale:'cosmic',description:'A galaxy famous for its brilliant central bulge and prominent dark dust lane.',source:'https://science.nasa.gov/mission/hubble/'}
];
export function starColor(spectrum:string):string {
 const s=spectrum.trim()[0]; return ({O:'#91b4ff',B:'#adc5ff',A:'#d8e4ff',F:'#f6f1e4',G:'#ffe1ab',K:'#ffc18a',M:'#ff9276'} as Record<string,string>)[s] || '#e4e8f1';
}
export interface Manifest {retrieved:string;exoplanets:number;archiveTotal:number;stars:number;omittedExoplanets:number;note:string}
export interface Catalog {bodies:Body[];manifest:Manifest;}
export async function loadCatalog():Promise<Catalog> {
 const base = import.meta.env.BASE_URL;
 const fetchJSON = async (name:string) => { const r=await fetch(`${base}data/${name}.json`);if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`); return r.json(); };
 const [stars, planets, manifest] = await Promise.all([fetchJSON('stars'),fetchJSON('exoplanets'),fetchJSON('manifest')]);
 const bodies:Body[]=[...solar,...landmarks];
 for(const [id,name,ra,dec,ly,mag,spec] of stars) bodies.push({id:`hyg-${id}`,name,kind:'Star',position:spherical(ra,dec,ly),color:starColor(spec),magnitude:mag,scale:'stellar',description:`${spec || 'Unclassified'} star · apparent magnitude ${mag}. Position and distance from HYG v4.1.`,source:'https://github.com/astronexus/HYG-Database',distanceNote:'Catalog distance; uncertainty varies by object. Coordinates use the J2000 equatorial frame.'});
 for(const [name,host,ra,dec,ly,au,radius,method,year] of planets) bodies.push({id:`exo-${name}`,name,host,kind:'Planet',position:spherical(ra,dec,ly),color:'#b4c6b8',scale:'stellar',description:`Confirmed exoplanet orbiting ${host}. Discovered ${year ?? 'date unknown'} by ${method ?? 'an unspecified method'}.${radius?` Radius: ${Number(radius).toFixed(2)} Earth radii.`:''}${au?` Orbital semi-major axis: ${au} AU.`:''}`,source:'https://exoplanetarchive.ipac.caltech.edu/',distanceNote:'Placed at the host-star position. Orbital separation is unresolved; same-host planet distances are not available.'});
 return {bodies,manifest};
}
export function importBodies(input:unknown):Body[] {
 if(!Array.isArray(input)||input.length>20000) throw new Error('Import an array of at most 20,000 objects.');
 return input.map((v,i) => {
  if(!v || typeof v.name!=='string' || !v.name.trim() || !['Planet','Star','Black hole','Galaxy'].includes(v.kind)||![v.ra,v.dec,v.distanceLy].every(n=>typeof n==='number'&&Number.isFinite(n))||v.ra<0||v.ra>=360||Math.abs(v.dec)>90||v.distanceLy<=0)throw new Error(`Invalid object at row ${i+1}. Expected name, kind, ra (0–360°), dec (±90°), distanceLy > 0.`);
  return {id:`custom-${crypto.randomUUID()}`,name:v.name.slice(0,100),kind:v.kind,position:spherical(v.ra,v.dec,v.distanceLy),color:'#c3e9e4',scale:v.distanceLy>100000?'cosmic':'stellar',description:typeof v.description==='string'?v.description.slice(0,1000):'User-imported object. Verify its coordinates and distance independently.',source:'',distanceNote:'User-provided coordinates; not independently verified.'};
 });
}
