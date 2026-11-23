import {canvasContext} from './scene.js';
export {mountCosmicZoom} from './cosmic-zoom.js';

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
function saturnRings(c,x,y,r,front){
  const arcs=[[1.28,1.53,'#ad8f68'],[1.53,1.79,'#ebd3a8'],[1.82,1.88,'#796a5b'],[1.9,2.09,'#cbb491'],[2.09,2.16,'#f4daba']];
  c.save();c.translate(x,y);c.rotate(-.36);c.scale(1,.41);
  for(const [inner,outer,color] of arcs){
    c.beginPath();c.arc(0,0,r*(inner+outer)/2,front?0:Math.PI,front?Math.PI:tau);
    c.strokeStyle=color;c.lineWidth=r*(outer-inner);c.stroke();
  }
  c.restore();
}

function planetDisc(c,x,y,r,color,i){
  if(i===5)saturnRings(c,x,y,r,false);
  const banded=i===4||i===5;
  const g=c.createRadialGradient(x-r*.31,y-r*.35,0,x,y,r);
  g.addColorStop(0,'#fff6de');g.addColorStop(.49,color);g.addColorStop(1,banded?'#876849':'#142034');
  dot(c,x,y,r,g);
  c.save();c.beginPath();c.arc(x,y,r,0,tau);c.clip();
  if(i===2){
    for(const [dx,dy,rx,ry] of [[-.32,-.26,.41,.27],[.24,.12,.28,.43],[.52,-.29,.27,.19]]){
      c.fillStyle='#5e8e68';c.beginPath();c.ellipse(x+r*dx,y+r*dy,r*rx,r*ry,.6,0,tau);c.fill();
    }
  }
  if(banded){
    c.translate(x,y);c.rotate(i===5?-.36:-.10);
    const belts=i===4
      ? [[-.8,.10,'#9b7765'],[-.58,.18,'#c29379'],[-.36,.17,'#965e4c'],[-.19,.09,'#f9dfb3'],[.06,.15,'#b8765a'],[.31,.12,'#ac6d56'],[.52,.14,'#ecd0aa'],[.72,.12,'#9d7767']]
      : [[-.72,.13,'#c7a875'],[-.44,.13,'#f6dfa3'],[-.20,.10,'#b89362'],[.11,.13,'#d6b483'],[.40,.14,'#eee0b0'],[.68,.12,'#ad8e66']];
    for(const [center,width,tone] of belts){
      c.beginPath();c.moveTo(-r,center*r);
      c.bezierCurveTo(-r*.55,(center+.11)*r,r*.56,(center+.11)*r,r,center*r);
      c.bezierCurveTo(r*.52,(center+.13+width)*r,-r*.57,(center+.13+width)*r,-r,(center+width)*r);
      c.closePath();c.globalAlpha=i===4?.86:.56;c.fillStyle=tone;c.fill();
    }
    c.globalAlpha=1;
    if(i===4){
      for(const [rx,ry,tone] of [[.235,.122,'#f2cf9d'],[.193,.092,'#b85d47'],[.125,.060,'#db9271']]){
        c.beginPath();c.ellipse(r*.31,r*.39,r*rx,r*ry,-.07,0,tau);c.fillStyle=tone;c.fill();
      }
    }
    const shade=c.createRadialGradient(-r*.31,-r*.37,r*.23,0,0,r*1.08);
    shade.addColorStop(0,'#fff5db24');shade.addColorStop(.57,'#252a3200');shade.addColorStop(1,'#091421b8');
    dot(c,0,0,r,shade);
  }
  c.restore();
  if(i===5)saturnRings(c,x,y,r,true);
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
    const {ctx:c,w,h}=env,y=h*.5,unit=Math.min(15,w*.0175),start=w*.07,end=w*.935;
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
      const meters=dist*choice.diameter*1000/sunKm;
      const yards=meters/.9144;
      const comparison=choice.label==='orange'?object:['a small grain of sand','a sesame seed','a sesame seed','a grain of coarse salt','a large marble','a small marble','a pea','a pea'][i];
      return `<details open><summary>${name}</summary><p>About the size of ${comparison} (<strong>${format.format(mm)} mm</strong>).<br><strong>${format.format(meters)} m / ${format.format(yards)} yd</strong> from the Sun.</p></details>`;
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
