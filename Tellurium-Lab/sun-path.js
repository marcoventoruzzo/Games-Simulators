const radians=Math.PI/180;
const cities=[
  {name:'New York',place:'United States',latitude:40.71},
  {name:'Kampala',place:'Uganda · near the equator',latitude:.35},
  {name:'Rio de Janeiro',place:'Brazil',latitude:-22.91}
];
const seasons=[
  {name:'June solstice',declination:23.44,color:'#ffd184',dash:''},
  {name:'March and September equinoxes',declination:0,color:'#91dcff',dash:'7 4'},
  {name:'December solstice',declination:-23.44,color:'#c9a8ff',dash:'2 4'}
];

function sunPosition(latitude,declination,hourAngle){
  const east=-Math.cos(declination)*Math.sin(hourAngle);
  const north=Math.cos(latitude)*Math.sin(declination)-Math.sin(latitude)*Math.cos(declination)*Math.cos(hourAngle);
  const up=Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination)*Math.cos(hourAngle);
  return {azimuth:(Math.atan2(east,north)/radians+360)%360,altitude:Math.asin(up)/radians};
}

function seasonalArcs(latitude,west){
  const lat=latitude*radians;
  const project=({azimuth,altitude})=>{
    // Due north on the west-facing sky is 360°, even at exact solar noon.
    const bearing=west&&azimuth<1e-8?360:azimuth;
    return [34+(bearing-(west?180:0))*1.58,186-Math.max(0,altitude)*1.78];
  };
  return seasons.map(season=>{
    const dec=season.declination*radians;
    const horizon=Math.acos(-Math.tan(lat)*Math.tan(dec));
    const at=frac=>sunPosition(lat,dec,horizon*(west?frac:frac-1));
    const points=Array.from({length:101},(_,i)=>project(at(i/100)));
    return {...season,points,sun:project(at(west?.94:.06)),noon:at(west?0:1).altitude};
  });
}

function localSeason(city,index){
  if(index===1||city.name==='Kampala')return '';
  return (index===0)===(city.latitude>0)?' · summer':' · winter';
}

function pathStroke({color,dash}){
  return `stroke="${color}" stroke-width="2.3" stroke-dasharray="${dash}" stroke-linecap="round"`;
}

function cityPanel(city,west){
  const arcs=seasonalArcs(city.latitude,west);
  const headings=west?['S','W','N']:['N','E','S'];
  const grid=[30,60,90].map(alt=>{
    const y=186-alt*1.78;
    return `<path d="M34 ${y}H319" stroke="#2a3d55"/><text x="29" y="${y+4}" text-anchor="end">${alt}°</text>`;
  }).join('');
  const curves=arcs.map(({points,color,dash,sun})=>`
    <polyline points="${points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')}" fill="none" ${pathStroke({color,dash})}/>
    <circle cx="${sun[0]}" cy="${sun[1]}" r="5" fill="${color}" stroke="#14243a" stroke-width="1.4"/>`).join('');
  const readings=arcs.map((arc,index)=>`
    <dt><svg class="sun-path-sample" viewBox="0 0 30 10" aria-hidden="true"><path d="M2 5H28" ${pathStroke(arc)}/></svg>
      <span>${index===1?'Both equinoxes':arc.name}${localSeason(city,index)}</span></dt>
    <dd>${arc.noon.toFixed(1)}°</dd>`).join('');
  const lat=`${Math.abs(city.latitude).toFixed(2)}° ${city.latitude>0?'N':'S'}`;
  return `<section class="sun-path-city">
    <h3>${city.name}</h3><small>${city.place} · ${lat}</small>
    <svg viewBox="0 0 352 218" role="img" aria-label="${city.name}: ${west?'solar noon to sunset':'sunrise to solar noon'}, for both solstices and the equinoxes">
      <rect x="34" y="25" width="285" height="161" rx="4" fill="#101e34"/>
      ${grid}
      ${[34,176.2,318.4].map(x=>`<path d="M${x} 25V186" stroke="#2a3d55" stroke-dasharray="2 4"/>`).join('')}
      ${curves}
      <path d="M34 186H319" stroke="#92a7bd" stroke-width="1.5"/>
      <text x="29" y="190" text-anchor="end">0°</text>
      ${headings.map((heading,i)=>`<text x="${34+i*142.2}" y="205" text-anchor="middle">${heading}</text>`).join('')}
    </svg>
    <strong>Sun’s height at solar noon</strong>
    <dl>${readings}</dl>
  </section>`;
}

export function mountSunPath(root){
  root.innerHTML=`<article class="lab-card">
    <h2>The Path of the Sun in the Sky</h2>
    <p>Does the Sun always rise due east? Compare three places on the same days of the year. The bottom line is the horizon. The numbers show how high to look, from 0° at the horizon to 90° straight overhead.</p>
    <div class="sun-path-controls" role="group" aria-label="Direction of view">
      <button type="button" data-face="east" aria-pressed="true">Face east · sunrise to noon</button>
      <button type="button" data-face="west" aria-pressed="false">Face west · noon to sunset</button>
    </div>
    <p data-sun-guide></p>
    <div class="sun-path-grid"></div>
    <div class="sun-path-explanation"><p><strong>What changes?</strong> At the equinoxes the Sun rises due east and sets due west. In June it rises north of east and sets north of west. In December both points shift south. June brings the higher noon Sun to New York and the lower one to Rio. Near the equator in Kampala, the noon Sun is nearly overhead at the equinoxes and switches sides of the sky between the solstices.</p>
      <button type="button" class="sun-path-learn" data-sun-learn aria-haspopup="dialog">Let me understand better</button>
    </div>
    <dialog class="sun-path-dialog" aria-label="Where does the Sun set?">
      <form method="dialog"><button type="submit" class="sun-path-close" aria-label="Close sunset illustration" autofocus>×</button></form>
      <img src="assets/solstice-sunsets.webp" width="1920" height="960" alt="At 50° north, the summer solstice Sun sets north of west and the winter solstice Sun sets south of west. The diagram shows Earth’s tilt and the observer’s line of sight at both solstices.">
    </dialog>
    <p class="fine">The curves use a flat, unobstructed horizon and omit atmospheric refraction. Solar noon is when the Sun reaches its highest point that day.</p>
  </article>`;
  const buttons=[...root.querySelectorAll('[data-face]')];
  const dialog=root.querySelector('.sun-path-dialog');
  root.querySelector('[data-sun-learn]').onclick=()=>dialog.showModal();
  function show(west){
    buttons.forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.face==='west')===west)));
    root.querySelector('[data-sun-guide]').textContent=west
      ? 'Trace each curve downhill from solar noon. The small Sun marks a spot just before sunset.'
      : 'Trace each curve uphill from the horizon. The small Sun marks a spot just after sunrise.';
    root.querySelector('.sun-path-grid').innerHTML=cities.map(city=>cityPanel(city,west)).join('');
  }
  buttons.forEach(button=>button.onclick=()=>show(button.dataset.face==='west'));
  show(false);
  return ()=>{if(dialog.open)dialog.close()};
}
