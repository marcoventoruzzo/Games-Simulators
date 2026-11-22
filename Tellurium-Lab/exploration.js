import {atlasGlobe,canvasContext,loadTextures} from './scene.js';

const tau=2*Math.PI, blue='#91c8ff', gold='#ffd18e', faint='#a8bedb';
const mix=(a,b,t)=>a+(b-a)*t;
const random=i=>{const n=Math.sin(i*127.1+4.7)*43758.5453;return n-Math.floor(n)};
function dot(c,x,y,r,color){
  c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,tau);c.fill();
}
function line(c,points,color,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function text(c,s,x,y,color=faint,align='center',size=12){
  c.font='600 '+size+'px system-ui';c.textAlign=align;
  c.strokeStyle='#08101d';c.lineWidth=3;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);
}
function space(c,w,h,count=95){
  const g=c.createRadialGradient(w*.53,h*.42,0,w*.53,h*.42,w*.65);
  g.addColorStop(0,'#1a2c48');g.addColorStop(1,'#070c18');c.fillStyle=g;c.fillRect(0,0,w,h);
  for(let i=0;i<count;i++)dot(c,random(i)*w,random(i+611)*h,.3+.95*random(i+200),'#d2e5ff76');
}
function observe(canvas,draw){
  const observer=new ResizeObserver(draw);observer.observe(canvas);draw();
  return ()=>observer.disconnect();
}

const planets=[
  ['Mercury',4879,57.9,'#aaa59b',.34,'a coarse speck'],
  ['Venus',12104,108.2,'#f3c58a',.73,'a small pinhead'],
  ['Earth',12742,149.6,'#6db8ee',.78,'a grain of coarse salt'],
  ['Mars',6779,227.9,'#e07954',.51,'a fine grain of salt'],
  ['Jupiter',139820,778.6,'#e8ba92',2.20,'a pea or small marble'],
  ['Saturn',116460,1433.5,'#edd399',1.85,'a pea or small marble'],
  ['Uranus',50724,2872.5,'#a4e1dd',1.19,'a small bead'],
  ['Neptune',49244,4495.1,'#618deb',1.15,'a small bead']
];
function planetDisc(c,x,y,r,color,i){
  if(i===5)line(c,Array.from({length:49},(_,j)=>{
    const a=j*tau/48;return [x+Math.cos(a)*r*1.55,y+Math.sin(a)*r*.45+Math.cos(a)*r*.32];
  }),'#d9c3a9',2);
  const g=c.createRadialGradient(x-r*.31,y-r*.35,0,x,y,r);
  g.addColorStop(0,'#fff6de');g.addColorStop(.49,color);g.addColorStop(1,'#142034');
  dot(c,x,y,r,g);
  if(i===2||i===4){
    c.save();c.beginPath();c.arc(x,y,r,0,tau);c.clip();
    if(i===2){
      for(const [dx,dy,rx,ry] of [[-.32,-.26,.41,.27],[.24,.12,.28,.43],[.52,-.29,.27,.19]]){
        c.fillStyle='#5e8e68';c.beginPath();c.ellipse(x+r*dx,y+r*dy,r*rx,r*ry,.6,0,tau);c.fill();
      }
    }else{
      for(const k of [-.42,-.09,.3])line(c,[[x-r,y+k*r],[x+r,y+k*r]],'#91604a',Math.max(1,r*.11));
    }
    c.restore();
  }
}

export function mountSolarScale(root){
  root.innerHTML=`<article class="lab-card explorer"><h2>How big is the Solar System?</h2>
    <p>Start with a picture-book lineup. Pick a Sun to put both the planet diameters and their average distances on one common scale.</p>
    <div class="lab-actions"><label>If the Sun was a… <select data-scale><option value="">Choose an object</option><option value="orange">Orange</option><option value="basketball">Basketball</option></select></label><button type="button" data-reset>Restore illustration</button></div>
    <canvas aria-label="The Sun and eight planets on one horizontal line"></canvas>
    <div data-scale-note></div><div class="scale-cards" data-planets></div></article>`;
  const q=s=>root.querySelector(s),canvas=q('canvas'),select=q('select');
  const model={orange:{diameter:75,label:'orange',icon:'🍊'},basketball:{diameter:240,label:'basketball',icon:'🏀'}};
  const sunKm=1392700,format=new Intl.NumberFormat('en-US',{maximumSignificantDigits:3});
  let progress=0,frame=0;
  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,y=h*.5,unit=Math.min(15,w*.022),start=w*.07,end=w*.935;
    space(c,w,h,65);line(c,[[start,y],[end,y]],'#8398b14d');
    const sunR=mix(unit*2.35,(end-start)*sunKm/(2*4495100000),progress);
    if(sunR>=1)dot(c,start,y,sunR,'#ffc96b');
    if(progress>.45){
      c.beginPath();c.arc(start,y,5,0,tau);c.strokeStyle=gold;c.lineWidth=1.5;c.stroke();
      line(c,[[start,y-23],[start,y-6]],gold);
    }
    text(c,'Sun',start,y-44,gold);
    planets.forEach(([name,diameter,dist,color,size],i)=>{
      const px=mix(mix(start,end,(i+1)/8),start+(end-start)*dist/4495.1,progress);
      const pr=mix(unit*size,(end-start)*diameter/(2*4495100000),progress);
      if(pr>.85)planetDisc(c,px,y,pr,color,i);
      if(progress>.65)dot(c,px,y,1.55,color);
      if(progress<.5)text(c,w<540?name.slice(0,2):name,px,y+43+(i%2)*17,color,'center',w<540?10:12);
    });
    if(progress>.65){
      const labelFractions=[.09,.26,.43,.63,.81,.93];
      for(const [j,i] of [2,3,4,5,6,7].entries()){
        const [name,,dist,color]=planets[i],px=start+(end-start)*dist/4495.1,tx=w*labelFractions[j],ty=y+(j%2?61:45);
        line(c,[[px,y+4],[tx,ty-13]],'#8398b165');
        text(c,w<480?name.slice(0,3):name,tx,ty,color);
      }
    }
  }
  function update(){
    cancelAnimationFrame(frame);
    const choice=model[select.value], target=choice?1:0,start=progress,begin=performance.now();
    q('[data-scale-note]').innerHTML=choice?`<p class="scale-sun"><span aria-hidden="true">${choice.icon}</span> <strong>The Sun is a ${choice.diameter/10} cm ${choice.label}.</strong> At this full-system scale, even the Sun is smaller than a screen pixel. The symbols mark positions. The object icon is enlarged.</p>`:'<p><strong>Illustration.</strong> Planet sizes and spacing are exaggerated.</p>';
    q('[data-planets]').innerHTML=choice?planets.map(([name,diameter,dist,, ,object],i)=>{
      const mm=diameter*choice.diameter/sunKm;
      const km=dist*choice.diameter/sunKm;
      const comparison=choice.label==='orange'?object:['a small grain of sand','a sesame seed','a sesame seed','a grain of coarse salt','a large marble','a small marble','a pea','a pea'][i];
      return `<details open><summary>${name}</summary><p>About the size of ${comparison} (<strong>${format.format(mm)} mm</strong>).<br><strong>${format.format(km)} km / ${format.format(km*.621371)} mi</strong> from the Sun.</p></details>`;
    }).join(''):'';
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){progress=target;draw();return}
    function animate(now){
      const f=Math.min(1,(now-begin)/620);progress=mix(start,target,f*f*(3-2*f));draw();
      if(f<1)frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
  }
  select.onchange=update;q('[data-reset]').onclick=()=>{select.value='';update()};
  const stop=observe(canvas,draw);update();
  return ()=>{cancelAnimationFrame(frame);stop()};
}

const zoomStops=[
  ['Milan','10 km','Start in Milan, in northern Italy. The city and its surroundings are shown schematically.'],
  ['Earth','12,742 km across','The blue planet is our first full view. Milan is marked on the globe.'],
  ['Earth and Moon','384,400 km on average','The Moon is about 30 Earth diameters away. Their sizes are enlarged here.'],
  ['Sun and rocky planets','228 million km to Mars','Mercury, Venus, Earth, and Mars orbit within the main asteroid belt.'],
  ['Solar System','4.50 billion km to Neptune','Beyond the rocky planets are two gas giants and two ice giants. Icy bodies extend far beyond Neptune.'],
  ['The Orion Spur','Thousands of light-years','The Sun is in the Local Arm, also called the Orion Spur, between two larger spiral arms. This is a small part of our galaxy.'],
  ['The Milky Way','About 100,000 light-years across','Our Solar System orbits the galactic center far from Sagittarius A*, the supermassive black hole at the center. The face-on view is a reconstruction.'],
  ['Nearby satellite galaxies','About 160,000–200,000 light-years away','The Large and Small Magellanic Clouds are two nearby, conspicuous satellite galaxies of the Milky Way. Several much fainter dwarf galaxies are closer.'],
  ['The Local Group','About 10 million light-years across','Our galaxy shares this group with Andromeda, Triangulum, and dozens of smaller galaxies. It lies in a larger network of groups, clusters, and filaments.'],
  ['Ground-based deep view','Billions of light-years','A 10.4-meter ground-based telescope such as Gran Telescopio Canarias can detect very faint distant galaxies in a small patch of sky. The Milky Way is the foreground home of the observer. This panel is a schematic, and telescope sensitivity depends on the target and exposure.'],
  ['The observable universe','About 92 billion light-years across','This is the region from which light or other signals could have reached us. Even our strongest optical telescopes cannot see all of it in visible light. The Milky Way is shown as a size comparison.'],
  ['The entire universe','Total size unknown','The universe may extend much farther than the observable part and could be infinite. The marked Milky Way is a size reference. Its position and the edge of this drawing carry no information about the whole universe.']
];

function spiral(c,x,y,r,phase=0,count=310){
  for(let i=0;i<count;i++){
    const f=random(i+20),d=r*(.09+.91*f),a=phase+f*4.5+(i%4)*tau/4+(random(i+91)-.5)*.7;
    dot(c,x+Math.cos(a)*d,y+Math.sin(a)*d*.72,.4+random(i+7)*1.45,i%6===0?'#eec38f':'#b1caff99');
  }
  dot(c,x,y,r*.075,'#ffe0a7');
}
function haze(c,x,y,r,color='#a8b8dc',squash=.55){
  c.save();c.translate(x,y);c.scale(1,squash);
  const g=c.createRadialGradient(0,0,0,0,0,r);
  g.addColorStop(0,color);g.addColorStop(.35,color+'74');g.addColorStop(1,color+'00');
  dot(c,0,0,r,g);c.restore();
}

export function mountCosmicZoom(root){
  root.innerHTML=`<article class="lab-card explorer"><h2>From Milan to the universe</h2>
    <div class="lab-actions"><button type="button" data-in>Zoom in</button><button type="button" data-out>Zoom out</button><label>Jump to <select>${zoomStops.map(([name],i)=>`<option value="${i}">${name}</option>`).join('')}</select></label></div>
    <canvas aria-label="Illustrated zoom through astronomical scales"></canvas>
    <div class="explore-caption" aria-live="polite"><h3></h3><strong></strong><p></p></div>
    <p>Each stop resets the scale. Labels and small objects are enlarged to stay readable.</p></article>`;
  const q=s=>root.querySelector(s),canvas=q('canvas'),select=q('select');
  let index=0,frame=0,progress=1,closed=false;
  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,x=w/2,y=h*.49,r=Math.min(w,h)*.36;
    space(c,w,h);
    c.save();c.translate(x,y);c.scale(mix(.86,1,progress),mix(.86,1,progress));c.translate(-x,-y);
    const label=(s,px,py,color)=>text(c,s,px,py,color);
    if(index===0){
      c.fillStyle='#172c35';c.fillRect(0,0,w,h);
      for(let i=0;i<270;i++){
        const px=random(i)*w,py=random(i+51)*h;
        c.fillStyle=i%6===0?'#36564e':'#4b646770';c.fillRect(px,py,4+random(i+11)*19,3+random(i+33)*9);
      }
      for(let i=-5;i<=5;i++){
        line(c,[[x+i*r*.45,0],[x+i*r*.37-35,h]],'#81958176',2);
        line(c,[[0,y+i*r*.36],[w,y+i*r*.32+30]],'#81958176',2);
      }
      line(c,Array.from({length:81},(_,i)=>[i*w/80,y-14+Math.sin(i*.13)*h*.20]),'#4f98b1',4);
      dot(c,x,y,7,gold);label('Milan',x,y-15,gold);
      label('Schematic city view',x,h-18);
    }else if(index===1){
      atlasGlobe(c,x,y,r,'earth');
      dot(c,x,y,5,gold);label('Milan',x,y-13,gold);
    }else if(index===2){
      const ex=x-w*.26,mx=x+w*.26;
      line(c,[[ex,y],[mx,y]],'#8297b3');
      atlasGlobe(c,ex,y,r*.66,'earth');atlasGlobe(c,mx,y,r*.18,'moon');
      label('Earth',ex,y+r*.66+18);label('Moon',mx,y+r*.18+18);
    }else if(index===3||index===4){
      const count=index===3?4:8, start=w*.075;
      dot(c,start,y,r*.18,'#ffcc76');label('Sun',start,y-34,gold);
      planets.slice(0,count).forEach(([name,,,color,size],i)=>{
        const px=w*(.075+.85*(i+1)/count),rr=Math.min(r*.08,w*.018)*size;
        planetDisc(c,px,y,rr,color,i);label(w<500&&count===8?name.slice(0,2):name,px,y+36+16*(i%2),color);
      });
    }else if(index===5||index===6){
      if(index===5){
        for(let i=0;i<400;i++){
          const f=random(i),px=w*f,py=y+(i%3-1)*h*.21+Math.sin(f*3.6)*h*.13+(random(i+308)-.5)*h*.14;
          dot(c,px,py,.5+random(i+9),i%3===1?'#8fc8ff':'#adb8d67a');
        }
        dot(c,x,y+h*.10,5,gold);label('Sun · Orion Spur',x,y+h*.10-14,gold);
      }else{
        spiral(c,x,y,r*1.12,.8,600);
        dot(c,x,y,3,'#0a0e1a');label('Sagittarius A*',x,y+19,gold);
        dot(c,x+r*.64,y-r*.11,4,blue);label('Solar System',x+r*.64,y-r*.11-12,blue);
      }
    }else if(index===7||index===8){
      spiral(c,w*.36,h*.48,r*.72,.8,260);label('Milky Way',w*.36,h*.48+r*.72);
      const companions=index===7?[['Large Magellanic Cloud',.75,.31],['Small Magellanic Cloud',.73,.66]]:[['Andromeda',.72,.32],['Triangulum',.73,.66]];
      for(const [name,fx,fy] of companions){
        haze(c,w*fx,h*fy,r*.27,'#a8c4e7');label(name,w*fx,h*fy+26,blue);
      }
      if(index===8)for(let i=0;i<19;i++)haze(c,w*random(i+110),h*(.1+.8*random(i+55)),3+5*random(i+81));
    }else if(index===9){
      for(let i=0;i<85;i++)haze(c,w*random(i+318),h*random(i+22),2+8*random(i+88),i%3?'#a6bce4':'#e4a078',.4+random(i+47)*.6);
      label('Distant galaxies in a small patch of sky',x,25);
      label('Milky Way · our foreground galaxy',x,h-18,blue);
    }else{
      c.save();
      if(index===10){c.beginPath();c.arc(x,y,r*1.13,0,tau);c.clip()}
      for(let i=0;i<1100;i++){
        const fx=random(i),track=i%7;
        const py=h*(.09+track*.13+.10*Math.sin(fx*10+track)+(random(i+482)-.5)*.09);
        dot(c,fx*w,py,.45+random(i+490),index===11&&i%4?'#a4b6e27a':'#b1caff97');
      }
      c.restore();
      if(index===10){c.beginPath();c.arc(x,y,r*1.13,0,tau);c.strokeStyle=blue;c.stroke()}
      const markX=w*.30,markY=h*.73;dot(c,markX,markY,1.5,gold);
      line(c,[[markX+36,markY-20],[markX,markY],[markX+4,markY-7]],gold);
      label('Milky Way · size reference',w*.56,markY-26,gold);
      label(index===10?'Observable horizon':'Extent unknown',x,25);
    }
    c.restore();
  }
  function show(){
    const [name,scale,note]=zoomStops[index];
    q('h3').textContent=name;q('.explore-caption strong').textContent=scale;q('.explore-caption p').textContent=note;
    q('[data-in]').disabled=index===0;q('[data-out]').disabled=index===zoomStops.length-1;select.value=index;
    cancelAnimationFrame(frame);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){progress=1;draw();return}
    const start=performance.now();
    function animate(now){progress=Math.min(1,(now-start)/240);draw();if(progress<1)frame=requestAnimationFrame(animate)}
    frame=requestAnimationFrame(animate);
  }
  const stop=observe(canvas,draw);
  void loadTextures().then(()=>{if(!closed)draw()});
  q('[data-in]').onclick=()=>{index--;show()};
  q('[data-out]').onclick=()=>{index++;show()};
  select.onchange=()=>{index=+select.value;show()};
  show();
  return ()=>{closed=true;cancelAnimationFrame(frame);stop()};
}

const locations=[
  ['Milan, Italy',45.4642,9.19,'Europe/Rome'],
  ['Denver, Colorado',39.7392,-104.9903,'America/Denver'],
  ['Johannesburg, South Africa',-26.2041,28.0473,'Africa/Johannesburg']
];
const planetColors=Object.fromEntries(planets.map(([name,,,color])=>[name,color]));

function localObservation(year,month,clock,zone){
  const [hour,minute]=clock.split(':').map(Number);
  const expected=Date.UTC(year,month-1,15,hour,minute);
  const local=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'});
  let utc=expected;
  for(let i=0;i<3;i++){
    const fields=Object.fromEntries(local.formatToParts(utc).map(({type,value})=>[type,Number(value)]));
    utc+=expected-Date.UTC(fields.year,fields.month-1,fields.day,fields.hour,fields.minute);
  }
  return {date:new Date(utc).toISOString(),label:new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeStyle:'short',timeZone:zone}).format(utc)};
}

export function mountMiniStellarium(root,api){
  const options=values=>values.map((value,i)=>`<option value="${i}">${value}</option>`).join('');
  root.innerHTML=`<article class="lab-card explorer"><h2>Mini Stellarium</h2>
    <p>Explore a representative night in each local season. The rim is your horizon and the center is the zenith, directly overhead.</p>
    <div class="lab-actions">
      <label>Observing site <select data-location>${options(locations.map(([name])=>name))}</select></label>
      <label>Season <select data-season>${options(['Spring sky','Summer sky','Autumn sky','Winter sky'])}</select></label>
      <label>Local time <select data-clock><option value="00:00">Midnight</option><option value="04:30">4:30 a.m.</option></select></label>
    </div>
    <p data-sky-date role="status"></p>
    <canvas aria-label="All-sky map with cardinal directions, zenith, selected constellations, planets, and deep-sky objects"></canvas>
    <p class="explorer-key"><span class="key-ecliptic">– – Ecliptic</span> <span class="key-planets">● Planets and Moon</span> <span class="key-deep">◇ Deep-sky targets</span></p>
    <p>The dashed ecliptic marks the Sun’s yearly path against the stars. The Moon and planets stay near it. This map uses a selected catalog and plots objects above the horizon. Whether you can see them depends on twilight, moonlight, light pollution, and your equipment.</p>
    <div class="sky-targets" data-sky-objects></div>
  </article>`;
  const q=s=>root.querySelector(s),canvas=q('canvas');
  const year=new Date().getFullYear();
  let sky=null,revision=0,closed=false,target='';
  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,x=w/2,y=h/2,r=Math.max(1,Math.min(w,h)/2-24);
    space(c,w,h,0);
    const map=(az,alt)=>{
      const angle=az*Math.PI/180,rr=r*(1-alt/90);
      return [x+rr*Math.sin(angle),y-rr*Math.cos(angle)];
    };
    c.beginPath();c.arc(x,y,r,0,tau);c.fillStyle='#0a162b';c.fill();
    for(const alt of [0,30,60]){
      c.beginPath();c.arc(x,y,r*(1-alt/90),0,tau);c.strokeStyle=alt===0?'#778fad':'#304960';c.lineWidth=1;c.stroke();
    }
    for(const [label,az] of [['N',0],['E',90],['S',180],['W',270]]){
      const [px,py]=map(az,-3.25);
      text(c,label,px,py+4,'#e6efff');
    }
    dot(c,x,y,3.1,blue);text(c,'Zenith',x,y-9,blue);
    if(!sky)return;
    c.save();c.beginPath();c.arc(x,y,r,0,tau);c.clip();
    c.setLineDash([5,5]);line(c,sky.ecliptic.map(([az,alt])=>map(az,alt)),gold,1.3);c.setLineDash([]);
    const labels=[];
    for(const [name,fig] of sky.figures){
      line(c,fig.map(([,az,alt])=>map(az,alt)),'#587ca3',1.2);
      const above=fig.filter(([, ,alt])=>alt>3);
      if(above.length>=2){const [px,py]=map(above[0][1],above[0][2]);labels.push([name,px,py+19,blue])}
      for(const [n,az,alt] of above){
        const [px,py]=map(az,alt);dot(c,px,py,1.7,'#d7e8ff');
        if(['Betelgeuse','Rigel','Antares','Canopus','Deneb','Aldebaran','Pollux','Regulus','Acrux'].includes(n))labels.push([n,px,py-9,'#e0edff']);
      }
    }
    for(const [name,az,alt] of sky.stars){
      if(alt<=0)continue;
      const [px,py]=map(az,alt);dot(c,px,py,2.25,'#e7efff');labels.push([name,px,py-9,'#e0edff']);
    }
    for(const [name,kind,az,alt] of sky.deep){
      if(alt<=0)continue;
      const [px,py]=map(az,alt);
      line(c,[[px,py-4],[px+4,py],[px,py+4],[px-4,py],[px,py-4]],'#a4e3d2',1.5);
      labels.unshift([name.split(' · ')[0],px,py-9,'#a4e3d2']);
      if(target===name){c.beginPath();c.arc(px,py,11,0,tau);c.strokeStyle='#a4e3d2';c.stroke()}
    }
    for(const [name,az,alt] of [['Moon',...sky.moon],...sky.planets]){
      if(alt<=0)continue;
      const [px,py]=map(az,alt),color=planetColors[name]??'#f8e8cd';
      dot(c,px,py,name==='Moon'?4:3.3,color);labels.unshift([name,px,py-10,gold]);
    }
    const placed=[[x-23,y-22,x+23,y+6]];
    for(const [name,px,py,color] of labels){
      c.font='600 11px system-ui';
      const width=c.measureText(name).width,rect=[px-width/2-2,py-11,px+width/2+2,py+3];
      if(placed.some(([a,b,d,e])=>rect[0]<d&&rect[2]>a&&rect[1]<e&&rect[3]>b))continue;
      if(rect[0]<x-r||rect[2]>x+r||Math.hypot(Math.max(Math.abs(rect[0]-x),Math.abs(rect[2]-x)),Math.max(Math.abs(rect[1]-y),Math.abs(rect[3]-y)))>r)continue;
      text(c,name,px,py,color,'center',11);placed.push(rect);
    }
    c.restore();
  }
  async function refresh(){
    const token=++revision,[name,lat,lon,zone]=locations[+q('[data-location]').value];
    const month=(lat<0?[10,1,4,7]:[4,7,10,1])[+q('[data-season]').value];
    const {date,label}=localObservation(year,month,q('[data-clock]').value,zone);
    q('[data-sky-date]').textContent='Calculating the sky over '+name+'…';
    q('[data-sky-objects]').innerHTML='';target='';sky=null;draw();
    try{
      const result=await api('mini_stellarium',[date,lat,lon]);
      if(closed||token!==revision)return;
      sky=result;
      const twilight=result.sun>-18?' · Twilight may wash out faint targets.':'';
      q('[data-sky-date]').textContent=name+' · '+label+' local time'+twilight;
      const above=result.deep.filter(([, , ,alt])=>alt>0).sort((a,b)=>b[3]-a[3]);
      const visible=[['Moon',...result.moon],...result.planets].filter(([, ,alt])=>alt>0);
      q('[data-sky-objects]').innerHTML=`<section><h3>Planets and Moon above the horizon</h3><p>${visible.map(([n,,alt])=>n+' '+Math.round(alt)+'°').join(' · ')||'None at this time.'}</p>
        <h3>Deep-sky targets</h3><div class="lab-actions">${above.map(([n,kind,,alt])=>`<button type="button" data-object="${n}" aria-pressed="false">${n} · ${kind} · ${Math.round(alt)}°</button>`).join('')||'No catalog targets at this time.'}</div></section>`;
      draw();
    }catch(error){if(!closed&&token===revision)q('[data-sky-date]').textContent='The sky map could not be calculated.'}
  }
  for(const select of root.querySelectorAll('select'))select.onchange=refresh;
  q('[data-sky-objects]').onclick=event=>{
    const pressed=event.target.closest('[data-object]');if(!pressed)return;
    target=pressed.dataset.object;
    for(const button of q('[data-sky-objects]').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button===pressed));
    draw();
  };
  const stop=observe(canvas,draw);void refresh();
  return ()=>{closed=true;stop()};
}
