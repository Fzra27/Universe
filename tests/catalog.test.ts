import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spherical,distance,solar,AU_LY,importBodies,displayPosition} from '../src/catalog.ts';
import {deadzone} from '../src/controls.ts';
import fs from 'node:fs';
test('RA/declination positions and 3D distances preserve physical units',()=>{
 assert.deepEqual(spherical(0,0,4),[4,0,-0]);
 const north=spherical(75,90,6);assert.ok(Math.abs(north[1]-6)<1e-12);
 assert.ok(Math.abs(distance(solar[0],solar[3])-AU_LY)<1e-12);
 assert.equal(distance(solar[3],solar[3]),0);
 const a={...solar[0],position:[3,0,0] as [number,number,number]},b={...a,position:[0,4,0] as [number,number,number]};assert.equal(distance(a,b),5);assert.equal(distance(a,b),distance(b,a));
});
test('view compression never changes the physical source coordinates',()=>{
 const b={...solar[0],position:[100,200,300] as [number,number,number]};const before=[...b.position];
 for(const s of ['solar','stellar','cosmic'] as const){const p=displayPosition(b,s);assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[1]/p[0]-2)<1e-10);}
 assert.deepEqual(b.position,before);
});
test('controller drift is removed while preserving full travel',()=>{assert.equal(deadzone(.1),0);assert.equal(deadzone(-.15),0);assert.equal(deadzone(1),1);assert.equal(deadzone(-1),-1);assert.ok(deadzone(.5)>0);});
test('custom catalogs reject invalid coordinates and preserve names as text',()=>{
 assert.throws(()=>importBodies([{name:'Bad',kind:'Star',ra:NaN,dec:0,distanceLy:1}]));
 assert.throws(()=>importBodies([{name:'Bad',kind:'Star',ra:360,dec:0,distanceLy:1}]));
 assert.throws(()=>importBodies([{name:'Bad',kind:'Star',ra:0,dec:-91,distanceLy:1}]));
 assert.throws(()=>importBodies([{name:'Bad',kind:'Star',ra:0,dec:0,distanceLy:-1}]));
 const [b]=importBodies([{name:'<script>alert(1)</script>',kind:'Star',ra:0,dec:0,distanceLy:4}]);assert.equal(b.position[0],4);assert.ok(b.id.startsWith('custom-'));
});
test('bundled snapshots match manifest and contain only usable coordinate rows',()=>{
 const root=new URL('../public/data/',import.meta.url),read=(f:string)=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
 const stars=read('stars.json'),planets=read('exoplanets.json'),m=read('manifest.json');
 assert.equal(stars.length,m.stars);assert.equal(planets.length,m.exoplanets);assert.equal(planets.length+m.omittedExoplanets,m.archiveTotal);assert.ok(stars.length>100000);assert.ok(planets.length>6000);
 for(const r of [...stars,...planets]){assert.ok([r[2],r[3],r[4]].every(Number.isFinite));assert.ok(r[2]>=0&&r[2]<360);assert.ok(Math.abs(r[3])<=90);assert.ok(r[4]>0);}
});
