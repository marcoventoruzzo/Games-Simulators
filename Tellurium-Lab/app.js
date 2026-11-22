import {loadTextures,render,phaseDisc,skyChart,skyDome,dot,unit,solsticeDiagram} from './scene.js';

const $=id=>document.getElementById(id);
const DAY=86400000,HOUR=DAY/24,MIN=Date.UTC(1900,0,1),MAX=Date.UTC(2101,0,1)-60000;
const iso=t=>new Date(t).toISOString();
const short=t=>iso(t).slice(0,10);
const clock=t=>new Date(t).toISOString().slice(11,16);
const clamp=t=>Math.max(MIN,Math.min(MAX,t));
const names=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
const presets={top:[-Math.PI/2,Math.PI/2],tilt:[-Math.PI/2,.68],edge:[-Math.PI/2,.025]};
const configs={
  phases:['EARTH-CENTERED','The lunar cycle','Fixed Earth map · sizes and distances enlarged'],
  eclipse:['ECLIPSE GEOMETRY','How shadows make eclipses','Schematic geometry · body sizes, shadows, and tilt enlarged'],
  orbit:['SUN-CENTERED','One year around the Sun','Circular orbit model · body markers enlarged'],
  seasons:['EARTH’S YEAR','One orbit. Two opposite seasons.','Orbit shape to scale · Sun, Earth, and axis enlarged']
};
let api, view='phases', selected=clamp(Date.now()), anchor=selected, dayStart=Math.floor(selected/DAY)*DAY;
let camera={az:presets.tilt[0],el:presets.tilt[1],zoom:1},frame,sky;
let latitude=45.4642,longitude=9.19,gain=20,playing=false,timer,busy=false,pending=false,revision=0;
let skyKey='', drag=null, playToken=0, checkpoint=null, seasonKey, solstice=null;
let orbitTimer, orbitPlaying=false;
const ORBIT_YEAR=365.256;
const lesson={eclipse:'solar-miss',season:null,orbitDay:0,orbitView:'top'};
const cases={
 'solar-miss':['New Moon · no eclipse','The Moon crosses the Sun’s direction in longitude well away from a node. The shadow passes above or below Earth.'],
 'solar-total':['Total solar eclipse','The Moon comes between the Sun and Earth. Observers in the narrow umbra see the whole solar disk covered. Observers in the surrounding penumbra see a partial eclipse.'],
 'solar-partial':['Partial solar eclipse','Only the Moon’s penumbra reaches Earth in this example. From inside it, the Moon covers part of the solar disk.'],
 'lunar-total':['Total lunar eclipse','Earth comes between the Sun and the full Moon. The whole Moon enters Earth’s umbra and can glow red as filtered sunlight bends through Earth’s atmosphere.'],
 'lunar-partial':['Partial lunar eclipse','Only part of the full Moon enters Earth’s umbra. The edge of Earth’s shadow is visible on the Moon.']
};
const quarterNotes=[
  'The lit half faces away from Earth. From here we see almost none of it.',
  'Sunlight strikes the Moon from the side as seen from Earth. About half the visible disk is lit, and the lit portion is growing.',
  'The lit half faces Earth. The visible disk is almost fully illuminated.',
  'We see about half the visible disk lit again. This time the lit portion is shrinking.'
];
const seasonNames={mar_equinox:'March equinox',jun_solstice:'June solstice',sep_equinox:'September equinox',
  dec_solstice:'December solstice',perihelion:'Perihelion',aphelion:'Aphelion'};

function status(message,kind=''){
  $('status').textContent=message;
  $('status').className=kind;
}

async function connect(){
  try{
    const check=location.hostname==='127.0.0.1'||location.hostname==='localhost'?await fetch('./api',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(['frame',[iso(selected),latitude,longitude,false]])}):null;
    if(check?.ok) {
      await check.json();
      return async (op,args)=>{
        const r=await fetch('./api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([op,args])});
        if(!r.ok)throw new Error('The local Python server returned '+r.status);
        return r.json();
      };
    }
  }catch(error){console.info('Starting browser Python.',error.message);}
  const base='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const {loadPyodide}=await import(base+'pyodide.mjs');
  const py=await loadPyodide({indexURL:base});
  await py.loadPackage(new URL('vendor/astronomy_engine-2.1.19-py3-none-any.whl',import.meta.url).href);
  const response=await fetch(new URL('model.py',import.meta.url));
  if(!response.ok)throw new Error('Python model could not be downloaded');
  py.runPython(await response.text());
  const request=py.globals.get('request_json');
  return (op,args)=>JSON.parse(request(JSON.stringify([op,args])));
}

const guides={
  phases:`
    <div class="guide-card">
      <div class="phase-summary"><div><span class="eyebrow">AS SEEN FROM EARTH</span><h3 id="phase-name">—</h3></div><canvas class="disc" id="phase-disc" aria-label="Illuminated lunar disk"></canvas></div>
      <div class="metrics"><div class="metric"><strong id="lit">—</strong>Illuminated</div><div class="metric"><strong id="distance">—</strong>From Earth</div></div>
      <p id="phase-hint"></p>
      <button id="toggle-sky" aria-controls="sky">Open Earth view</button>
    </div>
    <div class="guide-card"><h3>Jump to a phase</h3><p>Find the next occurrence after the selected instant.</p>
      <div class="actions"><button data-event="0">New Moon</button><button data-event="90">First Quarter</button><button data-event="180">Full Moon</button><button data-event="270">Last Quarter</button></div>
      <details><summary>Longitude gap and elongation</summary><p>The phase clock measures how far east the Moon is from the Sun in ecliptic longitude. Elongation is their actual separation in Earth’s sky. The Moon’s tilted orbit makes the two angles differ.</p><div class="metrics"><div class="metric"><strong id="longitude-gap">—</strong>Eastward longitude gap</div><div class="metric"><strong id="elongation">—</strong>Sky separation</div></div></details>
      <details open><summary>Why the shape changes</summary><p>Follow the gold arrows from the Sun. They always light the half of the Moon facing the Sun. The dotted blue line marks Earth’s view. Compare the orbit with the disk above to see how much of the lit half faces us.</p></details>
    </div>`,
  eclipse:`
    <div class="guide-card"><h3>Compare the alignments</h3>
      <div class="actions">${Object.entries(cases).map(([key,[title]])=>'<button data-eclipse="'+key+'">'+title+'</button>').join('')}</div>
      <h3 id="case-title"></h3><p id="eclipse-explainer"></p>
    </div>
    <div class="guide-card"><h3>Why most months miss</h3>
      <p>A <strong>node</strong> is where the Moon crosses Earth’s orbital plane. A new or full Moon must be near a node for the bodies to line up closely enough. The ~5° tilt is exaggerated in the drawing.</p>
      <p><strong>Umbra</strong> is the inner shadow, where the whole Sun is blocked. In the <strong>penumbra</strong> only part of the Sun is blocked.</p>
      <details><summary>Sestri Levante, August 2026</summary><p>At maximum in Sestri, the Moon covered 93.5% of the Sun. Sestri was in the penumbra of an eclipse that was total elsewhere.</p></details>
    </div>`,
  seasons:`
    <div class="guide-card"><h3>Follow Earth through the year</h3>
      <div class="actions">${Object.entries(seasonNames).map(([key,name])=>'<button data-season="'+key+'">'+name+'</button>').join('')}</div>
      <div class="metrics">
        <div class="metric"><strong id="axis-tilt">—</strong>Axis tilt from orbit normal</div>
        <div class="metric"><strong id="solar-distance">—</strong>Distance from Sun</div>
      </div>
      <p id="season-light" class="callout"></p>
      <div class="day-bars"><label>45° N <span id="day-n"></span><meter id="north-meter" min="0" max="24"></meter></label>
        <label>45° S <span id="day-s"></span><meter id="south-meter" min="0" max="24"></meter></label></div>
    </div>
    <div class="guide-card"><h3>Why July is warm in the north</h3>
      <p>The north pole points roughly the same way all year. Around June the Northern Hemisphere tilts toward the Sun. The Sun climbs higher and stays up longer. The Southern Hemisphere gets the opposite.</p>
      <p>Earth is usually <strong>farthest in early July</strong> and <strong>closest in early January</strong>. The tilt drives the seasons. At an equinox, the Sun is overhead at the equator and day and night are nearly equal.</p>
    </div>`,
  orbit:`
    <div class="guide-card"><h3>Choose your viewpoint</h3>
      <div class="actions"><button data-orbit-view="top">Above the solar system</button><button data-orbit-view="sun">From the Sun</button></div>
      <div class="actions" id="orbit-gains"><button data-gain="1">True scale</button><button data-gain="20">20× Moon offset</button></div>
      <p id="orbit-explainer"></p>
    </div>
    <div class="guide-card"><h3>Why the Moon keeps moving forward</h3>
      <p>Earth travels around the Sun at about 30 km/s. The Moon moves around Earth at about 1 km/s. The small lunar motion periodically adds to or subtracts from the much faster shared motion.</p>
      <details><summary>About the model</summary><p>Uses mean periods (365.26 and 27.32 days), mean distances and coplanar circular orbits. The Moon’s cycle continues across the end of each model year. From the Sun, successive near-side passages are about 29.5 days apart.</p></details>
    </div>`

};

const hints=[
  'Near the Sun in our sky, it generally rises and sets around the same time as the Sun.',
  'East of the Sun, it is often easiest to see low in the west after sunset.',
  'It often rises around midday and sets around midnight. Look for it during the afternoon.',
  'It often rises before sunset and stays visible well into the night.',
  'It usually rises near sunset and sets near sunrise.',
  'It usually rises after sunset and can remain visible after sunrise.',
  'It often rises around midnight and sets around midday. Look for it in the morning.',
  'West of the Sun, it is often easiest to see in the east before sunrise.'
];

function updateGuide(){
  if(!frame&&(view==='phases'||view==='seasons'))return;
  if(view==='phases'){
    const angle=frame.phase;
    const p=Math.round(angle/45)%8;
    const principal=p%2===0&&Math.abs(((angle-p*45+540)%360)-180)<1;
    const i=principal?p:((Math.floor(angle/90)*2+1)%8);
    $('phase-name').textContent=names[i];
    $('longitude-gap').textContent=angle.toFixed(1)+'°';
    const cosine=-dot(unit(frame.earth),unit(frame.moon));
    $('elongation').textContent=(180/Math.PI*Math.acos(Math.max(-1,Math.min(1,cosine)))).toFixed(1)+'°';
    $('lit').textContent=(100*frame.lit).toFixed(1)+'%';
    $('distance').textContent=Math.round(frame.distance).toLocaleString('en-US')+' km';
    $('phase-hint').textContent=hints[i];
    phaseDisc($('phase-disc'),frame,!$('sky').hidden&&!!frame.skyView);
    if(checkpoint!==null){
      $('checkpoint-percent').textContent=(100*frame.lit).toFixed(1)+'% lit';
      phaseDisc($('checkpoint-disc'),frame,!$('sky').hidden&&!!frame.skyView);
    }
  } else if(view==='eclipse'){
    const [title,note]=cases[lesson.eclipse];
    $('case-title').textContent=title;
    $('eclipse-explainer').textContent=note;
    for(const b of $('guide').querySelectorAll('[data-eclipse]'))b.setAttribute('aria-pressed',String(b.dataset.eclipse===lesson.eclipse));
  } else if(view==='seasons'){
    $('axis-tilt').textContent=frame.obliquity.toFixed(2)+'°';
    $('solar-distance').textContent=(frame.solar_distance/1e6).toFixed(1)+' million km';
    const dec=frame.declination;
    $('season-light').textContent=Math.abs(dec)<.06?'The midday Sun is directly above the equator.':
      'The midday Sun is directly overhead at '+Math.abs(dec).toFixed(1)+'° '+(dec>0?'N':'S')+'.';
    for(const [i,id] of ['north','south'].entries()){
      $(id+'-meter').value=frame.daylight[i];
      $(i===0?'day-n':'day-s').textContent=frame.daylight[i].toFixed(1)+' hours of daylight';
    }
    if(solstice){
      const north=solstice==='jun_solstice';
      $('solstice-title').textContent=seasonNames[solstice];
      $('solstice-note').textContent='Identically spaced rays hit a shorter stretch of ground at 45° '+(north?'N':'S')+
        '. The higher midday Sun concentrates the same beam, and daylight lasts longer there.';
      solsticeDiagram($('solstice-rays'),dec);
    }
  }
}

function setCamera(name){
  [camera.az,camera.el]=presets[name];camera.zoom=1;
  for(const key of Object.keys(presets))$(key).setAttribute('aria-pressed',String(key===name));
  draw();
}

function setView(name){
  if(view!==name){stop();clearCheckpoint();}
  view=name;
  for(const button of document.querySelectorAll('[data-view]')){
    if(button.dataset.view===name)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
  if(name!=='phases')$('sky').hidden=true;
  const undated=name==='eclipse'||name==='orbit';
  for(const id of ['camera-controls','zoom-controls','calendar-controls','stamp'])$(id).hidden=undated;
  $('orbit-controls').hidden=name!=='orbit';
  const seasonSpeed=$('season-speed');
  seasonSpeed.hidden=name!=='seasons';
  if(name==='seasons')$('speed').value='30';
  else if($('speed').value==='30')$('speed').value='1';
  const [label,title,note]=configs[name];
  $('frame-label').textContent=label;$('scene-title').textContent=title;$('scale-note').textContent=note;
  $('guide').innerHTML=guides[name];
  $('toggle-sky')?.addEventListener('click',()=>setSky($('sky').hidden));
  updateGain();
  setCamera(name==='orbit'?'top':'tilt');
  anchor=selected;updateClock();updateGuide();request();
}

function updateGain(){
  if(view!=='orbit')return;
  for(const button of document.querySelectorAll('[data-gain]'))button.setAttribute('aria-pressed',String(+button.dataset.gain===gain));
  const fromSun=lesson.orbitView==='sun';
  const description=fromSun?'The camera follows Earth from the Sun. The Moon passes from side to side, alternately crossing in front of and behind Earth.':
    'Blue is Earth’s track. White is the Moon’s. At true scale the tracks almost overlap. Magnify the Moon’s displacement to see it sway.';
  $('orbit-explainer').textContent=description;
  $('orbit-gains').hidden=fromSun;
  for(const b of $('guide').querySelectorAll('[data-orbit-view]'))b.setAttribute('aria-pressed',String(b.dataset.orbitView===lesson.orbitView));
  $('scale-note').textContent=fromSun?'Moon’s sideways motion enlarged':gain===1?'True orbital scale · body markers enlarged':'Moon offset enlarged '+gain+'× · Earth orbit to scale';
  updateOrbitClock();
}
function updateOrbitClock(){
  const day=lesson.orbitDay%ORBIT_YEAR;
  $('orbit-scrub').value=day;
  $('orbit-progress').textContent='Day '+(Math.floor(day)+1)+' · repeating year';
}
function toggleOrbit(){
  if(orbitPlaying){stop();return;}
  orbitPlaying=true;
  $('orbit-play').textContent='Pause year';
  let last=performance.now();
  orbitTimer=setInterval(()=>{
    const now=performance.now();
    lesson.orbitDay+=(now-last)*ORBIT_YEAR/36000;
    last=now;updateOrbitClock();draw();
  },50);
}

function updateClock(){
  const stamp=iso(selected);
  $('stamp').firstChild.nodeValue=stamp.slice(0,10)+' · '+stamp.slice(11,19)+' ';
  if(document.activeElement!==$('date'))$('date').value=stamp.slice(0,16);
  const span=timelineSpan();
  $('scrub').max=span;
  $('scrub').value=Math.round((selected-anchor)/timelineStep());
  $('range-start').textContent=rangeLabel(anchor);
  $('range-mid').textContent=rangeLabel(clamp(anchor+span*timelineStep()/2));
  $('range-end').textContent=rangeLabel(clamp(anchor+span*timelineStep()));
  $('day-scrub').value=Math.round((selected-dayStart)/60000);
  $('sky-start').textContent=short(dayStart)+' 00:00';
  $('sky-end').textContent=short(dayStart+36*HOUR)+' 12:00';
}

const timelineStep=()=>view==='eclipse'?60000:view==='seasons'?DAY:HOUR;
const timelineSpan=()=>view==='eclipse'?240:view==='seasons'?365:744;
const rangeLabel=t=>view==='eclipse'?short(t).slice(5)+' '+clock(t):short(t);

function clearCheckpoint(){
  checkpoint=null;
  $('phase-popup').hidden=true;
  solstice=null;$('solstice-panel').hidden=true;
}
function showCheckpoint(quarter){
  checkpoint=quarter;
  $('checkpoint-title').textContent=names[quarter*2];
  $('checkpoint-note').textContent=quarterNotes[quarter];
  $('checkpoint-percent').textContent='';
  $('phase-popup').hidden=false;
  $('resume').focus({preventScroll:true});
}
function changeDate(time,reset=false,keepSkyDay=false,keepCheckpoint=false){
  if(!Number.isFinite(time))return;
  selected=clamp(time);
  if(!keepCheckpoint)clearCheckpoint();
  if(reset||selected<anchor||selected>anchor+timelineSpan()*timelineStep())anchor=selected;
  if(!keepSkyDay&&(reset||selected<dayStart||selected>dayStart+36*HOUR))dayStart=Math.floor(selected/DAY)*DAY;
  updateClock();request();
}

function setSky(open){
  $('sky').hidden=!open;skyKey='';
  $('toggle-sky')?.setAttribute('aria-expanded',String(open));
  if($('toggle-sky'))$('toggle-sky').textContent=open?'Close Earth view':'Open Earth view';
  if(open){
    dayStart=Math.floor(selected/DAY)*DAY;
    updateClock();
    $('sky').scrollIntoView({block:'nearest'});
  }
  request();
}

function draw(){
  render($('space'),view,camera,frame,gain,lesson);
  if(!$('sky').hidden&&frame?.sunSky){
    skyChart($('sky-canvas'),sky,(selected-dayStart)/HOUR,frame);
    skyDome($('sky-dome'),sky,frame);
  }
}

function showSky(){
  if(!sky||!frame?.sunSky)return;
  const e=sky.events;
  const fmt=t=>t?short(t).slice(5)+' '+clock(t):'—';
  const direction=a=>['N','NE','E','SE','S','SW','W','NW'][Math.round(a/45)%8];
  const coords=([az,alt])=>alt.toFixed(1)+'° alt · '+Math.round(az)%360+'° '+direction(az);
  const chips=[['Moon now',coords(frame.moonSky)],['Moonrise',fmt(e.moonrise)],['Moonset',fmt(e.moonset)],
               ['Sun now',coords(frame.sunSky)],['Sunrise',fmt(e.sunrise)],['Sunset',fmt(e.sunset)]];
  $('sky-readout').innerHTML=chips.map(([key,value])=>'<span class="chip">'+key+' <strong>'+value+'</strong></span>').join('');
  phaseDisc($('sky-disc'),frame,true);
}

function request(){
  revision+=1;
  if(!api||view==='eclipse'||view==='orbit')return;
  pending=true;
  if(!busy)void refresh();
}

async function refresh(){
  busy=true;
  while(pending){
    pending=false;
    const r=revision;
    const time=selected, currentView=view, open=!$('sky').hidden, start=dayStart;
    const lat=latitude,lon=longitude;
    if(currentView==='orbit'||currentView==='eclipse')continue;
    try{
      const result=await api('frame',[iso(time),lat,lon,open]);
      if(open){
        const key=[start,lat,lon].join('/');
        if(key!==skyKey){
          sky=await api('sky',[iso(start),36,lat,lon]);
          skyKey=key;
        }
      }
      if(currentView==='seasons'){
        const year=new Date(time).getUTCFullYear();
        if(year!==seasonKey){lesson.season=await api('season',[year]);seasonKey=year;}
      }
      if(r===revision){
        frame=result;
        status('● EPHEMERIS READY','ready');
        updateGuide();if(open)showSky();draw();
      }
    }catch(error){
      console.error(error);status('Calculation could not be completed','error');stop();
    }
  }
  busy=false;
}

function stop(){
  if(timer)clearInterval(timer);
  if(orbitTimer)clearInterval(orbitTimer);
  orbitPlaying=false;$('orbit-play').textContent='Play year';
  playToken++;
  playing=false;$('play').textContent='▶';$('play').setAttribute('aria-label','Play');$('play').setAttribute('aria-pressed','false');
}
async function togglePlay(){
  if(playing){stop();return;}
  if(!api||selected>=MAX)return;
  clearCheckpoint();
  const token=++playToken;
  playing=true;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pause');$('play').setAttribute('aria-pressed','true');
  let next=null;
  try{
    if(view==='phases')next=await api('quarter',[iso(selected+1000)]);
    if(view==='seasons'){
      const year=new Date(selected).getUTCFullYear();
      for(const y of [year,year+1]){
        const data=await api('season',[y]);
        const key=['jun_solstice','dec_solstice'].find(k=>Date.parse(data.markers[k].date)>selected+1000);
        if(key){next={date:data.markers[key].date,solstice:key};break;}
      }
    }
  }catch(error){
    if(token===playToken){stop();status('Could not find the next checkpoint','error');}
    return;
  }
  if(token!==playToken)return;
  const pauseAt=next?Date.parse(next.date):Infinity;
  let last=performance.now();
  timer=setInterval(()=>{
    if(busy){last=performance.now();return;}
    const now=performance.now();
    const candidate=selected+(now-last)*DAY*Number($('speed').value)/1000;
    last=now;
    if(candidate>=pauseAt&&pauseAt<=MAX){
      stop();
      if(next.solstice)showSolstice(next.solstice);
      else showCheckpoint(next.quarter);
      changeDate(pauseAt,false,false,true);return;
    }
    changeDate(candidate);
    if(selected>=MAX)stop();
  },75);
}

function showSolstice(key){
  solstice=key;
  $('solstice-panel').hidden=false;
  $('solstice-title').textContent=seasonNames[key];
  $('solstice-resume').focus({preventScroll:true});
}

async function jump(kind){
  if(!api)return;
  stop();
  const source=view;
  try{
    const hit=await api('event',[kind,iso(selected+60000)]);
    if(view!==source)return;
    if(!hit.date||Date.parse(hit.date)>MAX){
      status('Next event is beyond 2100','error');return;
    }
    if(view==='phases'){
      showCheckpoint(Number(kind)/90);
      changeDate(Date.parse(hit.date),true,false,true);
    }else changeDate(Date.parse(hit.date),true);
  }catch(error){console.error(error);status('Event search failed','error');}
}

function shiftSky(time){
  stop();changeDate(dayStart+time*60000,false,true);
}

function updateObserver(){
  const custom=$('place').value==='custom';
  $('coords').hidden=!custom;
  const fields=[$('lat'),$('lon')];
  if(custom&&fields.some(field=>!field.value||!field.validity.valid))return;
  [latitude,longitude]=custom?fields.map(field=>Number(field.value)):$('place').value.split(',').map(Number);
  request();
}
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setView(button.dataset.view);
for(const id of Object.keys(presets))$(id).onclick=()=>setCamera(id);
$('guide').addEventListener('click',event=>{
  const b=event.target.closest('button');
  if(!b)return;
  if(b.dataset.event)void jump(b.dataset.event);
  if(b.dataset.eclipse){lesson.eclipse=b.dataset.eclipse;updateGuide();draw();}
  if(b.dataset.orbitView){lesson.orbitView=b.dataset.orbitView;updateGain();draw();}
  if(b.dataset.season&&lesson.season?.markers[b.dataset.season]){
    stop();clearCheckpoint();
    const key=b.dataset.season, isSolstice=key.endsWith('solstice');
    if(isSolstice)showSolstice(key);
    changeDate(Date.parse(lesson.season.markers[key].date),true,false,isSolstice);
  }
  if(b.dataset.gain){gain=+b.dataset.gain;updateGain();draw();}
});
$('play').onclick=togglePlay;
$('orbit-play').onclick=toggleOrbit;
$('orbit-scrub').oninput=()=>{
  stop();
  lesson.orbitDay=Math.floor(lesson.orbitDay/ORBIT_YEAR)*ORBIT_YEAR+Math.min(ORBIT_YEAR-.001,Number($('orbit-scrub').value));
  updateOrbitClock();draw();
};
$('solstice-resume').onclick=()=>{$('play').focus({preventScroll:true});void togglePlay();};
$('resume').onclick=()=>{$('play').focus({preventScroll:true});void togglePlay();};
$('forward').onclick=()=>{stop();changeDate(selected+(view==='eclipse'?5*60000:DAY));};
$('today').onclick=()=>{stop();changeDate(Date.now(),true);};
$('date').onchange=()=>{
  const time=Date.parse($('date').value+'Z');
  if($('date').validity.valid&&Number.isFinite(time)){stop();changeDate(time,true);}
  else status('Choose a date from 1900 to 2100','error');
};
$('scrub').oninput=()=>{stop();changeDate(anchor+Number($('scrub').value)*timelineStep());};
$('hide-sky').onclick=()=>{setSky(false);$('toggle-sky')?.focus();};
$('place').onchange=updateObserver;
$('lat').onchange=updateObserver;
$('lon').onchange=updateObserver;
$('day-scrub').oninput=()=>shiftSky(Number($('day-scrub').value));
$('sky-canvas').onclick=event=>{
  shiftSky(Math.max(0,Math.min(2160,(event.offsetX-37)/($('sky-canvas').clientWidth-49)*2160)));
};
function zoom(m){
  camera.zoom=Math.max(.58,Math.min(3.5,camera.zoom*m));draw();
}
function orbit(dx,dy){
  camera.az+=dx;camera.el=Math.max(-1.56,Math.min(1.56,camera.el+dy));
  for(const key of Object.keys(presets))$(key).setAttribute('aria-pressed','false');
  draw();
}
$('plus').onclick=()=>zoom(1.2);$('minus').onclick=()=>zoom(1/1.2);
const space=$('space');
space.onpointerdown=e=>{drag=[e.clientX,e.clientY];space.setPointerCapture(e.pointerId);};
space.onpointerup=space.onpointercancel=()=>{drag=null;};
space.onpointermove=e=>{
  if(!drag)return;
  orbit((e.clientX-drag[0])*.008,(e.clientY-drag[1])*.008);
  drag=[e.clientX,e.clientY];
};
space.onkeydown=e=>{
  const arrows={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};
  if(arrows[e.key]){e.preventDefault();orbit(...arrows[e.key]);}
  if(e.key==='+'||e.key==='=')zoom(1.2);
  if(e.key==='-')zoom(1/1.2);
};
const observer=new ResizeObserver(()=>{draw();updateGuide();if(!$('sky').hidden)showSky();});
observer.observe(space);observer.observe($('sky-canvas'));observer.observe($('sky-dome'));
setView('phases');updateClock();
void loadTextures().then(()=>{draw();updateGuide();});
try{
  api=await connect();
  request();
}catch(error){
  console.error(error);
  status('Could not load Python. Reload, or run locally.','error');
}
