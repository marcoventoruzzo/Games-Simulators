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
    '<div class="lab-actions">'+select('site','Location', [['45.4642,9.1900','Milan'],['40.7128,-74.0060','New York'],['-33.8688,151.2093','Sydney']])+
    '<label>Year <input id="year" type="number" min="1900" max="2100" value="'+initialYear+'"></label><button id="go">Play</button></div>'+
    out('read')+canvas('skyview','Sun positions at mean solar noon over a south or north facing horizon',true)+
    slider('day','Day of year',0,365,0)+
    '<details><summary>Why the two lobes differ</summary><p>Earth’s axial tilt changes the Sun’s declination and contributes to the equation of time. Earth’s eccentric orbit contributes too, because its orbital speed varies. Local mean noon would only match apparent solar noon when their difference is zero.</p></details>');
  let data=[], active=true, generation=0;
  const draw=()=>{
    const env=canvasContext($(root,'skyview'));if(!env)return;
    const {ctx:c,w,h}=env, south=+$(root,'site').value.split(',')[0]>0;
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
    const i=+$(root,'day').value,d=data[i]||data[0];
    shot(c,x(d[1]),y(d[2]),8,true);
    $(root,'read').textContent=d[0]+' · mean solar noon · '+d[2].toFixed(1)+'° altitude · '+d[1].toFixed(1)+'° azimuth';
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
    '<p>Air molecules redirect sunlight in many directions. This is <strong>Rayleigh scattering</strong>. For visible light, shorter wavelengths scatter much more strongly than longer ones. The scattered light reaches your eyes from across the sky.</p>'+
    slider('wave','Follow one wavelength',400,700,450)+out('scatter')+
    canvas('rays','Direct beam and light scattered by air molecules')+
    '<details><summary>Compare with diffraction</summary><p>A diffraction grating has regularly spaced grooves. Waves from the grooves reinforce each other at particular angles. In the first order, red bends through a larger angle than blue. Air molecules scatter light without this regular pattern.</p>'+
    canvas('grating','A diffraction grating separates blue, green and red into different angles')+'</details>'+
    '<details><summary>Why blue rather than violet?</summary><p>Violet scatters even more strongly. The color we see is the sum of the spectrum and the response of our eyes, which are much less sensitive to violet.</p></details>')+
    card('Why is sunset light warmer?',
    '<p>A low Sun shines through more air. Much of the blue is scattered out of the direct beam before it reaches us, leaving more red and orange. Haze and clouds can soften shadows by adding diffuse light. A low Sun also produces longer shadows.</p>'+
    slider('alt','Sun’s height above the horizon',3,85,10)+out('air')+canvas('sunset','The direct spectrum after a shorter or longer path through the atmosphere'))+
    card('What color is the Sun from space?',
    '<p><strong>White to human eyes.</strong> The Sun emits across the visible spectrum. Those wavelengths combine to make nearly white light outside the atmosphere. Through air its direct light can look warmer, especially at low elevation. A white disk represents the combined light.</p>'+
    '<div class="spectrum-white" aria-label="Visible wavelengths combine to give white light"><span></span><b aria-label="White Sun"></b></div>')+'</div>';
  return attach(root,()=>{
    const wave=+$(root,'wave').value, strength=(550/wave)**4;
    $(root,'scatter').textContent=wave+' nm · '+strength.toFixed(2)+'× the scattering at 550 nm';
    const env=canvasContext($(root,'rays'));
    if(env){
      const {ctx:c,w,h}=env,y=h*.48; background(c,w,h);
      const col=waveColor(wave);
      line(c,[w*.07,y],[w*.93,y],col,3);
      for(let i=0;i<6;i++){
        const x=w*(.24+i*.10), drift=(i%2?1:-1)*(0.3+(i%3)*.15);
        dot(c,x,y,4,'#e7f0ff');
        for(const sign of [-1,1]){
          c.globalAlpha=Math.min(.94,.23+strength*.25);
          line(c,[x,y],[x+w*drift*.24,y+sign*h*.25],col,Math.min(4,1+strength));
          c.globalAlpha=1;
        }
      }
      text(c,'Incoming sunlight',w*.20,23,muted);text(c,'Scattered in many directions',w*.65,h*.89,col);
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
      const warmth=air>3?'#ff9b68':'#ffe6bb';
      line(c,start,[x,y],warmth,3);shot(c,...start,7);
      for(const o of [-.08,0,.08])line(c,[x-w*.09+o*w,h*.46],[x,y],'#91c1ff4d',1.4);
      dot(c,x,y,3,ink);
      text(c,'Diffuse sky light',w*.69,h*.43,cyan);
      text(c,'Atmosphere',w*.23,h*.69,cyan);
      const x0=w*.15, sw=w*.70/140;
      for(let i=0;i<140;i++){
        const nm=400+i*2.1;
        c.globalAlpha=Math.exp(-.10*(550/nm)**4*air);
        c.fillStyle=waveColor(nm);c.fillRect(x0+i*sw,h*.85,sw+1,16);
      }
      c.globalAlpha=1;text(c,'Direct light reaching the observer',w*.5,h*.98,muted);
    }
  });
}

const tracks={
  dwarf:{name:'Red dwarf · 0.2 solar masses',stages:[
    [3900,-1,'Protostar','A cloud fragment collapses under gravity.'],
    [3200,-2.4,'Red dwarf','Hydrogen fuses slowly. A small star can shine for trillions of years.'],
    [4600,-1.8,'Late evolution','Models predict hotter late stages. The universe is too young for these stars to have reached them.'],
    [12000,-3,'White dwarf','A compact remnant eventually cools. This is a theoretical future for a star this small.']]},
  sun:{name:'Sun-like · 1 solar mass',stages:[
    [4200,.35,'Protostar','Gravity heats a collapsing cloud.'],
    [5772,0,'Main sequence','Hydrogen fusion powers the Sun. It is about halfway through this stage.'],
    [3700,2.9,'Red giant','The core contracts while the outer layers expand and cool.'],
    [90000,3,'Exposed hot core','The star sheds gas. Ultraviolet light from the core can make the gas glow as a planetary nebula.'],
    [18000,-2,'White dwarf','An Earth-sized remnant supported by electron degeneracy pressure slowly cools.']]},
  neutron:{name:'Massive example · 12 solar masses',stages:[
    [8500,2,'Protostar','A massive cloud core collapses.'],
    [24500,4.2,'Hot main-sequence star','The large core burns fuel rapidly.'],
    [3650,4.7,'Red supergiant','Successive fusion stages build heavier elements in the core.'],
    [null,null,'Core collapse → neutron star','After core collapse and a possible supernova, a remnant roughly the size of a city can remain, made mostly of densely packed neutrons.']]},
  hole:{name:'Very massive example · 35 solar masses',stages:[
    [12000,3,'Protostar','A large amount of gas falls into the growing star.'],
    [39000,5.4,'Hot main-sequence star','Powerful radiation and stellar winds can strip much of the star’s mass.'],
    [55000,5.55,'Hot stripped star','Winds or a companion can remove outer layers. Other massive stars become supergiants instead.'],
    [null,null,'Core collapse → black hole','In this example the core collapses far enough to form an event horizon. A bright supernova may occur, or collapse may be faint.']]}
};
const starExamples=[
 ['Sun ☉',5772,0,'#ffe2a5',9,-9],['Proxima Centauri',3050,-2.8,'#ff967b',-7,-10],
 ['Sirius A',9940,1.4,'#b6d9ff',8,-9],['Betelgeuse',3600,5.0,'#ff9a7b',-7,-9],
 ['Sirius B',25000,-1.6,'#d4ecff',8,13]
];
function starLab(root){
  root.innerHTML=card('How stars grow and die',
    '<p>The Hertzsprung–Russell diagram compares temperature and luminosity. Hotter is to the left. Higher means more total energy emitted per second. Choose an initial mass and trace a representative life.</p>'+
    '<div class="lab-actions">'+select('track','Star model',Object.entries(tracks).map(([k,v])=>[k,v.name]))+
    '<button id="go">Play</button></div>'+out('stage')+canvas('hr','Hertzsprung–Russell diagram with stellar evolution tracks and five example stars',true)+slider('step','Evolution stage',0,4,0)+
    '<p id="story" aria-live="polite"></p><details><summary>Reading the tracks</summary><p>These are representative waypoints, with temperature and luminosity on logarithmic scales. The animation gives each stage equal screen time. Stellar masses, composition, mass loss and binary interaction affect the outcome. Neutron stars and black holes sit outside this ordinary photosphere diagram.</p></details>');
  $(root,'track').value='sun';
  const draw=()=>{
    const t=tracks[$(root,'track').value].stages, i=Math.min(+$(root,'step').value,t.length-1);
    const [temp,lum,name,story]=t[i];
    $(root,'step').max=t.length-1;
    $(root,'stage').textContent=(i+1)+' / '+t.length+' · '+name;
    $(root,'story').textContent=story;
    const env=canvasContext($(root,'hr'));if(!env)return;
    const {ctx:c,w,h}=env;
    const left=49,right=w-26,top=25,bottom=h-44;
    const x=v=>left+(Math.log10(100000)-Math.log10(v))/(5-Math.log10(2500))*(right-left);
    const y=v=>top+(6-v)/10*(bottom-top);
    background(c,w,h);
    for(const k of [-4,-2,0,2,4,6]){
      line(c,[left,y(k)],[right,y(k)]);text(c,'10^'+k,left-6,y(k)+4,muted,'right');
    }
    const ticks=w<520?[100000,20000,6000,2500]:[100000,30000,10000,6000,4000,2500];
    for(const k of ticks){
      line(c,[x(k),top],[x(k),bottom]);text(c,k.toLocaleString('en-US'),x(k),bottom+17,muted);
    }
    text(c,'Surface temperature (K)',w*.55,h-7,ink);
    text(c,'Luminosity (Sun = 1)',left,15,ink,'left');
    path(c,[[38000,5.3],[22000,4],[10000,1.6],[5772,0],[3900,-1.25],[2800,-3.4]].map(([v,l])=>[x(v),y(l)]),'#7594c367',12);
    text(c,'Main sequence',x(12500),y(2.5)+16,muted);
    const points=t.filter(s=>s[0]!==null);
    path(c,points.map(([v,l])=>[x(v),y(l)]),'#91a8ce',1.4);
    path(c,t.slice(0,i+1).filter(s=>s[0]!==null).map(([v,l])=>[x(v),y(l)]),gold,2.6);
    for(const [n,v,l,col,dx,dy] of starExamples){
      dot(c,x(v),y(l),3.6,col);text(c,n,x(v)+dx,y(l)+dy,col,dx<0?'right':'left');
    }
    if(temp!==null)shot(c,x(temp),y(lum),5,true);
    else text(c,name,w*.53,y(-3.6),gold);
  };
  const detach=attach(root,draw);
  const play=clock($(root,'go'),()=>{
    if(++frame%10)return;
    const input=$(root,'step');input.value=(+input.value+1)%(+input.max+1);draw();
  });
  let frame=0;
  $(root,'track').onchange=()=>{$(root,'step').value=0;draw();};
  return ()=>{play();detach();};
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
    slider('velocity','Speed along the line of sight (km/s)',-30000,30000,12000,100)+out('doppler-read')+
    canvas('spectrum','Rest-frame and Doppler-shifted hydrogen absorption spectra')+
    '<details><summary>What this does and does not measure</summary><p>The shift measures radial velocity. Sideways motion requires tracking position across the sky. This simulation uses the relativistic Doppler formula for radial motion. Speeds are deliberately large so the shift is easy to see. Over cosmological distances, expansion also stretches wavelengths, and a single special-relativistic velocity is generally the wrong interpretation.</p></details>');
  return attach(root,()=>{
    const v=+$(root,'velocity').value,b=v/299792.458, factor=Math.sqrt((1+b)/(1-b));
    $(root,'doppler-read').textContent=(v===0?'No radial motion':Math.abs(v).toLocaleString('en-US')+' km/s '+(v>0?'away · redshift':'toward us · blueshift'))+
      ' · Hα '+hydrogen.at(-1).toFixed(2)+' → '+(hydrogen.at(-1)*factor).toFixed(2)+' nm';
    const env=canvasContext($(root,'spectrum'));
    if(env)spectrum(env.ctx,env.w,env.h,[{label:'Laboratory · hydrogen',lines:hydrogen},
      {label:'Observed star',lines:hydrogen.map(n=>n*factor)}],350,780);
  });
}

function darkLab(root){
  root.innerHTML=card('Why is the night sky dark?',
    '<p>This is <strong>Olbers’ paradox</strong>. In an eternal, static universe filled uniformly with shining stars, each layer contains more stars in proportion to distance squared. Each one is fainter by the same factor. Add layers and the sky would eventually be covered by stellar surfaces.</p>'+
    '<div class="lab-actions">'+select('universe','Universe', [['real','Finite history · expanding'],['static','Eternal · static']])+'</div>'+
    slider('shells','Layers of distance included',1,18,12)+out('dark-read')+canvas('shellview','Illustrative contributions to sky brightness from equally thick layers')+
    '<p>Light travels at a finite speed. Very distant light takes longer to arrive. There was an era before the first stars, so the observed sky cannot accumulate light from infinitely many layers of shining stars. Expansion also redshifts light and reduces energy arrival rates.</p>'+
    '<details><summary>What our eyes miss</summary><p>Most stars are too distant and faint to see individually with the unaided eye. The sky still glows at wavelengths we cannot see. The early universe fills the sky with the cosmic microwave background. The bars compare shell contributions before stellar disks overlap, with an illustrative horizon and fading curve.</p></details>');
  return attach(root,()=>{
    const n=+$(root,'shells').value, real=$(root,'universe').value==='real';
    const env=canvasContext($(root,'shellview'));if(!env)return;
    const {ctx:c,w,h}=env;background(c,w,h);
    const values=Array.from({length:n},(_,i)=>real?(i<9?Math.exp(-i*.18):0):1);
    const total=values.reduce((s,v)=>s+v,0);
    $(root,'dark-read').textContent='Total contribution: '+total.toFixed(1)+' illustrative units';
    const bw=(w-66)/18, base=h-43;
    line(c,[38,base],[w-24,base],muted);
    values.forEach((v,i)=>{c.fillStyle=real?cyan:gold;c.fillRect(40+bw*i,base-v*h*.53,Math.max(2,bw-4),v*h*.53);});
    text(c,'Contribution by layer',38,24,ink,'left');
    text(c,'Nearby',39,h-17,muted,'left');text(c,'More distant',w-25,h-17,muted,'right');
    if(real){
      const x=39+9*bw;line(c,[x,44],[x,base],'#ffcf8c');
      text(c,'Before stars',x+7,58,gold,'left');
    }
  });
}

function measureLab(root){
  root.innerHTML='<div class="lab-stack">'+card('Find a star’s distance by parallax',
    '<p>Observe a nearby star twice, six months apart. Earth’s two observing positions are about 2 AU apart. The star shifts against distant background stars. Half the apparent shift is the parallax angle <i>p</i>. Its distance in parsecs is <strong>1 ÷ p</strong>, when <i>p</i> is in arcseconds.</p>'+
    slider('distance','Model distance (parsecs)',1,50,5)+out('parallax')+
    canvas('triangle','Two sightings from opposite sides of Earth’s orbit and the parallax half angle')+
    '<p>The triangle uses a 1 AU half-baseline and shows the angle greatly enlarged. One parsec is about 3.26 light-years. For more distant targets, astronomers can use calibrated luminosities, including Cepheid variables.</p>')+
    card('Identify the elements in a star',
    '<p><strong>Visible-light absorption spectroscopy</strong> splits starlight into wavelengths with a spectrograph. Atoms in a stellar atmosphere absorb specific wavelengths. Match several lines to a laboratory pattern. A hot thin gas can emit bright lines at the same wavelengths.</p>'+
    '<div class="lab-actions">'+select('element','Element / ion',[['h','Hydrogen'],['na','Neutral sodium'],['ca','Ionized calcium']])+select('kind','Spectrum',[['abs','Absorption'],['em','Emission']])+'</div>'+
    out('chem-read')+canvas('chemical','Laboratory spectral fingerprint compared with stellar absorption or gas emission')+
    '<details><summary>What line strengths tell us</summary><p>Abundances come from fitting line strengths and profiles with model atmospheres. Temperature, ionization, density and blends affect the lines. Astronomers also correct for Doppler shifts before matching wavelengths.</p></details>')+'</div>';
  return attach(root,()=>{
    const d=+$(root,'distance').value;
    $(root,'parallax').textContent=d+' pc · '+(d*3.26156).toFixed(1)+' light-years · p = '+(1/d).toFixed(3)+' arcsec';
    const env=canvasContext($(root,'triangle'));
    if(env){
      const {ctx:c,w,h}=env;background(c,w,h);
      const cx=w/2, y0=h*.79, sy=h*(.14+.33*Math.exp(-d/10)), baseline=w*.26;
      const star=[cx,sy],west=[cx-baseline,y0],east=[cx+baseline,y0];
      const ry=h*.10, dis=baseline*(sy-ry)/(y0-sy);
      line(c,west,[cx+dis,ry],cyan,1.7);line(c,east,[cx-dis,ry],'#c5a4ff',1.7);
      line(c,[cx,sy+4],[cx,y0],'#a6b9d680');
      line(c,west,east,muted);
      for(const side of [west,east])dot(c,...side,5,cyan);
      shot(c,...star,5,true);
      text(c,'Nearby star',cx,sy+21,ink);
      text(c,'Epoch 1',west[0],y0+21,cyan);
      text(c,'Epoch 2',east[0],y0+21,'#c5a4ff');
      text(c,'Sun',cx,y0+21,gold);
      dot(c,cx,y0,4,gold);
      text(c,'1 AU',cx-baseline*.5,y0+18,muted);
      text(c,'1 AU',cx+baseline*.5,y0+18,muted);
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

const labs={analemma,sky:skyLab,stars:starLab,doppler:dopplerLab,dark:darkLab,measure:measureLab};
export function mountLab(root,key,api,year){
  return labs[key](root,api,year);
}
