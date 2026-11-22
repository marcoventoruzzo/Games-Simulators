import {canvasContext} from './scene.js';


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

const sunRows=[
 ['Type','G2 V main-sequence star, often called a yellow dwarf'],
 ['Age','About 4.6 billion years'],
 ['Diameter','About 1.39 million km, or 109 Earth diameters'],
 ['Mass','About 333,000 Earth masses'],
 ['Visible surface temperature','About 5,500 °C'],
 ['Main ingredients','Hydrogen and helium'],
 ['Power source','Hydrogen fusion in its core'],
 ['Future','In roughly 5 billion years the Sun will begin evolving into a red giant. It will shed its outer layers and leave a white dwarf that slowly cools.']
];
const tableLabels=['Revolution around the Sun<br>Time to complete one orbit','Rotation on its axis<br>Sidereal rotation period','Average orbital speed<br>Around the Sun','Average distance from the Sun<br>1 AU ≈ 149.6 million km','Axial tilt<br>Relative to the orbital normal','Average temperature<br>Surface or upper atmosphere','Day–night temperature range<br>Typical difference','Does it have seasons?<br>Seasonal changes','Seasonal temperature range<br>Average difference','Surface pressure<br>Relative to Earth','Surface gravity<br>Relative to Earth','Atmosphere<br>Is it present?','Magnetic field<br>Is it present?','Three main atmospheric constituents shown'];
function keplerGraph(){
  const distances=[.39,.72,1,1.52,5.20,9.58,19.22,30.07];
  const x=d=>67+Math.log10(d/.1)*166;
  const y=t=>284-Math.log10(t/.01)*50;
  return `<details><summary>Distance and orbital period · Kepler’s third law</summary>
    <svg class="kepler-graph" viewBox="0 0 610 330" role="img" aria-label="Logarithmic graph of distance and orbital period for all eight planets">
    ${[.1,1,10,100].map(v=>`<path d="M${x(v)} 30V284" stroke="#465673"/><text x="${x(v)}" y="303" text-anchor="middle">${v}</text>`).join('')}
    ${[.01,.1,1,10,100,1000].map(v=>`<path d="M67 ${y(v)}H565" stroke="#465673"/><text x="60" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}
    <path d="M${x(.1)} ${y(.1**1.5)}L${x(100)} ${y(100**1.5)}" stroke="#ddd9a8" stroke-dasharray="4 4"/>
    ${planets.map(([name,color,period],i)=>`<circle cx="${x(distances[i])}" cy="${y(period)}" r="5" fill="${color}"/><text x="${x(distances[i])+8}" y="${y(period)+4}">${name}</text>`).join('')}
    <text x="316" y="324" text-anchor="middle">Average distance from the Sun (AU)</text>
    <text transform="translate(17 155) rotate(-90)" text-anchor="middle">Orbital period (Earth years)</text></svg>
    <p>Both axes are logarithmic. The dashed line shows the approximate T² ∝ a³ relationship for orbits around the Sun.</p></details>`;
}
function comparisonTable(){
  return `<h3 class="planet-table-title">The Planets of the Solar System</h3>
  <div class="planet-table-scroll"><table class="planet-table"><thead><tr><th scope="col">Property</th>${planets.map(([name,color])=>`<th scope="col" style="--planet:${color}"><span class="planet-swatch"></span>${name}</th>`).join('')}</tr></thead>
  <tbody>${tableLabels.map((label,i)=>`<tr><th scope="row">${label}</th>${planets.map(([,color,,values])=>`<td style="--planet:${color}">${values[i]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <section class="planet-laws"><h3>Kepler’s Laws · How Planets Move</h3><div class="lab-rows">
  <p><strong>1 · Orbits</strong><br>Each planet moves in an ellipse with the Sun at one focus.</p>
  <p><strong>2 · Areas</strong><br>The line from the Sun to the planet sweeps out equal areas in equal times.</p>
  <p><strong>3 · Periods</strong><br>The square of the orbital period is proportional to the cube of the orbit’s semimajor axis. <strong>T² ∝ a³</strong>.</p></div></section>${keplerGraph()}`;
}

export function mountPlanets(root){
  root.innerHTML=`<article class="lab-card planet-lab"><h2>Planets in our Solar system</h2>
    <p>Pick the Sun or a planet to open its data card. Orbital sizes and planet sizes are illustrative. The faster motions of the inner planets are based on the orbital periods.</p>
    <div class="lab-actions"><button data-flip>Flip to the planet table</button><button data-pause>Pause orbits</button></div>
    <div class="slate"><div class="slate-inner">
      <div class="slate-face slate-front"><div class="planet-orbit"><canvas aria-label="Animated diagram of the eight planets orbiting the Sun, with the Main Asteroid Belt between Mars and Jupiter and the Kuiper Belt beyond Neptune"></canvas>
      <button data-planet="sun" title="Sun" aria-label="Sun" class="orbit-sun"></button>
      ${planets.map(([name,color],i)=>`<button data-planet="${i}" title="${name}" aria-label="${name}" style="--planet:${color}"></button>`).join('')}</div>
      <div class="lab-actions planet-key"><button data-planet="sun">Sun</button>${planets.map(([name],i)=>`<button data-planet="${i}">${name}</button>`).join('')}</div>
      <section class="planet-info" hidden aria-labelledby="planet-name"><div class="planet-info-head"><h3 id="planet-name"></h3><button data-close aria-label="Close planet information">×</button></div><dl></dl></section>
      </div>
      <div class="slate-face slate-back" inert>${comparisonTable()}</div>
    </div></div>
    <p>The <strong>Main Asteroid Belt</strong> lies between Mars and Jupiter. Beyond Neptune, the <strong>Kuiper Belt</strong> is home to icy bodies, including Pluto.</p>
    <p>The reverse reproduces the comparison in English, with the same planet order and measurements. Seasonal and day–night ranges are illustrative and depend on location, altitude and measurement method. Giant-planet temperatures and gravity refer to atmospheric reference levels.</p>
  </article>`;
  const canvas=root.querySelector('canvas'), panel=root.querySelector('.planet-info');
  const dots=[...root.querySelectorAll('.planet-orbit button:not(.orbit-sun)')];
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
    const radius=Math.min(w*.405,h*.42);
    const belts=[
      {name:'Main Asteroid Belt', inner:.544, outer:.598, color:'#e3b57b', angle:-.72, count:160},
      {name:'Kuiper Belt', inner:1.025, outer:1.17, color:'#83cde5', angle:1.08, count:320}
    ];
    for(const {inner,outer,color,count} of belts){
      c.fillStyle=color;
      for(let i=0;i<count;i++){
        const angle=i*2.399963;
        const r=radius*(inner+(outer-inner)*((i*.618034)%1));
        c.globalAlpha=.24+(i%7)*.085;
        c.fillRect(x+r*Math.cos(angle),y+r*.77*Math.sin(angle),i%5===0?2:1,i%5===0?2:1);
      }
    }
    c.globalAlpha=1;
    c.fillStyle='#ffce79';c.shadowColor='#ffb45d';c.shadowBlur=23;
    c.beginPath();c.arc(x,y,Math.max(8,radius*.055),0,Math.PI*2);c.fill();c.shadowBlur=0;
    dots.forEach((button,i)=>{
      const r=radius*(.17+i*.115), a=i*1.7+years*Math.PI*2/planets[i][2];
      c.beginPath();c.ellipse(x,y,r,r*.77,0,0,Math.PI*2);c.strokeStyle='#58749e60';c.stroke();
      button.style.left=(x+r*Math.cos(a))+'px';button.style.top=(y-r*.77*Math.sin(a))+'px';
      button.style.setProperty('--disc',([8,11,12,10,19,17,14,14][i])+'px');
    });
    c.font='600 12px system-ui';
    c.textBaseline='middle';
    for(const {name,outer,color,angle} of belts){
      const px=x+outer*radius*Math.cos(angle),py=y+outer*radius*.77*Math.sin(angle);
      const width=c.measureText(name).width+12;
      const tx=Math.min(w-width-5,Math.max(5,px-8)),ty=py+(angle<0?-22:22);
      c.strokeStyle=color;c.beginPath();c.moveTo(px,py);c.lineTo(tx+8,ty);c.stroke();
      c.fillStyle='#080e1c';c.fillRect(tx,ty-9,width,18);
      c.fillStyle=color;c.fillText(name,tx+6,ty);
    }
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
    trigger=button;
    const isSun=button.dataset.planet==='sun';
    const [name,,,values]=isSun?['Sun',null,null,null]:planets[Number(button.dataset.planet)];
    const rows=isSun?sunRows:labels.map((label,i)=>[label,values[i]]);
    panel.querySelector('h3').textContent=name;
    panel.querySelector('dl').innerHTML=rows.map(([label,value])=>`<dt>${label}</dt><dd>${value}</dd>`).join('');
    panel.hidden=false;panel.querySelector('[data-close]').focus({preventScroll:true});
  });
  panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;trigger?.focus({preventScroll:true});};
  const resize=new ResizeObserver(draw);resize.observe(canvas);update();
  return ()=>{resize.disconnect();cancelAnimationFrame(frame);};
}
