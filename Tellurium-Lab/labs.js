import {mountAstrology} from './astrology.js';
import {mountPlanets} from './planets.js';
import {mountBlackHole} from './black-hole.js';
import {mountBirth} from './birth.js';
import {canvasContext} from './scene.js';

const ink='#e4efff', muted='#9eb2ce', cyan='#88bbff', gold='#ffcb8c', grid='#2a3a56';
const $=(root,id)=>root.querySelector('#'+id);
const card=(title,body)=>'<article class="lab-card"><h2>'+title+'</h2>'+body+'</article>';
const canvas=(id,desc,tall=false)=>'<canvas id="'+id+'" aria-label="'+desc+'"'+(tall?' class="tall"':'')+'></canvas>';
const out=id=>'<output class="lab-readout" id="'+id+'"></output>';
const slider=(id,label,min,max,value,step=1)=>'<label for="'+id+'">'+label+'</label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'">';
const select=(id,label,options)=>'<label>'+label+' <select id="'+id+'">'+options.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')+'</select></label>';
function line(c,a,b,color=grid,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
}
function path(c,points,color,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function dot(c,x,y,r,color){
  c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
}
function text(c,s,x,y,color=ink,align='center'){
  c.font='600 12px system-ui';c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);
}
function background(c,w,h,top='#14223a',bottom='#080d18'){
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);
  c.fillStyle=g;c.fillRect(0,0,w,h);
}
function shot(c,x,y,r,white=false){
  const g=c.createRadialGradient(x,y,r*.6,x,y,r*4);
  g.addColorStop(0,white?'#f4faff80':'#ffcc7a80');g.addColorStop(1,'#ffcc7a00');
  dot(c,x,y,r*4,g);dot(c,x,y,r,white?'#fff':'#ffdd9e');
}
const waveColor=nm=>{
  const stops=[[380,[153,97,255]],[440,[81,133,255]],[490,[74,221,255]],[540,[103,239,151]],[585,[255,233,113]],[625,[255,133,69]],[700,[255,63,65]]];
  const i=Math.max(0,stops.findIndex(([x])=>x>=nm)-1);
  if(nm>=700)return '#ff3f41';
  const [a,ca]=stops[i],[b,cb]=stops[i+1];
  const f=Math.max(0,(nm-a)/(b-a));
  return 'rgb('+ca.map((k,j)=>Math.round(k+(cb[j]-k)*f)).join(',')+')';
};
function attach(root,draw){
  const observer=new ResizeObserver(draw);
  root.querySelectorAll('canvas').forEach(c=>observer.observe(c));
  root.addEventListener('input',draw);
  draw();
  return ()=>{observer.disconnect();root.removeEventListener('input',draw);};
}
function clock(button,step){
  let timer;
  button.onclick=()=>{
    if(timer){clearInterval(timer);timer=null;button.textContent='Play';}
    else{timer=setInterval(step,85);button.textContent='Pause';}
  };
  return ()=>{if(timer)clearInterval(timer);};
}

function analemma(root,api,initialYear){
  root.innerHTML=card('The Sun’s figure eight',
    '<p>Take one picture every day from the same spot at the same local mean solar time. The Sun moves up and down as its declination changes, and east and west because apparent solar time runs ahead of or behind mean solar time.</p>'+
    '<div class="lab-actions">'+select('site','Location', [['45.4642,9.1900','Milan · 45.46° N'],['55.9533,-3.1883','Edinburgh · 55.95° N'],['0,-78.4558','Mitad del Mundo, Ecuador · 0°'],['-33.8688,151.2093','Sydney · 33.87° S'],['-90,0','South Pole · 90° S']])+
    '<label>Year <input id="year" type="number" min="1900" max="2100" value="'+initialYear+'"></label><button id="go">Play</button></div>'+
    out('read')+canvas('skyview','Sun positions at mean solar noon, with a whole-sky view at the equator and South Pole',true)+
    slider('day','Day of year',0,365,0)+
    '<details><summary>Why the two lobes differ</summary><p>Earth’s axial tilt changes the Sun’s declination and contributes to the equation of time. Earth’s eccentric orbit contributes too, because its orbital speed varies. Local mean noon would only match apparent solar noon when their difference is zero.</p></details>');
  let data=[], active=true, generation=0;
  const draw=()=>{
    const env=canvasContext($(root,'skyview'));if(!env)return;
    const {ctx:c,w,h}=env, lat=+$(root,'site').value.split(',')[0], south=lat>0;
    const d=data[+$(root,'day').value];
    if(d)$(root,'read').textContent=d[0]+' · mean solar noon · '+d[2].toFixed(1)+'° altitude'+
      (lat===-90?' · reference meridian 0°':' · '+d[1].toFixed(1)+'° azimuth');
    if(lat===0||lat===-90){
      background(c,w,h);
      const r=Math.min(w,h)*(lat===-90?.25:.31), cx=w*.5, cy=h*.44;
      const scale=r/90, project=([,az,alt])=>{
        const a=az*Math.PI/180, d=(90-alt)*scale;
        return [cx+d*Math.sin(a),cy-d*Math.cos(a)];
      };
      for(const altitude of [0,30,60]){
        const rr=(90-altitude)*scale;c.beginPath();c.arc(cx,cy,rr,0,2*Math.PI);
        c.strokeStyle=muted;c.stroke();text(c,altitude+'°',cx+rr-12,cy-5,muted);
      }
      text(c,'Zenith',cx,cy-10);
      if(lat===0){text(c,'N',cx,cy-r-10);text(c,'E',cx+r+15,cy);text(c,'S',cx,cy+r+17);text(c,'W',cx-r-15,cy);}
      for(let i=1;i<data.length;i++){
        const above=data[i][2]>=0;
        if(above=== (data[i-1][2]>=0))line(c,project(data[i-1]),project(data[i]),above?gold:'#8aa0c46b',1.5);
      }
      if(d){const [x,y]=project(d);if(d[2]>=0)shot(c,x,y,6,true);else dot(c,x,y,4,muted);}
      text(c,lat===-90?'South Pole · muted trace is below the horizon':'Equator · north and south of the zenith',cx,h-12);
      return;
    }
    background(c,w,h,'#264675','#a27862');
    const horizon=h*.89;
    const landscape=Array.from({length:41},(_,i)=>[w*i/40,horizon-(.5+Math.sin(i*.39)*.28+Math.cos(i*.83)*.15)*h*.052]);
    c.fillStyle='#182638';c.beginPath();c.moveTo(0,h);landscape.forEach(p=>c.lineTo(...p));c.lineTo(w,h);c.fill();
    line(c,[0,horizon],[w,horizon],'#c8a38e7a');
    text(c,south?'SE                      S                      SW':'NW                      N                      NE',w/2,h*.97);
    if(!data.length)return;
    const center=south?180:0;
    const delta=az=>(az-center+540)%360-180;
    const width=Math.max(1,...data.map(d=>Math.abs(delta(d[1]))));
    const horizontalScale=Math.min(h*.024,w*.42/width);
    const x=az=>w/2+delta(az)*horizontalScale;
    const y=alt=>horizon-alt*h*.0094;
    text(c,'Azimuth magnified '+(horizontalScale/(h*.0094)).toFixed(1)+'×',w-12,21,'#e8effc','right');
    for(const a of [20,40,60,80]){
      line(c,[0,y(a)],[w,y(a)],'#eeefff22');text(c,a+'°',23,y(a)-4,'#dce8fb');
    }
    path(c,data.map(d=>[x(d[1]),y(d[2])]),'#ffe4ac9c',1.5);
    for(let j=0;j<data.length;j+=7)dot(c,x(data[j][1]),y(data[j][2]),2.6,'#fce1aaac');
    if(d)shot(c,x(d[1]),y(d[2]),8,true);
  };
  const detach=attach(root,draw);
  const play=clock($(root,'go'),()=>{
    if(!data.length)return;
    const input=$(root,'day');input.value=(+input.value+3)%data.length;draw();
  });
  async function load(){
    const yearInput=$(root,'year');if(!yearInput.checkValidity()||!yearInput.value)return;
    const n=++generation;
    const [lat,lon]=$(root,'site').value.split(',').map(Number);
    $(root,'read').textContent='Calculating the year…';
    try{
      const days=await api('analemma',[+yearInput.value,lat,lon]);
      if(!active||n!==generation)return;
      data=days;$(root,'day').max=data.length-1;draw();
    }catch(error){
      if(active&&n===generation)$(root,'read').textContent='The solar ephemeris is unavailable. Reopen this tab to retry.';
    }
  }
  $(root,'year').onchange=$(root,'site').onchange=load;
  void load();
  return ()=>{active=false;play();detach();};
}

function skyLab(root){
  root.innerHTML='<div class="lab-stack">'+card('Why is the sky blue?',
    '<p>Scattering means light leaves its original direction. A passing light wave makes electric charges in an air molecule wiggle. The molecule sends a little light out in new directions. Shorter waves do this more effectively. Blue is more likely to be redirected because the molecule responds more strongly to its higher frequency.</p>'+
    slider('wave','Follow one wavelength',400,700,450)+out('scatter')+
    canvas('rays','One beam of sunlight, a molecule, and scattered rays reaching an eye')+
    canvas('wave-size','Blue and red wavelengths on the same scale compared with a nitrogen molecule')+
    '<p>A nitrogen molecule is roughly 0.3 nm across. Blue light at 450 nm has a wavelength about 1,500 times longer. Red at 650 nm is about 2,200 times longer. Under Rayleigh scattering the blue example is redirected about 4.4 times as strongly as the red example.</p>'+
    '<details><summary>Compare with diffraction</summary><p>A diffraction grating has regularly spaced grooves. Waves from the grooves reinforce each other at particular angles. In the first order, red bends through a larger angle than blue. Air molecules scatter light without this regular pattern.</p>'+
    canvas('grating','A diffraction grating separates blue, green and red into different angles')+'</details>'+
    '<details><summary>Why blue rather than violet?</summary><p>Violet scatters even more strongly. The color we see is the sum of the spectrum and the response of our eyes, which are much less sensitive to violet.</p></details>')+
    card('Why is sunset light warmer?',
    '<p>A low Sun shines through more air. Much of the blue is scattered out of the direct beam before it reaches us, leaving more red and orange. Haze and clouds can soften shadows by adding diffuse light. A low Sun also produces longer shadows.</p>'+
    slider('alt','Sun’s height above the horizon',3,90,10)+out('air')+canvas('sunset','The direct spectrum after a shorter or longer path through the atmosphere'))+
    card('What color is the Sun from space?',
    '<p><strong>White to human eyes.</strong> The Sun emits across the visible spectrum. Those wavelengths combine to make nearly white light outside the atmosphere. Through air its direct light can look warmer, especially at low elevation. A white disk represents the combined light.</p>'+
    slider('rocket-alt','Rocket altitude (km)',0,150,0)+out('rocket-read')+canvas('rocket','Rocket climbing from its launch gantry beside a view of the Sun')+
    '<p>The color change is exaggerated. Even at ground level, a high Sun can look nearly white. The 100 km line marks a convention. The atmosphere thins gradually, so the white disk emerges gradually too.</p>')+card('How a rainbow follows you',
    '<p>With the Sun behind you, some sunlight bends as it enters a drop, reflects once off the back, and bends again as it leaves. Water bends violet more than red. The brightest rays reach your eye about 40° (violet) to 42° (red) from the direction opposite the Sun.</p>'+
    '<div class="lab-rows">'+canvas('drop','Refraction, one internal reflection, and dispersion in a raindrop')+canvas('bow','Rainbow circle centered on the direction opposite the Sun')+'</div>'+
    slider('bow-view','Raise the viewpoint above the ground (illustrative)',0,100,0)+out('bow-note')+
    '<p>Every point on the bow comes from a different drop at the right angle to your eye. Together those sight lines form a cone, whose opening looks like a circle. Ground and the horizon often hide the lower part. Drive forward and your cone moves with you, selecting other drops. The bow has a direction but no fixed location you can reach.</p>')+'</div>';
  return attach(root,()=>{
    drawRainbow(root);
    const wave=+$(root,'wave').value, strength=(550/wave)**4;
    $(root,'scatter').textContent=wave+' nm · '+strength.toFixed(2)+'× the scattering at 550 nm';
    const env=canvasContext($(root,'rays'));
    if(env){
      const {ctx:c,w,h}=env;
      background(c,w,h,'#091224','#173a69');
      c.fillStyle='#79b5ff20';c.fillRect(0,h*.21,w,h*.69);
      const start=[w*.18,h*.12], atom=[w*.47,h*.45], eye=[w*.76,h*.82];
      shot(c,...start,8,true);
      text(c,'Sunlight',start[0],start[1]+25);
      line(c,start,atom,'#fff4d6',4);
      line(c,atom,[w*.80,h*.69],'#fff4d684',2.5);
      line(c,[0,h*.23],[w,h*.23],'#a7caff88');
      text(c,'Air',w*.87,h*.20,cyan);
      const col=waveColor(wave);
      for(const angle of [-1.6,-.92,-.28,2.52,3.2,4.02]){
        const len=Math.min(w,h)*.16;
        line(c,atom,[atom[0]+len*Math.cos(angle),atom[1]+len*Math.sin(angle)],col,Math.min(4,.7+strength));
      }
      line(c,atom,eye,col,Math.min(6,1+strength*1.45));
      dot(c,...atom,7,ink);text(c,'Air molecule',atom[0],atom[1]-13);
      c.strokeStyle=ink;c.beginPath();c.ellipse(...eye,12,6,0,0,2*Math.PI);c.stroke();
      dot(c,...eye,3,col);text(c,'Observer looking at sky',eye[0]-6,eye[1]+24);
    }
    const sizes=canvasContext($(root,'wave-size'));
    if(sizes){
      const {ctx:c,w,h}=sizes; background(c,w,h);
      const scale=w*.76/650,x=w*.12;
      for(const [nm,y] of [[450,h*.27],[650,h*.58]]){
        path(c,Array.from({length:81},(_,i)=>[x+i*nm*scale/80,y-15*Math.sin(i*Math.PI/40)]),waveColor(nm),2.4);
        line(c,[x,y+23],[x+nm*scale,y+23],muted);
        text(c,nm+' nm · one wavelength',x+nm*scale/2,y+42);
      }
      dot(c,x,h*.91,2.5,ink);
      text(c,'N₂ ≈ 0.3 nm · dot enlarged to be visible',x+9,h*.91+4,ink,'left');
    }
    const grating=canvasContext($(root,'grating'));
    if(grating){
      const {ctx:c,w,h}=grating,x=w*.37,y=h*.70;
      background(c,w,h);
      line(c,[w*.08,y],[x,y],ink,3);
      line(c,[x,h*.16],[x,h*.85],muted,2);
      for(let i=0;i<9;i++)dot(c,x,h*(.21+i*.072),2,cyan);
      for(const nm of [450,550,650]){
        const theta=Math.asin(nm/1450), dx=Math.min(w*.43,h*.95);
        const end=[x+dx,y-dx*Math.tan(theta)];
        line(c,[x,y],end,waveColor(nm),2);
        text(c,nm+' nm',end[0]+6,end[1]+4,waveColor(nm),'left');
      }
      text(c,'Grating',x,h*.92,muted);
    }
    const alt=+$(root,'alt').value, air=1/(Math.sin(alt*Math.PI/180)+.50572*(alt+6.07995)**-1.6364);
    $(root,'air').textContent=alt+'° elevation · '+air.toFixed(1)+' air masses (standard-atmosphere estimate)';
    const se=canvasContext($(root,'sunset'));
    if(se){
      const {ctx:c,w,h}=se;background(c,w,h);
      line(c,[w*.08,h*.76],[w*.92,h*.76],muted);
      const x=w*.88,y=h*.73, length=Math.min(w*.74,h*.65/Math.tan(alt*Math.PI/180));
      const start=[x-length,y-length*Math.tan(alt*Math.PI/180)];
      c.fillStyle='#548ee522';c.fillRect(w*.08,h*.54,w*.84,h*.22);
      const warm=Math.min(1,(air-1)/9);
      const warmth='rgb(255,'+Math.round(243-94*warm)+','+Math.round(211-136*warm)+')';
      line(c,start,[x,y],warmth,3);shot(c,...start,7);
      for(const o of [-.08,0,.08])line(c,[x-w*.09+o*w,h*.46],[x,y],'#91c1ff4d',1.4);
      dot(c,x,y,3,ink);
      text(c,'Diffuse sky light',w*.69,h*.43,cyan);
      text(c,'Atmosphere',w*.23,h*.69,cyan);
      c.fillStyle=warmth;c.fillRect(w*.76,h*.11,w*.13,18);
      text(c,'Beam color',w*.82,h*.10,ink);
      const x0=w*.15, sw=w*.70/140;
      for(let i=0;i<140;i++){
        const nm=400+i*2.1;
        c.globalAlpha=Math.exp(-.10*(550/nm)**4*air);
        c.fillStyle=waveColor(nm);c.fillRect(x0+i*sw,h*.85,sw+1,16);
      }
      c.globalAlpha=1;text(c,'Direct light reaching the observer',w*.5,h*.98,muted);
    }
    const km=+$(root,'rocket-alt').value, t=Math.exp(-km/12);
    $(root,'rocket-read').textContent=km+' km · '+(km===0?'slightly warm daylight':km<45?'thinning atmosphere':'nearly unfiltered sunlight');
    const rocket=canvasContext($(root,'rocket'));
    if(rocket){
      const {ctx:c,w,h}=rocket;
      background(c,w,h,'#030813','#416896');
      c.fillStyle='#233747';c.fillRect(0,h*.88,w,h*.12);
      const boundary=h*.78-100/150*h*.55;
      c.setLineDash([4,4]);line(c,[10,boundary],[w-10,boundary],'#bcd4f880');c.setLineDash([]);
      text(c,'100 km · edge of space (conventional)',w-12,boundary-7,muted,'right');
      const x=w*.25,y=h*.78-km/150*h*.55;
      line(c,[x-26,h*.88],[x-26,h*.59],muted,3);
      for(let j=0;j<5;j++)line(c,[x-26,h*(.62+j*.052)],[x-10,h*(.65+j*.052)],muted);
      c.fillStyle='#e8f3ff';c.beginPath();c.moveTo(x,y-30);c.lineTo(x+8,y-16);c.lineTo(x+8,y+22);
      c.lineTo(x-8,y+22);c.lineTo(x-8,y-16);c.closePath();c.fill();
      dot(c,x,y-7,4,'#3975b4');
      if(km>0){line(c,[x,y+22],[x,y+36],gold,4);}
      const sx=w*.72,sy=h*.42,r=Math.min(w*.10,32);
      shot(c,sx,sy,r,true);
      dot(c,sx,sy,r,'rgb(255,'+Math.round(255-16*t)+','+Math.round(255-66*t)+')');
      text(c,'Sun from the rocket',sx,sy+r+24);
    }

  });
}

function drawRainbow(root){
  const height=+$(root,'bow-view').value;
  $(root,'bow-note').textContent=height===0?'Ground view · part of the circle is hidden':height===100?'Elevated view · full circle if drops are present below you':'Elevated view · more of the circle can be visible';
  const drop=canvasContext($(root,'drop'));
  if(drop){
    const {ctx:c,w,h}=drop; background(c,w,h);
    const r=Math.min(w,h)*.25,x=w*.60,y=h*.47;
    const point=a=>[x+r*Math.cos(a),y+r*Math.sin(a)];
    const g=c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);
    g.addColorStop(0,'#5cb7faaa');g.addColorStop(1,'#184273aa');dot(c,x,y,r,g);
    c.strokeStyle=cyan;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.stroke();
    const entry=point(-2.24);
    line(c,[w*.10,h*.18],entry,'#fff1c6',3);
    for(const [i,color] of ['#ff6464','#ffc661','#7de997','#68b3ff','#b298ff'].entries()){
      const back=point(-.02+i*.037), exit=point(1.90+i*.030);
      path(c,[entry,back,exit,[w*.10,h*(.75-i*.023)]],color,1.6);
    }
    text(c,'Sunlight',w*.16,h*.13);
    text(c,'Inside reflection',x,h*.82,ink);
    text(c,'Colors leave at different angles',w*.50,h*.94,ink);
  }
  const sky=canvasContext($(root,'bow'));
  if(sky){
    const {ctx:c,w,h}=sky; background(c,w,h,'#17355f','#334552');
    const x=w/2,y=h*.52,r=Math.min(w*.33,h*.34), horizon=y+r*(-.08+height*.013);
    c.save();c.beginPath();c.rect(0,0,w,horizon);c.clip();
    ['#ba82ef','#7288ff','#69d7ff','#7ae2a2','#f2e981','#ffb871','#ff7676'].forEach((color,i)=>{
      c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(x,y,r+i*2-6,0,Math.PI*2);c.stroke();
    });
    c.restore();
    if(height<100){line(c,[0,horizon],[w,horizon],muted);}
    dot(c,x,y,3,ink);text(c,'Opposite the Sun',x,y-9);
    text(c,'Red outer edge ≈ 42°',x,h-13);
  }
}

const starExamples=[
 ['Sun ☉',5772,0,'#ffe2a5',9,-9],['Proxima Centauri',3050,-2.8,'#ff967b',-7,-10],
 ['Sirius A',9940,1.4,'#b6d9ff',8,-9],['Betelgeuse',3600,5.0,'#ff9a7b',-7,-9],
 ['Sirius B',25000,-1.6,'#d4ecff',8,13]
];
const solarTrack=[
  [0,3500,.65,'Formation in a collapsing cloud'],
  [.05,5600,-.16,'Hydrogen fusion begins'],
  [4.57,5772,0,'The Sun today'],
  [10.5,5500,.38,'Hydrogen runs low in the core'],
  [12.1,3100,3.0,'Red giant'],
  [12.2,4800,1.8,'Helium fusion in the core'],
  [12.35,2850,3.65,'Late giant and envelope loss'],
  [12.36,90000,3.20,'Hot exposed core and planetary nebula'],
  [12.45,37000,-1.15,'White dwarf'],
  [20,6500,-3.75,'White dwarf cooling']
];
function arrowPath(c,points,color){
  path(c,points,color,1.5);
  const [a,b]=points.slice(-2), theta=Math.atan2(b[1]-a[1],b[0]-a[0]);
  for(const d of [-.5,.5])line(c,b,[b[0]-7*Math.cos(theta+d),b[1]-7*Math.sin(theta+d)],color,1.5);
}
function starLab(root){
  root.innerHTML=card('The Hertzsprung–Russell diagram',
    '<p><strong>Start with one dot.</strong> Find Sirius A. Its position tells you two things: its surface is hotter than the Sun’s (farther left), and it gives off more light in total (higher up). The axes measure temperature and luminosity. Time enters only when you follow an individual star.</p>'+
    '<ul class="hr-key"><li><span class="hr-population"></span><strong>Shaded bands</strong> show where many stars fall on this map. Think of a snapshot of many stars at different stages of life.</li><li><span class="hr-track"></span><strong>Gold arrows</strong> show the modeled life of one star, the Sun. Turn on its track or press Play to follow it.</li></ul>'+
    canvas('hr','Hertzsprung–Russell diagram with stellar populations and the evolutionary path of the Sun',true)+
    '<div class="lab-actions"><button id="sun-play">Play the Sun’s life</button><label><input id="hr-track" type="checkbox"> Show the Sun’s life track</label></div>'+slider('sun-age','Sun’s age (billion years)',0,20,4.57,.01)+out('sun-stage')+
    '<p>The diagonal <strong>main sequence</strong> contains stars fusing hydrogen in their cores. Mass largely determines where a star settles on it. The Sun spends most of its life near its current spot. Later it moves up and right as a cooler, brighter giant. After shedding its outer layers, the hot remnant moves down into the white-dwarf region and gradually cools. The track and ages are approximate.</p>'+
    '<div class="lab-rows"><div><h3>Sun-like stars</h3><p>Hydrogen fusion on the main sequence → red giant → gas shed into space → white dwarf. Sirius B is a white dwarf.</p></div>'+
    '<div><h3>Massive stars</h3><p>Short-lived hot main-sequence star → evolved giant or stripped star → core collapse. A neutron star can remain, or a black hole can form. The outcome depends on the final core, mass loss and companions.</p></div></div>');
  const draw=()=>{
    const env=canvasContext($(root,'hr'));if(!env)return;
    const {ctx:c,w,h}=env;
    const left=49,right=w-26,top=25,bottom=h-44;
    const x=v=>left+(Math.log10(100000)-Math.log10(v))/(5-Math.log10(2500))*(right-left);
    const y=v=>top+(7-v)/12*(bottom-top);
    background(c,w,h);
    for(const k of [-5,-3,-1,0,1,3,5,7]){
      line(c,[left,y(k)],[right,y(k)]);text(c,'10^'+k,left-6,y(k)+4,muted,'right');
    }
    const ticks=w<520?[100000,20000,6000,2500]:[100000,30000,10000,6000,4000,2500];
    for(const k of ticks){
      line(c,[x(k),top],[x(k),bottom]);text(c,k.toLocaleString('en-US'),x(k),bottom+17,muted);
    }
    text(c,'Hotter ← Surface temperature (K) → Cooler',w*.54,h-7,ink);
    text(c,'Brighter ↑ Luminosity (Sun = 1)',left,15,ink,'left');
    const bands=[
      ['Main sequence',[[44000,5.6],[22000,4],[10000,1.6],[5772,0],[3900,-1.25],[2600,-4.2]]],
      ['Giants',[[7500,1.6],[5400,2.0],[3200,3.1]]],
      ['Supergiants',[[30000,5.7],[6000,5.2],[3400,5.1]]],
      ['White dwarfs',[[58000,-.7],[25000,-1.6],[6500,-3.8]]]
    ];
    for(const [name,points] of bands){
      path(c,points.map(([v,l])=>[x(v),y(l)]),'#9dbafe33',16);
      for(let i=1;i<points.length;i++){
        const [t0,l0]=points[i-1],[t1,l1]=points[i];
        for(let j=0;j<6;j++){
          const f=j/6,t=t0*(t1/t0)**f,l=l0+(l1-l0)*f;
          const hue=Math.max(4,Math.min(215,4+210*Math.log(t/2800)/2.7));
          dot(c,x(t),y(l)+4*Math.sin(j*7+i),name==='Supergiants'?4.4:2.6,'hsl('+hue+' 82% 70% / .71)');
        }
      }
    }
    text(c,'Main sequence',x(18000),y(2.6)+17,muted);
    text(c,'Giants',x(4650),y(3.5),muted);
    text(c,'Supergiants',x(10000),y(5.5)-8,muted);
    text(c,'White dwarfs',x(23000),y(-3.2),muted);
    const coord=([t,l])=>[x(t),y(l)];
    const track=solarTrack.map(([,t,l])=>coord([t,l]));
    const showTrack=$(root,'hr-track').checked;
    if(showTrack){
      for(let i=1;i<track.length;i++)arrowPath(c,track.slice(i-1,i+1),'#ffd087');
    }
    for(const [n,v,l,col,dx,dy] of starExamples){
      dot(c,x(v),y(l),3.6,col);text(c,n,x(v)+dx,y(l)+dy,col,dx<0?'right':'left');
    }
    const age=+$(root,'sun-age').value;
    const next=solarTrack.findIndex(([t])=>t>age), j=next===-1?solarTrack.length-2:next-1;
    const [start,,,stage]=solarTrack[j], end=solarTrack[j+1][0], f=(age-start)/(end-start);
    const point=track[j].map((v,k)=>v+(track[j+1][k]-v)*f);
    if(showTrack)shot(c,...point,5,true);
    $(root,'sun-stage').textContent=age.toFixed(2)+' billion years · '+(age===20?solarTrack.at(-1)[3]:stage);
  };
  const detach=attach(root,draw), input=$(root,'sun-age');
  let index=0, playing=false, age=0;
  const go=$(root,'sun-play');
  const dispose=clock(go,()=>{
    const end=solarTrack[index+1][0], start=solarTrack[index][0];
    const next=Math.min(end,age+(end-start)/14);age=next;
    input.value=next.toFixed(2);draw();
    if(next>=end-1e-9){
      if(++index===solarTrack.length-1){go.click();}
    }
  });
  go.addEventListener('click',()=>{
    if(!playing){
      const trackSwitch=$(root,'hr-track');
      if(!trackSwitch.checked||+input.value>=20)input.value=0;
      trackSwitch.checked=true;
      age=+input.value;
      index=Math.max(0,solarTrack.findIndex(([t])=>t>age)-1);
      draw();
    }
    playing=!playing;
    if(!playing)go.textContent='Play the Sun’s life';
  });
  input.addEventListener('input',()=>{if(playing)go.click();$(root,'hr-track').checked=true;draw();});
  $(root,'hr-track').addEventListener('change',event=>{if(!event.target.checked&&playing)go.click();});
  return ()=>{detach();dispose();};
}

const hydrogen=[410.2,434.0,486.1,656.28], sodium=[588.995,589.592], calcium=[393.37,396.85];
function spectrum(c,w,h,rows,lo=380,hi=760){
  background(c,w,h);
  const x=v=>42+(v-lo)/(hi-lo)*(w-64), rw=w-64, dy=(h-55)/rows.length;
  for(const [i,{label,lines,emission}] of rows.entries()){
    const y=22+i*dy;
    text(c,label,42,y,ink,'left');
    if(emission){c.fillStyle='#03060c';c.fillRect(42,y+9,rw,30);}
    else{
      for(let q=0;q<rw;q++){
        c.fillStyle=waveColor(lo+(hi-lo)*q/rw);
        c.fillRect(42+q,y+9,1,30);
      }
    }
    for(const nm of lines)if(nm>lo&&nm<hi)line(c,[x(nm),y+9],[x(nm),y+39],emission?waveColor(nm):'#050a13',2);
  }
  const step=hi-lo<10?1:hi-lo<40?5:80;
  const start=Math.ceil(lo/step)*step;
  for(let nm=start;nm<=hi;nm+=step)text(c,nm+' nm',x(nm),h-12,muted);
}
function dopplerLab(root){
  root.innerHTML=card('Read motion in a spectrum',
    '<p>A moving star’s spectral lines shift together. A receding star stretches their wavelengths toward red. An approaching star compresses them toward blue. Compare the same four hydrogen lines above and below.</p>'+
    slider('velocity','Speed along the line of sight (km/s)',-30000,30000,0,100)+'<div class="slider-directions"><span>Moving toward us</span><span>No radial motion</span><span>Moving away from us</span></div>'+out('doppler-read')+
    '<div class="lab-rows">'+canvas('spectrum','Rest-frame and Doppler-shifted hydrogen absorption spectra')+
    canvas('doppler-star','Illustrative round star colored by direction of motion')+'</div>'+
    '<p>The star’s tint is a visual cue. Real stellar Doppler shifts are usually detected in spectral lines because the overall color changes very little.</p>'+
    '<details><summary>What this does and does not measure</summary><p>The shift measures radial velocity. Sideways motion requires tracking position across the sky. This simulation uses the relativistic Doppler formula for radial motion. Speeds are deliberately large so the shift is easy to see. Over cosmological distances, expansion also stretches wavelengths, and a single special-relativistic velocity is generally the wrong interpretation.</p></details>');
  return attach(root,()=>{
    const v=+$(root,'velocity').value,b=v/299792.458, factor=Math.sqrt((1+b)/(1-b));
    $(root,'doppler-read').textContent=(v===0?'No radial motion':Math.abs(v).toLocaleString('en-US')+' km/s '+(v>0?'away · redshift':'toward us · blueshift'))+
      ' · Hα '+hydrogen.at(-1).toFixed(2)+' → '+(hydrogen.at(-1)*factor).toFixed(2)+' nm';
    const star=canvasContext($(root,'doppler-star'));
    if(star){
      const {ctx:c,w,h}=star,r=Math.min(w,h)*.13, blend=Math.min(1,Math.abs(b)*9);
      background(c,w,h);
      shot(c,w/2,h*.44,r,true);
      const tint=v>=0?[255,107,107]:[98,162,255];
      dot(c,w/2,h*.44,r,'rgb('+tint.map(x=>Math.round(255+(x-255)*blend)).join(',')+')');
      text(c,v>0?'Moving away':v<0?'Moving toward us':'No radial motion',w/2,h*.78);
      text(c,'Illustrative tint',w/2,h*.89,muted);
    }
    const env=canvasContext($(root,'spectrum'));
    if(env)spectrum(env.ctx,env.w,env.h,[{label:'Laboratory · hydrogen',lines:hydrogen},
      {label:'Observed star',lines:hydrogen.map(n=>n*factor)}],350,780);
  });
}

function darkLab(root){
  root.innerHTML='<div class="lab-stack">'+card('Why is the night sky dark?',
    '<p>This is <strong>Olbers’ paradox</strong>. In an eternal, static universe filled uniformly with shining stars, each layer contains more stars in proportion to distance squared. Each one is fainter by the same factor. Add layers and the sky would eventually be covered by stellar surfaces.</p>'+
    '<div class="lab-actions">'+select('universe','Universe', [['real','Finite history · expanding'],['static','Eternal · static']])+'</div>'+
    slider('shells','Maximum lookback time',1,18,18)+out('dark-read')+'<div class="lab-rows">'+canvas('shellview','Illustrative contributions to sky brightness from equally thick layers')+
    canvas('nightfield','Illustrative sky becoming brighter as more shells of stars contribute')+'</div>'+
    '<p>Light travels at a finite speed. Very distant light takes longer to arrive. There was an era before the first stars, so the observed sky cannot accumulate light from infinitely many layers of shining stars. Expansion also redshifts light and reduces energy arrival rates.</p>'+
    '<p><strong>When Earth formed, about 4.54 billion years ago:</strong> stars already existed in the Milky Way. The sky would have had different stars and patterns. Looking back farther from Earth today shows earlier light from distant sources. It does not tell us how many stars could have been seen from the young Earth.</p>'+
    '<details><summary>What our eyes miss</summary><p>Most stars are too distant and faint to see individually with the unaided eye. The sky still glows at wavelengths we cannot see. The early universe fills the sky with the cosmic microwave background. The bars compare shell contributions before stellar disks overlap. In the eternal model the final view illustrates the limiting case, in which every sight line ends on a stellar surface. Disk sizes and the number of layers needed to fill the view are illustrative. The last slider position switches to the infinite-time limit in the eternal model.</p></details>')+
    card('The sky seen from Earth',
    '<p>On a clear, moonless night far from city lights, a person may see <strong>roughly 3,000 individual stars</strong> above the horizon. Most are part of the Milky Way. The faint Milky Way band is light from many stars your eye cannot pick out separately.</p>'+
    '<div class="lab-actions">'+select('observer-era','Observe from Earth',[['today','Today'],['past','2 billion years ago'],['future','2 billion years from now']])+'</div>'+
    out('observer-read')+canvas('observer-field','Illustrative unaided-eye night sky from Earth at the selected epoch')+
    '<p>Stars are born, die, and move. As the Sun travels through the Milky Way, different stars come close enough for us to see. An observer 2 billion years ago would have seen a different star field. In the future, some familiar stars will vanish from view and others will appear. The overall count could go up or down.</p>'+
    '<p>These sketches use similar densities to make the changing patterns easy to compare. They are not maps or estimates of ancient or future star counts. The future view assumes an observer with a clear view of space.</p>')+'</div>';
  return attach(root,()=>{
    const era=$(root,'observer-era').value;
    const sketches={past:[17,'2 billion years ago · illustrative sky'],today:[89,'Today · illustrative dark-sky view'],future:[201,'2 billion years from now · illustrative sky']};
    const [seed,caption]=sketches[era];
    $(root,'observer-read').textContent=caption;
    const observer=canvasContext($(root,'observer-field'));
    const rand=i=>Math.abs(Math.sin(i*127.1)*43758.5453)%1;
    if(observer){
      const {ctx:c,w,h}=observer;
      background(c,w,h,'#030714','#131f38');
      for(let i=1;i<=500;i++){
        const k=seed*509+i,x=rand(k)*w;
        const y=i>165?h*(.72-x/w*.44+(rand(k+301)+rand(k+707)-1)*.29):rand(k+301)*h*.89;
        const radius=i>165?.2+rand(k+990)*.42:.4+rand(k+990)**3*1.6;
        dot(c,x,y,radius,i>165?'#aebee837':i%13===0?'#ffdeb4':'#ecf3ffbd');
      }
      const horizon=Array.from({length:41},(_,i)=>[w*i/40,h*(.93+.018*Math.sin(i*.61)+.011*Math.cos(i*1.8))]);
      c.beginPath();c.moveTo(...horizon[0]);
      for(const point of horizon.slice(1))c.lineTo(...point);
      c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle='#02050e';c.fill();
    }
    const n=+$(root,'shells').value, real=$(root,'universe').value==='real';
    const env=canvasContext($(root,'shellview'));if(!env)return;
    const {ctx:c,w,h}=env;background(c,w,h);
    const lookback=n*13.8/18;
    const values=Array.from({length:n},(_,i)=>real?Math.exp(-i*.18)*Math.max(0,Math.min(1,13.6*18/13.8-i)):1);
    const total=values.reduce((s,v)=>s+v,0);
    $(root,'dark-read').textContent=(real?'Up to ':'Model window: ')+lookback.toFixed(2)+' billion years of lookback · '+total.toFixed(1)+' illustrative brightness units';
    const field=canvasContext($(root,'nightfield'));
    if(field){
      const {ctx:sc,w:sw,h:sh}=field;
      background(sc,sw,sh,'#040815','#091425');
      if(real){
        for(let i=1;i<=n*15;i++)dot(sc,rand(i)*sw,rand(i+301)*sh,.5+rand(i+990),'#fdf2dbac');
      }else{
        const radius=Math.max(2,sw/60), count=Math.round(5*(Math.exp(n*.45)-1));
        const colors=['#ffe19b','#ffd2a8','#fff5da','#e5edff','#f7e5ce'];
        // At the final setting, a dense, overlapping set of apparent disks realizes the limit.
        const pitch=radius, cols=Math.ceil(sw/pitch)+3, rows=Math.ceil(sh/pitch)+3;
        if(n===18){
          for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
            const k=j*cols+i;
            dot(sc,(i-1+rand(k)*.35)*pitch,(j-1+rand(k+55)*.35)*pitch,radius,colors[k%colors.length]);
          }
        }else for(let i=1;i<=count;i++)dot(sc,rand(i)*sw,rand(i+301)*sh,radius,colors[i%colors.length]);
      }
      sc.fillStyle='#111a2bbf';sc.fillRect(0,sh-31,sw,31);
      text(sc,'Illustrative sky · '+(real?'finite history':'eternal and static'),sw/2,sh-14);
    }
    const bw=(w-66)/18, base=h-43;
    line(c,[38,base],[w-24,base],muted);
    values.forEach((v,i)=>{c.fillStyle=real?cyan:gold;c.fillRect(40+bw*i,base-v*h*.53,Math.max(2,bw-4),v*h*.53);});
    text(c,'Contribution by layer',38,24,ink,'left');
    text(c,real?'Observer today':'Now',39,h-17,real?cyan:muted,'left');
    text(c,'13.8 billion years back',w-25,h-17,muted,'right');
    if(real){
      line(c,[39,65],[39,base],cyan);
      dot(c,39,base,3.5,cyan);
      const x=39+4.54/13.8*18*bw;
      line(c,[x,42],[x,base],'#ffcf8c');
      text(c,'Earth forms',x+5,56,gold,'left');
    }else{
      text(c,'The eternal model extends beyond this window',w*.54,44,muted);
    }

  });
}

const frac=(top,bottom)=>'<span class="fraction"><span>'+top+'</span><span>'+bottom+'</span></span>';
function measureLab(root){
  root.innerHTML='<div class="lab-stack">'+card('Find a star’s distance by parallax',
    '<p>Observe a nearby star twice, six months apart. Earth’s two observing positions are about 2 AU apart. The star shifts against distant background stars. Half the apparent shift is the parallax angle <i>p</i>. Its distance in parsecs is <strong>1 ÷ p</strong>, when <i>p</i> is in arcseconds.</p>'+
    slider('distance','Model distance (parsecs)',1,50,5)+out('parallax')+
    '<div class="lab-rows">'+canvas('triangle','Two sightings, reference stars, and the angle p at the nearby star')+
    '<div><h3>One right triangle</h3><div id="live-parallax" class="display-math"></div><p><strong>tan p = 1 AU / d</strong>, so <strong>d = 1 AU / tan p</strong>. The known short side is half of Earth’s orbital baseline. The unknown long side is the distance to the star. For tiny angles this gives <strong>d(pc) ≈ 1 / p(arcsec)</strong>.</p><p>The fixed background stars give both exposures the same coordinate grid. Measure the shift against that grid. In this symmetric setup, half the shift equals angle p at the star.</p></div></div>'+
    '<p>The angle is greatly enlarged. One parsec (pc) is about <strong>3.26 light-years</strong>, <strong>206,265 AU</strong>, or <strong>30.9 trillion km</strong>. At that distance, a 1 AU baseline gives a parallax of one arcsecond.</p><h3>Distances to very distant stars</h3><p>When the parallax of a distant star is too small to measure reliably, compare how bright a star appears with how much energy it really emits. A star of known luminosity appears four times fainter at twice the distance. For Cepheid variables, the pulsation period gives a calibrated luminosity. For other stars, temperature, spectra and stellar models can help estimate luminosity. Astronomers correct for dust, which also makes stars look fainter.</p>')+
    card('How light reveals what a star is made of',
    '<p>We cannot scoop up a spoonful of a distant star. But a telescope can collect its light. A spectrograph spreads that light into a rainbow, called a <strong>spectrum</strong>. Look closely and you may see thin dark lines, where particular colors are missing.</p>'+
    '<p><strong>Try sodium.</strong> Choose <em>Neutral sodium</em> below. In the lab, glowing sodium gives two bright yellow lines very close together. In the star, the same two wavelengths can show up as dark lines. The matching pattern tells us sodium is present in the gas the light passed through. Astronomers check several lines because a single line could be a coincidence.</p>'+
    '<p><strong>Absorption:</strong> cooler gas in front of a bright surface takes particular wavelengths out of the beam. <strong>Emission:</strong> hot, thin gas seen against darkness adds light at particular wavelengths. The same instrument can record either pattern. In a star, the lines chiefly tell us what is in its atmosphere. To estimate how much is present, astronomers also account for temperature and other conditions.</p>'+
    '<div class="lab-actions">'+select('element','Element / ion',[['h','Hydrogen'],['na','Neutral sodium'],['ca','Ionized calcium']])+select('kind','Spectrum',[['abs','Absorption'],['em','Emission']])+'</div>'+
    out('chem-read')+canvas('chemical','Laboratory spectral fingerprint compared with stellar absorption or gas emission')+
    '<h3>Inside a slit spectrograph</h3><p>The telescope focuses starlight onto a slit. A collimator makes the beam parallel. A diffraction grating sends different wavelengths in different directions. Camera optics focus them onto different pixels of a detector.</p>'+
    canvas('instrument','Optical layout of a slit spectrograph with collimator, transmission grating, camera and detector')+
    '<details><summary>What line strengths tell us</summary><p>Abundances come from fitting line strengths and profiles with model atmospheres. Temperature, ionization, density and blends affect the lines. Astronomers also correct for Doppler shifts before matching wavelengths.</p></details>')+'</div>';
  return attach(root,()=>{
    const d=+$(root,'distance').value;
    const p=(1/d).toFixed(5);
    $(root,'live-parallax').innerHTML='d ≈ '+frac('1',p)+' pc = '+d+' pc';
    $(root,'parallax').textContent=d+' pc · '+(d*3.26156).toFixed(1)+' light-years · p = '+(1/d).toFixed(3)+' arcsec';
    const env=canvasContext($(root,'triangle'));
    if(env){
      const {ctx:c,w,h}=env;background(c,w,h);
      const cx=w/2, y0=h*.79, sy=h*(.14+.33*Math.exp(-d/10)), baseline=w*.26;
      const star=[cx,sy],west=[cx-baseline,y0],east=[cx+baseline,y0];
      const ry=h*.10, dis=baseline*(sy-ry)/(y0-sy);
      for(const f of [-.37,-.21,-.11,.12,.24,.38]){
        const xx=cx+w*f;
        line(c,[xx-3,ry],[xx+3,ry],muted);line(c,[xx,ry-3],[xx,ry+3],muted);
      }
      text(c,'Fixed background stars',cx,ry-9,muted);
      line(c,west,[cx+dis,ry],cyan,1.7);line(c,east,[cx-dis,ry],'#c5a4ff',1.7);
      line(c,[cx,sy+4],[cx,y0],'#a6b9d680');
      line(c,west,east,muted);
      for(const side of [west,east])dot(c,...side,5,cyan);
      shot(c,...star,5,true);
      const pAngle=Math.atan2(baseline,y0-sy);
      c.beginPath();c.arc(cx,sy,27,Math.PI/2-pAngle,Math.PI/2);c.strokeStyle=gold;c.lineWidth=2;c.stroke();
      text(c,'p',cx+18,sy+39,gold);
      text(c,'Nearby star',cx-10,sy+16,ink,'right');
      text(c,'Epoch 1',west[0],y0+21,cyan);
      text(c,'Epoch 2',east[0],y0+21,'#c5a4ff');
      text(c,'Sun',cx,y0+21,gold);
      dot(c,cx,y0,4,gold);
      text(c,'1 AU',cx-baseline*.5,y0+18,muted);
      text(c,'1 AU',cx+baseline*.5,y0+18,muted);
    }
    const instrument=canvasContext($(root,'instrument'));
    if(instrument){
      const {ctx:c,w,h}=instrument,y=h*.68;
      background(c,w,h);
      const [slit,lens,grating,camera,detector]=[.09,.26,.43,.65,.88].map(k=>k*w);
      const sy=h*.16;
      line(c,[slit,y-34],[slit,y-6],muted,6);line(c,[slit,y+6],[slit,y+34],muted,6);
      for(const dy of [-12,12]){
        line(c,[slit,y],[lens,y+dy],ink);
        line(c,[lens,y+dy],[grating,y+dy],ink);
      }
      for(const [j,nm] of [450,550,650].entries()){
        const ry=y-h*(.20+j*.11), focal=y-h*(.27+j*.13);
        for(const dy of [-12,12]){
          line(c,[grating,y+dy],[camera,ry+dy],waveColor(nm),1.5);
          line(c,[camera,ry+dy],[detector,focal],waveColor(nm),1.5);
        }
        dot(c,detector,focal,3,waveColor(nm));
      }
      line(c,[lens,y-27],[lens,y+27],cyan,4);
      line(c,[grating,y-27],[grating,y+27],gold,4);
      line(c,[camera,sy-14],[camera,y-21],cyan,4);
      line(c,[detector,sy-13],[detector,y-41],muted,3);
      for(const [label,x,yLabel] of [['Slit',slit,.90],['Collimator',lens,.98],['Grating',grating,.90],['Camera',camera,.90],['Detector',detector,.90]])text(c,label,x,h*yLabel);
    }
    const key=$(root,'element').value, emission=$(root,'kind').value==='em';
    const lines={h:hydrogen,na:sodium,ca:calcium}[key];
    const range={h:[390,680],na:[586,592],ca:[388,403]}[key];
    $(root,'chem-read').textContent='Matching lines: '+lines.map(v=>v.toFixed(2)).join(', ')+' nm';
    const spec=canvasContext($(root,'chemical'));
    if(spec)spectrum(spec.ctx,spec.w,spec.h,[{label:'Laboratory fingerprint',lines,emission:true},
      {label:emission?'Hot, thin glowing gas':'Star seen through its cooler atmosphere',lines,emission}],...range);
  });
}

function lightSpeedLab(root){
  root.innerHTML='<div class="lab-stack">'+card('Why light sets the speed limit',
    '<p>In special relativity, space and time share an invariant speed <strong>c</strong>. Every inertial observer measures the same vacuum speed for light. Use the controls to compare a massive particle with a photon.</p>'+
    '<div class="lab-actions">'+select('particle','Particle',[['massive','Has mass'],['photon','Photon · zero rest mass']])+'</div>'+
    slider('impulse','Momentum, in units of a fixed reference mass times c',0,10,2,.1)+out('relativity')+
    canvas('limit','Massive-particle speed approaches the speed of light, while photon speed stays at c')+
    '<div class="display-math"><span>E² = (mc²)² + (pc)²</span><span>v = '+frac('pc²','E')+'</span></div>'+
    '<p><strong>Momentum</strong> is the quantity of motion. It has a direction. At ordinary speeds its magnitude is mass × speed. Near light speed a massive body follows <em>p = γmv</em>. Light also carries momentum, so it can push on a surface.</p>'+
    '<p><strong>E</strong> is total energy, <strong>m</strong> is rest mass, and <strong>p</strong> is the magnitude of momentum. For an object at rest, p = 0, and the relation reduces to <strong>E = mc²</strong>. For a photon, m = 0, so <strong>E = pc</strong>. Substituting into the velocity formula gives <strong>v = c</strong> for any photon with nonzero energy. A massive particle has E &gt; pc and therefore v &lt; c. Adding momentum gets it closer to c and requires ever more energy.</p>')+
    card('Why physicists set c = 1',
    '<p>In <strong>natural units</strong> you can measure time in seconds and distance in light-seconds. Light in vacuum covers one light-second in one second, so its speed has the numerical value <strong>c = 1</strong>. One light-second is about 300,000 km.</p>'+
    '<p>Multiplying a time interval by <strong>c</strong> expresses it in units of length. That is why spacetime diagrams often use <strong>ct</strong> and <strong>x</strong> on their axes. With the same scale on both axes a light ray travels at 45°. The choice of units leaves the physical speed limit intact.</p>')+
    card('Where the number comes from',
    '<p>The equation establishes the relationship among energy, momentum, mass, and speed. Its symbols alone cannot give a numerical value for c. Time-of-flight measurements compare a known distance with the travel time of a light pulse. Today the SI defines the meter using the fixed vacuum value <strong>299,792,458 meters per second</strong>, about <strong>300,000 km/s</strong>.</p>'+
    slider('distance-light','One-way distance (km)',1000,400000,384400,100)+out('flight')+
    '<p>Light in glass or water travels more slowly. The speed limit here refers to light in vacuum.</p>')+'</div>';
  return attach(root,()=>{
    const photon=$(root,'particle').value==='photon', input=$(root,'impulse');
    input.min=photon?.1:0;
    if(photon&&+input.value===0)input.value=.1;
    const p=+input.value, energy=Math.hypot(photon?0:1,p), v=p/energy;
    $(root,'relativity').textContent='v = '+v.toFixed(4)+' c · E = '+energy.toFixed(2)+' reference energy units';
    $(root,'flight').innerHTML='t = '+frac((+$(root,'distance-light').value).toLocaleString('en-US')+' km','299,792.458 km/s')+' = '+(+$(root,'distance-light').value/299792.458).toFixed(5)+' s';
    const env=canvasContext($(root,'limit'));if(!env)return;
    const {ctx:c,w,h}=env; background(c,w,h);
    const x=k=>42+k*(w-66)/10,y=k=>h-40-k*(h-75);
    line(c,[x(0),y(0)],[x(10),y(0)],muted);line(c,[x(0),y(0)],[x(0),y(1)],muted);
    line(c,[x(0),y(1)],[x(10),y(1)],gold,2);
    text(c,'c',29,y(1)+4,gold);
    text(c,'Momentum (p)',w*.53,h-12,muted);
    text(c,'Speed',42,17,ink,'left');
    path(c,Array.from({length:101},(_,i)=>[x(i/10),y((i/10)/Math.hypot(1,i/10))]),cyan,2);
    dot(c,x(p),y(v),5,photon?gold:cyan);
  });
}

function retrogradeLab(root,api){
  root.innerHTML=card('Why does Jupiter seem to go backward?',
    '<p>Imagine passing a slower runner on the inside lane. Against the distant scenery, that runner seems to slide backward even as both of you run forward. Earth does something similar when it passes Jupiter.</p>'+
    '<div class="lab-actions"><button id="retro-play">Play</button><button id="retro-pass">Jump to the pass</button></div>'+
    slider('retro-day','Observation night',0,169,0)+out('retro-status')+
    '<div class="lab-rows retro-views"><section><h3>From above the Solar System</h3>'+canvas('retro-orbits','Earth and Jupiter move in the same direction. A sightline connects Earth to Jupiter.')+
    '</section><section><h3>From Earth, against the stars</h3>'+canvas('retro-sky','Jupiter’s apparent direction on a fixed star background, with east to the right.')+'</section></div>'+
    '<p>Follow the gold sightline in the first picture and Jupiter’s dot in the second. The <strong>purple stretch</strong> shows where Jupiter appears to move west. At the <strong>stationary points</strong> Jupiter stops moving east or west before reversing. It can still drift north or south.</p>'+
    '<details><summary>How did epicycles explain the reversal?</summary>'+
    '<div class="lab-rows"><svg class="kepler-mini" viewBox="0 0 220 128" role="img" aria-label="An Earth-centered model with a small movable circle carried along a larger circle."><circle cx="84" cy="64" r="49" fill="none" stroke="#7296bf"/><circle cx="125" cy="38" r="23" fill="none" stroke="#e8b979"/><circle cx="84" cy="64" r="5" fill="#84c6ff"/><circle cx="146" cy="47" r="5" fill="#e8b979"/><text x="84" y="84">Earth</text><text x="174" y="60">Planet</text><text x="172" y="23">Epicycle</text></svg>'+
    '<p>In the Earth-centered model associated with Ptolemy, a planet rode on a small circle called an <strong>epicycle</strong>. The center of that circle traveled along a larger circle called the <strong>deferent</strong>. Part of the small circle could make the planet seem to go backward. It was a useful way to calculate positions. Jupiter’s reversal comes from watching it from a moving Earth, as the animation shows. The same apparent reversal can be described in Earth-centered coordinates.</p></div></details>'+
    '<p class="callout">Each frame uses a real date at 22:00 UTC, with Jupiter above Milan’s horizon throughout this example. The view is aligned on the stars, like stacking photos and matching the stars in each one. Up is north on the star map. Jupiter’s height above the local horizon is listed separately. The north–south direction is stretched to make the narrow curve easier to see.</p>');
  const input=$(root,'retro-day'),play=$(root,'retro-play');
  const pass=$(root,'retro-pass');
  play.disabled=pass.disabled=input.disabled=true;
  let data,closed=false;
  const orbitRadius=5.2, purple='#bc9cff';
  const position=(angle,r)=>[r*Math.cos(angle),r*Math.sin(angle)];
  const dateFormat=new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeZone:'UTC'});
  const dispose=attach(root,()=>{
    if(!data)return;
    const {samples,stars,first,last,oppositionIndex}=data;
    const index=Number(input.value),[date,ra,dec,earth,jupiter,alt]=samples[index];
    const station=index===first||index===last, retro=index>first&&index<last;
    const direction=station?'Stationary point':retro?'Westward · retrograde':'Eastward · direct';
    $(root,'retro-status').textContent=dateFormat.format(Date.parse(date))+' · 22:00 UTC · '+direction+
      ' · '+Math.round(alt)+'° above Milan’s horizon'+(index===oppositionIndex?' · Opposition date':'');
    const orbit=canvasContext($(root,'retro-orbits'));
    if(orbit){
      const {ctx:c,w,h}=orbit,r=Math.min(w,h)*.38/orbitRadius,x=w/2,y=h/2;
      background(c,w,h);
      const map=([a,b])=>[x+a*r,y-b*r];
      for(const [rr,color] of [[1,cyan],[orbitRadius,'#967d5d']]){
        c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.arc(x,y,rr*r,0,Math.PI*2);c.stroke();
        const a=2.3,p=map(position(a,rr)),q=map(position(a-.25,rr));
        line(c,q,p,color,2);
        for(const twist of [-.65,.65]){
          const heading=Math.atan2(p[1]-q[1],p[0]-q[0])+twist;
          line(c,p,[p[0]-7*Math.cos(heading),p[1]-7*Math.sin(heading)],color,2);
        }
      }
      const e=map(earth),j=map(jupiter);
      line(c,e,[e[0]+(j[0]-e[0])*1.6,e[1]+(j[1]-e[1])*1.6],gold,1.5);
      shot(c,x,y,5);dot(c,...e,5,cyan);dot(c,...j,7,gold);
      text(c,'Earth',e[0],e[1]+(e[1]>y?20:-11),cyan);
      text(c,'Jupiter',j[0],j[1]-12,gold);
    }
    const sky=canvasContext($(root,'retro-sky'));
    if(sky){
      const {ctx:c,w,h}=sky;
      const px=value=>w*(.1+.8*(value-102)/19),py=value=>h*(.78-.56*(value-20)/4);
      const point=([,a,d])=>[px(a),py(d)];
      background(c,w,h,'#111d36','#080c18');
      for(const angle of [104,108,112,116,120]){
        line(c,[px(angle),34],[px(angle),h-35],'#334966');
        text(c,angle+'°',px(angle),h-17,muted);
      }
      for(const angle of [20,21,22,23,24]){
        line(c,[34,py(angle)],[w-14,py(angle)],'#334966');
        text(c,angle+'°',28,py(angle)+4,muted,'right');
      }
      text(c,'WEST',14,23,muted,'left');text(c,'NORTH ↑',w/2,23,muted);text(c,'EAST',w-14,23,muted,'right');
      for(const [,group] of stars)for(const [a,d] of group){
        if(a>=102&&a<=121&&d>=19&&d<=25)dot(c,px(a),py(d),2.4,'#dce9ff');
      }
      path(c,samples.map(point),'#7594b98a',2);
      path(c,samples.slice(first,last+1).map(point),purple,2);
      if(index>0)path(c,samples.slice(0,index+1).map(point),'#ffcb8c99',1);
      for(let i=0;i<=index;i+=7)dot(c,...point(samples[i]),2,gold);
      for(const i of [first,last]){
        const label=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(Date.parse(samples[i][0]));
        const [x,y]=point(samples[i]);
        dot(c,x,y,4,purple);text(c,label,x,y+(i===first?23:-14),purple);
      }
      const [x,y]=point([date,ra,dec]);
      shot(c,x,y,5);
    }
  });
  $(root,'retro-status').textContent='Calculating Jupiter’s nightly positions…';
  api('jupiter_retrograde',[]).then(result=>{
    if(closed)return;
    const {samples,opposition}=result;
    const first=samples.findIndex((s,i)=>i+1<samples.length&&samples[i+1][1]<s[1]);
    const last=samples.findIndex((s,i)=>i>first&&i+1<samples.length&&samples[i+1][1]>s[1]);
    const oppositionIndex=samples.findIndex(s=>s[0].slice(0,10)===opposition.slice(0,10));
    data={...result,first,last,oppositionIndex};
    input.max=samples.length-1;
    play.disabled=pass.disabled=input.disabled=false;
    setDay(0);
  }).catch(()=>{if(!closed)$(root,'retro-status').textContent='Jupiter’s positions could not be loaded.';});
  let timer;
  function stop(){clearInterval(timer);timer=null;play.textContent='Play';}
  function setDay(day){input.value=day;input.dispatchEvent(new Event('input',{bubbles:true}));}
  play.onclick=()=>{
    if(timer){stop();return;}
    if(input.value===input.max)setDay(0);
    play.textContent='Pause';
    timer=setInterval(()=>{setDay(+input.value+1);if(input.value===input.max)stop();},85);
  };
  input.onpointerdown=stop;
  pass.onclick=()=>{if(data){stop();setDay(data.oppositionIndex);}};
  return ()=>{closed=true;stop();dispose();};
}

function galileoLab(root){
  const stars=Array.from({length:92},(_,i)=>{
    const x=15+(i*137.17)%290,y=64+Math.sin(i*2.39)*((i*43)%49)-(x-155)*.13;
    return `<circle cx="${x}" cy="${y}" r="${i%10===0?1.7:.7}" fill="#e3eaff" opacity="${i%4*.16+.3}"/>`;
  }).join('');
  root.innerHTML=`<div class="lab-stack">
    <article class="lab-card"><h2>Galileo and the Starry Messenger</h2>
    <p>In 1609 Galileo built and improved telescopes after hearing about a Dutch spyglass. He turned them on the sky. In March 1610 he published <cite>Sidereus Nuncius</cite> in Venice, describing what he saw and what he inferred from it.</p>
    <div class="galileo-plates">
      <section><h3>Mountains on the Moon</h3>
        <svg viewBox="0 0 320 145" role="img" aria-label="A half-lit Moon with a jagged boundary and bright peaks on its dark side">
          <defs><clipPath id="galileo-moon"><circle cx="160" cy="68" r="57"/></clipPath></defs>
          <image href="assets/moon.webp" x="45" y="3" width="230" height="130" preserveAspectRatio="xMidYMid slice" clip-path="url(#galileo-moon)"/>
          <path d="M160 11 Q98 75 160 125 A57 57 0 0 0 160 11Z" fill="#080c16" opacity=".84"/>
          <path d="M160 12 A57 57 0 1 0 160 125" fill="none" stroke="#cab991" opacity=".5"/>
          <g fill="#ffdb9b"><circle cx="153" cy="38" r="2"/><circle cx="140" cy="65" r="2"/><circle cx="147" cy="91" r="2"/></g>
          <path d="M140 65 L100 42 H36" fill="none" stroke="#e5b88a"/><text x="34" y="34">Sunlit peaks</text>
        </svg>
        <p>Galileo saw bright specks on the dark side near the day–night boundary. Mountain peaks catch sunlight before the valleys below, just as on Earth at sunrise. Shadows and bright peaks pointed to a rough lunar surface.</p>
        <p>He also explained <strong>earthshine</strong>: sunlight bouncing off Earth faintly lights the Moon’s night side.</p>
      </section>
      <section><h3>Four moons around Jupiter</h3>
        <svg viewBox="0 0 320 145" role="img" aria-label="Three schematic observations show four dots changing sides relative to Jupiter">
          ${[[84,119,180,232],[97,131,141,217],[63,174,201,244]].map((dots,i)=>`<text x="12" y="${33+i*42}">Night ${i+1}</text><circle cx="158" cy="${29+i*42}" r="7" fill="#f0bc80"/>${dots.map(x=>`<circle cx="${x}" cy="${29+i*42}" r="2.5" fill="#9cd3ff"/>`).join('')}`).join('')}
        </svg>
        <p>On successive nights, points of light changed sides but stayed close to Jupiter. Galileo concluded that they orbited Jupiter. We now call them Io, Europa, Ganymede, and Callisto. At least one planet other than Earth could have moons.</p>
      </section>
      <section><h3>The Milky Way is full of stars</h3>
        <svg viewBox="0 0 320 145" role="img" aria-label="A faint diagonal strip of the Milky Way resolved into many points of starlight">
          <path d="M5 98 Q160 75 315 36" stroke="#5c7197" opacity=".22" stroke-width="53" fill="none"/>
          ${stars}
        </svg>
        <p>The unaided eye sees a pale band. Through a telescope Galileo resolved many individual stars. He also drew groups of stars in the Pleiades and in Orion that were too faint to see unaided.</p>
      </section>
    </div>
    <p>Illustrations are teaching diagrams. See the <a href="https://library.si.edu/digital-library/book/sidereusnuncius00gali">1610 edition at the Smithsonian</a> and <a href="https://digital.archives.caltech.edu/collections/Images/RB-GG1610a-4/">Galileo’s lunar plates at Caltech</a>.</p>
    <p>Jupiter’s moons fit naturally with Copernicus’s moving Earth, and they also fit Tycho Brahe’s model with a stationary Earth. Galileo’s later observations of the phases of Venus ruled out the classic Ptolemaic arrangement of Venus. Those observations came after this book.</p>
    </article>
    <article class="lab-card"><h2>The sky was already changing</h2>
    <p>In Aristotelian cosmology, the realm beyond the Moon was supposed to be unchanging and incorruptible. Then observers saw bright new points among the familiar stars.</p>
    <div class="galileo-timeline">
      <section><h3>1572 · Tycho’s new star</h3><p>A new light appeared in Cassiopeia. Tycho Brahe looked for parallax, the change in its position that would give away a nearby object. He found no measurable shift and placed it beyond the Moon.</p></section>
      <section><h3>1604 · Kepler’s new star</h3><p>Another bright point appeared in Ophiuchus. Johannes Kepler studied it, and Galileo gave public lectures about it in Padua. Today we know both events were supernovae, explosions of stars.</p></section>
      <section><h3>1610 · Galileo publishes</h3><p>The new stars had already challenged the idea that the heavens never changed. Galileo’s telescope added evidence from the Moon’s landscape and Jupiter’s moving satellites.</p></section>
    </div>
    <p>Sources <a href="https://science.nasa.gov/image-article/apod-1999-may-30-tycho-brahe-measures-the-sky/">NASA on Tycho</a> and <a href="https://brunelleschi.imss.fi.it/itinerari/itinerario/CronologiaGalileo.html">Museo Galileo’s chronology</a>.</p>
    </article></div>`;
  return ()=>{};
}

const labs={analemma,sky:skyLab,stars:starLab,birth:mountBirth,doppler:dopplerLab,dark:darkLab,measure:measureLab,'light-speed':lightSpeedLab,'black-hole':mountBlackHole,planets:mountPlanets,retrograde:retrogradeLab,galileo:galileoLab,astrology:mountAstrology};
export function mountLab(root,key,api,year){
  return labs[key](root,api,year);
}
