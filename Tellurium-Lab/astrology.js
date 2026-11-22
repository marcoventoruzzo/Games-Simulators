import {canvasContext} from './scene.js';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const glyphs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const symbols={'Sun':'☉','Moon':'☽','Mercury':'☿','Venus':'♀','Mars':'♂','Jupiter':'♃','Saturn':'♄','Uranus':'♅','Neptune':'♆'};
const wrap=n=>(n%360+360)%360;
const position=lon=>signs[Math.floor(wrap(lon)/30)]+' '+(wrap(lon)%30).toFixed(1)+'°';
const signed=n=>wrap(n+180)-180;
const examples={
  elizabeth:['Elizabeth II','1926-04-21T01:40','51.5074,-0.1278'],
  kennedy:['John F. Kennedy','1917-05-29T12:00','42.3318,-71.1212'],
  jagger:['Mick Jagger','1943-07-26T12:00','51.4462,0.2169']
};
const locations='<option value="45.4642,9.19">Milan</option><option value="51.5074,-0.1278">London</option><option value="40.7128,-74.006">New York</option><option value="-33.8688,151.2093">Sydney</option><option value="42.3318,-71.1212">Brookline, Massachusetts</option><option value="51.4462,0.2169">Dartford, England</option>';
const dateField=(id,value)=>`<input id="${id}" type="datetime-local" min="1900-01-01T00:00" max="2100-12-31T23:59" value="${value}" required>`;
const blue='#99ceff', gold='#ffce92', faint='#b6c9e4';

function wheel(canvas,birth,transit){
  const env=canvasContext(canvas);if(!env||!birth)return;
  const {ctx:c,w,h}=env,x=w*.5,y=h*.51,r=Math.min(w,h)*.43;
  const point=(a,f)=>[x-Math.cos(a*Math.PI/180)*r*f,y+Math.sin(a*Math.PI/180)*r*f];
  const drawLine=(a,b,t)=>{c.strokeStyle=t;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();};
  const label=(s,p,color,size)=>{
    c.fillStyle=color;c.font='600 '+size+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(s,...p);
  };
  c.fillStyle='#0a1326';c.fillRect(0,0,w,h);
  for(const f of [1,.85,.57,.45]){
    c.beginPath();c.arc(x,y,r*f,0,Math.PI*2);c.strokeStyle='#395273';c.stroke();
  }
  const zero=birth.ascendant;
  for(let i=0;i<12;i++){
    const a=30*i-zero;
    drawLine(point(a,.85),point(a,1),'#6185a7');
    label(glyphs[i],point(a+15,.93),faint,17);
    drawLine(point(i*30,.45),point(i*30,.85),'#314862');
    label(String(i+1),point(i*30+15,.49),faint,10);
  }
  drawLine(point(0,.57),point(0,1.035),gold);
  label('ASC',point(0,1.12),gold,11);
  for(const [points,color,rad] of [[birth.points,blue,.63],[transit?.points??[],gold,.75]]){
    // Keep close labels readable by alternating bands while retaining true longitude ticks.
    const sorted=[...points].sort((a,b)=>a[1]-b[1]);
    sorted.forEach(([name,lon],i)=>{
      const a=lon-zero;
      const close=sorted.some(([,other],j)=>i!==j&&Math.abs(signed(other-lon))<11);
      drawLine(point(a,rad-.055),point(a,rad-.018),color);
      label(symbols[name],point(a,rad+(close?(i%2?.045:-.039):0)),color,15);
    });
  }
  label(transit?'Natal + transits':'Natal chart',[x,y],faint,13);
}

export function mountAstrology(root,api){
  const now=new Date().toISOString().slice(0,16);
  root.innerHTML=`<div class="lab-stack astro-lab">
    <article class="lab-card"><h2>Astrology &amp; Astronomy</h2>
    <p>Astrology interprets the positions of celestial bodies as signs about human affairs. Its predictive claims lack reliable scientific evidence. Historically, divination and calendar making helped motivate sustained observations of the sky. Astronomy grew partly out of that shared tradition, in a loose parallel with alchemy and chemistry.</p>
    <p>This is a guide to reading the symbols and the sky geometry behind them. The calculations use the Western tropical zodiac and equal houses.</p></article>
    <article class="lab-card"><h2>Make a birth chart</h2>
    <form class="lab-actions"><label>Birth time (UTC) ${dateField('astro-birth','2000-09-01T12:00')}</label><label>Birthplace <select>${locations}</select></label><button type="submit">Draw charts</button></form>
    <div class="lab-actions"><label>Famous example <select data-example><option value="">Choose a person</option>${Object.entries(examples).map(([key,[name]])=>`<option value="${key}">${name}</option>`).join('')}</select></label></div>
    <p data-example-note></p><p data-status role="status"></p>
    <div class="lab-rows"><canvas aria-label="Natal chart with twelve tropical signs, twelve equal houses, and the eastern ascendant"></canvas><div>
    <p><strong>Sun sign:</strong> the 30° sector of the ecliptic containing the Sun’s longitude. <strong>Ascendant:</strong> where the ecliptic intersects the eastern horizon at birth. The place and time set that point.</p>
    <p><strong>Houses:</strong> in this system, twelve 30° sectors starting at the ascendant. Astrology traditionally associates them with areas of life, such as self (1), home (4), and partnerships (7). Other systems draw different boundaries.</p>
    <div data-natal></div></div></div></article>
    <article class="lab-card"><h2>Read the sky for a chosen day</h2>
    <label>Transit time (UTC) ${dateField('astro-day',now)}</label>
    <p>The blue marks are the birth positions. Gold shows <strong>transits</strong>, the positions at the selected time, laid over the same birth houses. For example, “Saturn in Gemini” means Saturn’s ecliptic longitude is in the 60°–90° tropical sector.</p>
    <div class="lab-rows"><canvas aria-label="Natal chart with current planetary transit positions overlaid"></canvas><div data-transits></div></div>
    <p data-aspect></p>
    <p>Astrologers also read angular relationships called <strong>aspects</strong>. Here we check for a conjunction (0°), square (90°), or opposition (180°) within 5° of the natal Sun. These are conventions of interpretation.</p></article>
    <article class="lab-card"><h2>Why signs and constellations drift apart</h2>
    <p>The tropical zodiac starts at the March equinox and divides the ecliptic into twelve equal signs. The astronomical constellations are regions of unequal size. Earth’s axis slowly changes direction, moving the equinox westward against the stars by about 1° every 72 years. The ecliptic also crosses Ophiuchus, which is outside the twelve-sign scheme.</p>
    <p data-sun></p>
    <label>Years of precession <input type="range" min="0" max="2600" step="50" value="2000"></label>
    <p data-drift></p><canvas aria-label="Conceptual precession scale comparing the earlier and later direction of the March equinox against a fixed star background"></canvas>
    <p>The drawing fixes the star background and exaggerates the layout for readability. Between ancient times and today the offset is substantial, but a tropical Virgo’s astronomical constellation depends on the exact date.</p></article>
    </div>`;
  const q=s=>root.querySelector(s), [natalCanvas,transitCanvas,precession]=root.querySelectorAll('canvas');
  const form=q('form'), birth=q('#astro-birth'), day=q('#astro-day'), site=form.querySelector('select'), slider=q('[type=range]');
  let current, sky, revision=0, closed=false;
  function drawPrecession(){
    const years=Number(slider.value), drift=years/72;
    q('[data-drift]').textContent=years.toLocaleString('en-US')+' years · roughly '+drift.toFixed(1)+'° of westward drift';
    const env=canvasContext(precession);if(!env)return;
    const {ctx:c,w,h}=env;
    c.fillStyle='#0a1326';c.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){
      c.fillStyle=i%5===0?'#e5eeff':'#8ca9d270';c.fillRect((i*137.3%100)*w/100,(i*67.7%100)*h/100,2,2);
    }
    const x=w*.78,y=h*.55, shifted=x-drift*w*.013;
    c.strokeStyle='#8baedb';c.beginPath();c.moveTo(w*.11,y);c.lineTo(w*.89,y);c.stroke();
    for(const [a,color] of [[x,blue],[shifted,gold]]){
      c.fillStyle=color;c.beginPath();c.arc(a,y,6,0,Math.PI*2);c.fill();
    }
    c.font='600 12px system-ui';c.textAlign='center';
    c.fillStyle=blue;c.fillText('Earlier equinox',x,y-21);
    c.fillStyle=gold;c.fillText('Later equinox',shifted,y+25);
    c.fillStyle=faint;c.fillText('← West against the stars',w*.5,h*.84);
  }
  const house=lon=>Math.floor(wrap(lon-current.ascendant)/30)+1;
  function table(points,natal){
    return '<table class="astro-table"><thead><tr><th>Body</th><th>Tropical sign</th><th>House</th>'+
      (natal?'<th>IAU constellation</th>':'')+'</tr></thead><tbody>'+
      points.map(([name,lon,constellation])=>`<tr><th>${name}</th><td>${position(lon)}</td><td>${house(lon)}</td>${natal?'<td>'+constellation+'</td>':''}</tr>`).join('')+
      '</tbody></table>';
  }
  const render=()=>{wheel(natalCanvas,current);wheel(transitCanvas,current,sky);drawPrecession();};
  async function refresh(event){
    event?.preventDefault();
    if(!birth.checkValidity()||!day.checkValidity())return;
    const rev=++revision,[lat,lon]=site.value.split(',').map(Number);
    q('[data-status]').textContent='Computing sky positions…';
    try{
      const [a,b]=await Promise.all([api('zodiac',[birth.value+':00Z',lat,lon]),api('zodiac',[day.value+':00Z',lat,lon])]);
      if(closed||rev!==revision)return;
      current=a;sky=b;
      q('[data-status]').textContent='Ascendant · '+position(a.ascendant);
      q('[data-natal]').innerHTML=table(a.points,true);
      q('[data-transits]').innerHTML=table(b.points,false);
      const [,sun,region]=a.points[0];
      q('[data-sun]').textContent='In your birth example the Sun is in tropical '+position(sun)+', in the astronomical constellation '+region+'.';
      const aspects=b.points.flatMap(([name,lon])=>{
        const offset=Math.abs(signed(lon-sun));
        const hit=[[0,'conjunction'],[90,'square'],[180,'opposition']].find(([angle])=>Math.abs(offset-angle)<=5);
        return hit?[name+' · '+hit[1]+' ('+offset.toFixed(1)+'°)']:[];
      });
      q('[data-aspect]').textContent=aspects.length?'Aspects to the natal Sun: '+aspects.join(' · '):'No listed aspects to the natal Sun at this time.';
      render();
    }catch(error){
      if(!closed&&rev===revision)q('[data-status]').textContent='Sky positions could not be calculated for these entries.';
    }
  }
  const example=q('[data-example]'), exampleNote=q('[data-example-note]');
  function resetExample(){example.value='';exampleNote.textContent='';}
  example.onchange=()=>{
    const sample=examples[example.value];
    if(!sample){resetExample();return;}
    const [name,time,place]=sample;
    birth.value=time;site.value=place;
    exampleNote.textContent=example.value==='elizabeth'?'Elizabeth II · 2:40 a.m. London time, recorded by the Royal Family (01:40 UTC).':name+' · birth date and birthplace, with 12:00 UTC used as a teaching assumption. The ascendant and houses are hypothetical.';
    void refresh();
  };
  birth.onchange=resetExample;
  site.onchange=resetExample;
  form.onsubmit=refresh;
  day.onchange=refresh;
  slider.oninput=drawPrecession;
  const resize=new ResizeObserver(render);
  [natalCanvas,transitCanvas,precession].forEach(c=>resize.observe(c));
  drawPrecession();void refresh();
  return ()=>{closed=true;resize.disconnect();};
}
