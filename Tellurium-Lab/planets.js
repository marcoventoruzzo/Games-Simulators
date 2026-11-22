import {canvasContext} from './scene.js';

const picture=name=>new URL('./assets/'+name+'.webp',import.meta.url).href;
const labels=['Orbital period','Rotation period','Mean orbital speed','Mean distance from the Sun','Axial tilt','Mean temperature','Day–night temperature range','Seasons?','Seasonal temperature range','Surface pressure','Gravity','Atmosphere','Magnetic field','Three constituents shown'];
const planets=[
 ['Mercury','#a9a6a3',.24,['88 days','58.6 days','172,000 km/h','0.39 AU · 57.9 million km','0.03°','167 °C','−180 to +430 °C','No','—','≈ 0 atm','0.38 g','Thin exosphere','Weak','Oxygen, sodium, hydrogen']],
 ['Venus','#f4c168',.62,['224.7 days','243 days · retrograde','126,000 km/h','0.72 AU · 108.2 million km','177°','464 °C','≈ 10 °C','No','≈ 5 °C','92 atm','0.91 g','Very dense CO₂; sulfuric acid clouds','Induced field','CO₂, N₂, SO₂']],
 ['Earth','#68adff',1,['365.25 days','23 h 56 min','107,000 km/h','1.00 AU · 149.6 million km','23.44°','15 °C','10–40 °C typically','Yes','≈ 20 °C','1 atm','1.00 g','Nitrogen, oxygen and other gases','Strong','N₂, O₂, Ar']],
 ['Mars','#fa9369',1.88,['687 days','24 h 37 min','86,900 km/h','1.52 AU · 227.9 million km','25.19°','−63 °C','−140 to +20 °C','Moderate','≈ 30 °C','0.006 atm','0.38 g','Thin, mostly CO₂','Weak crustal remnants','CO₂, N₂, Ar']],
 ['Jupiter','#ebbb9a',11.86,['11.86 years','9 h 56 min','47,000 km/h','5.20 AU · 778.5 million km','3.13°','−110 °C','Small','Mild','≈ 5 °C','No solid surface','2.53 g','Extensive','Very strong','H₂, He, CH₄']],
 ['Saturn','#ffe1a2',29.46,['29.45 years','10 h 33 min','34,700 km/h','9.58 AU · 1.43 billion km','26.73°','−140 °C','Small','Mild','≈ 5–10 °C','No solid surface','1.07 g','Extensive','Strong','H₂, He, CH₄']],
 ['Uranus','#9ce6e4',84.01,['84 years','17 h 14 min · retrograde','24,500 km/h','19.2 AU · 2.87 billion km','97.8°','−195 °C','Very small','Extreme','≈ 40 °C','No solid surface','0.89 g','Present','Strong, tilted and off-center','H₂, He, CH₄']],
 ['Neptune','#728eff',164.79,['164.8 years','16 h 6 min','19,500 km/h','30.1 AU · 4.50 billion km','28.3°','−200 °C','Very small','Extreme','≈ 40 °C','No solid surface','1.14 g','Present','Strong and tilted','H₂, He, CH₄']]
];

export function mountPlanets(root){
  root.innerHTML=`<article class="lab-card planet-lab"><h2>Planets in our Solar system</h2>
    <p>Pick a planet to open its data card. Orbital sizes and planet sizes are illustrative. The faster motions of the inner planets are based on the orbital periods.</p>
    <div class="lab-actions"><button data-flip>Flip to the planet table</button><button data-pause>Pause orbits</button></div>
    <div class="slate"><div class="slate-inner">
      <div class="slate-face slate-front"><div class="planet-orbit"><canvas aria-label="Animated diagram of the eight planets orbiting the Sun"></canvas>
      ${planets.map(([name,color],i)=>`<button data-planet="${i}" title="${name}" aria-label="${name}" style="--planet:${color}"></button>`).join('')}</div>
      <div class="lab-actions planet-key">${planets.map(([name],i)=>`<button data-planet="${i}">${name}</button>`).join('')}</div>
      <section class="planet-info" hidden aria-labelledby="planet-name"><div class="planet-info-head"><h3 id="planet-name"></h3><button data-close aria-label="Close planet information">×</button></div><dl></dl></section>
      </div>
      <div class="slate-face slate-back" inert><img src="${picture('planet-table')}" alt="Original Italian infographic with a side-by-side comparison of all eight planets and Kepler’s laws">
      <details><summary>Distance and orbital period · Kepler’s third law</summary><img src="${picture('planet-kepler')}" alt="Original Italian infographic plotting orbital period against distance on logarithmic axes"></details></div>
    </div></div>
    <p>The reverse shows your original table. The cards translate its values. Seasonal and day–night ranges are illustrative and depend on location, altitude and measurement method. Giant-planet temperatures and gravity refer to atmospheric reference levels.</p>
  </article>`;
  const canvas=root.querySelector('canvas'), panel=root.querySelector('.planet-info');
  const dots=[...root.querySelectorAll('.planet-orbit button')];
  const slate=root.querySelector('.slate'), front=root.querySelector('.slate-front'), back=root.querySelector('.slate-back');
  const pause=root.querySelector('[data-pause]');
  let flipped=false,running=!matchMedia('(prefers-reduced-motion: reduce)').matches, frame=0,last=0,years=0;
  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,x=w/2,y=h/2;
    c.fillStyle='#080e1c';c.fillRect(0,0,w,h);
    for(let i=0;i<80;i++){
      c.fillStyle='#bdcfff67';c.fillRect((i*137.3%100)*w/100,(i*67.7%100)*h/100,1,1);
    }
    const radius=Math.min(w*.445,h*.45);
    c.fillStyle='#ffce79';c.shadowColor='#ffb45d';c.shadowBlur=23;
    c.beginPath();c.arc(x,y,Math.max(8,radius*.055),0,Math.PI*2);c.fill();c.shadowBlur=0;
    dots.forEach((button,i)=>{
      const r=radius*(.17+i*.115), a=i*1.7+years*Math.PI*2/planets[i][2];
      c.beginPath();c.ellipse(x,y,r,r*.77,0,0,Math.PI*2);c.strokeStyle='#58749e60';c.stroke();
      button.style.left=(x+r*Math.cos(a))+'px';button.style.top=(y-r*.77*Math.sin(a))+'px';
      button.style.setProperty('--disc',([8,11,12,10,19,17,14,14][i])+'px');
    });
  }
  function tick(now){
    if(last)years+=Math.min(50,now-last)/5000;
    last=now;draw();frame=requestAnimationFrame(tick);
  }
  function update(){
    cancelAnimationFrame(frame);last=0;
    pause.textContent=running?'Pause orbits':'Play orbits';pause.disabled=flipped;
    if(running&&!flipped)frame=requestAnimationFrame(tick);
    else if(!flipped)draw();
  }
  pause.onclick=()=>{running=!running;update();};
  root.querySelector('[data-flip]').onclick=event=>{
    flipped=!flipped;slate.classList.toggle('flipped',flipped);
    front.inert=flipped;back.inert=!flipped;
    event.currentTarget.textContent=flipped?'Flip to the Solar System':'Flip to the planet table';
    update();
  };
  let trigger;
  root.querySelectorAll('[data-planet]').forEach(button=>button.onclick=()=>{
    trigger=button;const [name,,,values]=planets[Number(button.dataset.planet)];
    panel.querySelector('h3').textContent=name;
    panel.querySelector('dl').innerHTML=labels.map((label,i)=>`<dt>${label}</dt><dd>${values[i]}</dd>`).join('');
    panel.hidden=false;panel.querySelector('[data-close]').focus({preventScroll:true});
  });
  panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;trigger?.focus({preventScroll:true});};
  const resize=new ResizeObserver(draw);resize.observe(canvas);update();
  return ()=>{resize.disconnect();cancelAnimationFrame(frame);};
}
