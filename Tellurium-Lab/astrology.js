import {mountZodiacSky} from './zodiac-sky.js';
import {canvasContext} from './scene.js';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const glyphs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const symbols={'Sun':'☉','Moon':'☽','Mercury':'☿','Venus':'♀','Mars':'♂','Jupiter':'♃','Saturn':'♄','Uranus':'♅','Neptune':'♆','Lilith':'⚸'};
const wrap=n=>(n%360+360)%360;
const signIndex=lon=>Math.floor(wrap(lon)/30);
const position=lon=>signs[signIndex(lon)]+' '+(wrap(lon)%30).toFixed(1)+'°';
const constellationSigns={Scorpius:'Scorpio',Capricornus:'Capricorn'};
const constellationGlyph=name=>name==='Ophiuchus'?'⛎':glyphs[signs.indexOf(constellationSigns[name]??name)]??'✦';
const icon=(glyph,name)=>glyph?'<span class="astro-glyph" aria-hidden="true">'+glyph+'</span> '+name:name;
const compass=az=>['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(wrap(az)/22.5)%16];
const signed=n=>wrap(n+180)-180;
const examples={
  elizabeth:['Elizabeth II','1926-04-21T01:40','51.5074,-0.1278'],
  kennedy:['John F. Kennedy','1917-05-29T12:00','42.3318,-71.1212'],
  jagger:['Mick Jagger','1943-07-26T12:00','51.4462,0.2169']
};
const locations='<option value="45.4642,9.19">Milan</option><option value="51.5074,-0.1278">London</option><option value="40.7128,-74.006">New York</option><option value="-33.8688,151.2093">Sydney</option><option value="42.3318,-71.1212">Brookline, Massachusetts</option><option value="51.4462,0.2169">Dartford, England</option>';
const timeZones=['Europe/Rome','Europe/London','America/New_York','Australia/Sydney','America/New_York','Europe/London'];
const siteNames=['Milan','London','New York','Sydney','Brookline','Dartford'];
function localStamp(date,zone){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const v=Object.fromEntries(parts.map(({type,value})=>[type,value]));
  return v.year+'-'+v.month+'-'+v.day+'T'+v.hour+':'+v.minute;
}
function localToUTC(stamp,zone){
  const target=Date.parse(stamp+'Z');
  let guess=target;
  for(let i=0;i<4;i++){
    const diff=target-Date.parse(localStamp(new Date(guess),zone)+'Z');
    if(!diff)return new Date(guess).toISOString();
    guess+=diff;
  }
  throw Error('This local time may fall in a daylight-saving gap.');
}
const meanings=[
 ['Sun','Identity and purpose. Astrologers ask what a person wants to express or be recognized for.'],
 ['Moon','Emotional habits and comfort. This symbol is often used to talk about what feels familiar or safe.'],
 ['Mercury','Thinking and communication. It is used for how a person learns, speaks, listens, or makes connections.'],
 ['Venus','Affection, taste, and values. It is used for what a person enjoys and how they give or receive affection.'],
 ['Mars','Drive, anger, and initiative. It is used for how someone pursues a goal or responds to a challenge.'],
 ['Jupiter','Growth, confidence, and beliefs. It is often associated with study, travel, or searching for meaning.'],
 ['Saturn','Limits, responsibility, and time. It is often read as the part of life where practice, patience, or boundaries matter.'],
 ['Uranus','In modern astrology, independence, upheaval, and breaking with convention.'],
 ['Neptune','In modern astrology, imagination, idealism, and blurred boundaries.'],
 ['Lilith','In some modern traditions, autonomy, taboo, or parts of the self that someone feels pressure to hide.']
];
const signMeanings=[
 'Direct and quick to initiate','Steady and focused on what is tangible',
 'Curious, talkative, and adaptable','Protective and attentive to belonging',
 'Expressive and ready to take the spotlight','Practical and attentive to detail',
 'Diplomatic and drawn to balance','Intense and drawn to what is hidden',
 'Exploratory and interested in the big picture','Structured and focused on long-term goals',
 'Independent-minded and interested in groups or ideas','Imaginative and receptive to moods'
];
const houseMeanings=[
 'Self and first impressions','Money and possessions','Learning, siblings, and everyday communication',
 'Home, family, and roots','Play, creativity, and romance','Daily work, habits, and service',
 'One-to-one relationships','Shared resources, intimacy, and loss','Travel, higher learning, and beliefs',
 'Public life and vocation','Friends, communities, and shared goals','Solitude and private life'
];
const signName=lon=>signs[signIndex(lon)];
const readingDate=new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'UTC'});
const themes={Sun:'identity and purpose',Moon:'emotional needs',Mercury:'communication and decisions',
  Venus:'affection and values',Mars:'initiative and assertiveness',Jupiter:'growth and opportunity',
  Saturn:'responsibility and boundaries',Uranus:'change and independence',Neptune:'imagination and ideals',
  Ascendant:'how you approach new situations'};
const aspectTypes=[
  [0,'conjunction','brings the two themes together'],
  [60,'sextile','suggests an opportunity you can act on'],
  [90,'square','suggests a tension that calls for adjustment'],
  [120,'trine','suggests the two themes can work together easily'],
  [180,'opposition','suggests balancing two competing needs']
];

function monthEnd(start){
  const end=new Date(start),day=end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth()+1);
  const last=new Date(end);
  last.setUTCMonth(last.getUTCMonth()+1,0);
  end.setUTCDate(Math.min(day,last.getUTCDate()));
  return end;
}

const houseExamples=[
  'the way you introduce yourself or take the lead',
  'what you save, spend, and consider worth your time',
  'conversations, everyday learning, or relationships with siblings',
  'how you make a home or stay connected with family',
  'making something for pleasure, dating, or play',
  'how you organize a working day or take care of yourself',
  'what you ask of a partner and what you offer in return',
  'how you negotiate shared money, trust, or mutual obligations',
  'what you learn when you travel, study, or question an old belief',
  'the reputation you build and the responsibilities you take on',
  'the people you turn to and the groups you contribute to',
  'where you go for solitude, rest, or private reflection'
];
const transitPrompts={
  Sun:'Give one of these concerns some deliberate attention',
  Mercury:'Try naming the issue clearly or having the conversation you have been putting off',
  Venus:'Ask what you genuinely value and where you are willing to compromise',
  Mars:'Decide where direct action would help and where you can give yourself time to cool off',
  Jupiter:'Look for room to grow and check what you can realistically take on',
  Saturn:'Consider one commitment you could structure better or one boundary you could make clearer',
  Uranus:'Experiment with a different way of doing something familiar',
  Neptune:'Give imagination some room and check what you are assuming'
};

const signVoices=[
  ['getting things started','something you can do right away','get straight to the point'],
  ['building something that lasts','a familiar routine','take your time before joining in'],
  ['following an idea wherever it leads','a good conversation','break the ice with a question'],
  ['looking after the people you love','a place that feels like home','look for a familiar face'],
  ['putting your own stamp on things','a little warmth and appreciation','bring some energy into the room'],
  ['making things work a little better','a small, practical task','notice what needs doing'],
  ['finding a fair way forward','a chance to talk things through','listen for common ground'],
  ['getting to the bottom of things','privacy and someone you trust','watch the room before opening up'],
  ['seeing what lies beyond the familiar','a change of scene','look for the interesting story'],
  ['taking on something worth the effort','a plan you can count on','get a sense of how things work'],
  ['trying an idea others haven’t considered','room to think for yourself','look at things from a different angle'],
  ['giving imagination a place in everyday life','some quiet and a little space to daydream','pick up on the mood around you']
];

function natalReading(chart,house){
  const [,sun]=chart.points[0], [,moon]=chart.points[1];
  const asc=chart.ascendant,dsc=wrap(asc+180);
  const [purpose]=signVoices[signIndex(sun)];
  const comfort=signVoices[signIndex(moon)][1];
  const firstImpression=signVoices[signIndex(asc)][2];
  const partnership=signVoices[signIndex(dsc)][1];
  const sameHouse=house(sun)===house(moon);
  const comparison=sameHouse
    ? 'In this chart, the same part of life carries both ambitions and feelings.'
    : 'Those needs can pull your attention to different parts of life. Both have a place in the picture.';
  const inner=Object.fromEntries(chart.points);
  return `<p>A <strong>${signName(sun)} Sun</strong> finds purpose in ${purpose}. In your chart that theme comes out in ${houseExamples[house(sun)-1]}.</p>
    <p>On a long day, your <strong>${signName(moon)} Moon</strong> points to ${comfort} as a way to feel more like yourself. ${sameHouse?'':`Its house brings in ${houseExamples[house(moon)-1]}.`} ${comparison}</p>
    <p>Walk into a room full of strangers and the <strong>${signName(asc)} Ascendant</strong> sets the scene: you might ${firstImpression}. Once you know someone well, the opposite point, the ${signName(dsc)} Descendant, asks what it would mean to share ${partnership} with them.</p>
    <p>There’s another layer in everyday life. With Mercury in <strong>${signName(inner.Mercury)}</strong>, your way of thinking starts with ${signVoices[signIndex(inner.Mercury)][0]}. Venus in <strong>${signName(inner.Venus)}</strong> brings ${signVoices[signIndex(inner.Venus)][1]} into the picture when you think about affection. When it’s time to act, Mars in <strong>${signName(inner.Mars)}</strong> points back to ${signVoices[signIndex(inner.Mars)][0]}.</p>
    <p class="fine">A symbolic reading in the Western tropical tradition, using equal houses.</p>`;
}

const magazineTopics=[
  ['Work','Saturn','Ascendant','Clear up who owns that job everyone thinks someone else is doing. A two-line message might save a very long meeting.','Pick one loose end worth tying up. The rest of your to-do list can wait its turn.'],
  ['Love','Venus','Sun','Trade a vague “we should” for an actual invitation. Bonus points if it comes with a time and place.','Say what you’d genuinely enjoy doing together. Start with dinner if the bigger questions feel ambitious.'],
  ['Family','Sun','Moon','An old family subject might read differently over coffee. Give the conversation time to get past its usual opening line.','Call someone you keep meaning to ring. Ten minutes is a perfectly respectable family reunion.'],
  ['Money','Mercury','Sun','A small expense is worth a second look. Your shopping cart can wait overnight while you make up your mind.','Pick one recurring expense and ask whether it still earns its keep. Even a tiny subscription can make a dramatic exit.'],
  ['Well-being','Mars','Moon','If the calendar feels too full, see what you can move before agreeing to one more thing. Keep one evening for yourself.','Give yourself a little unclaimed time. A walk can just be a walk.'],
  ['Travel','Jupiter','Ascendant','Leave some space between plans. The best part of the outing might be the stop someone suggests on the way.','Try a new neighborhood before shopping for luggage. A good lunch can be an expedition.']
];

function magazineReading(chart,days,best,house){
  const birthPoints={...Object.fromEntries(chart.points),Ascendant:chart.ascendant};
  const opening=Object.fromEntries(days[0][1]);
  const tense=new Set(['square','opposition']);
  return '<dl class="astro-magazine">'+magazineTopics.map(([topic,planet,target,busy,quiet])=>{
    const hit=[...best.values()].filter(item=>item.planet===planet).sort((a,b)=>a.orb-b.orb)[0];
    const date=hit?readingDate.format(Date.parse(hit.date)):'';
    const cue=hit
      ? `${date} · ${planet} ${hit.aspect} to your ${signName(hit.natalLon)} ${hit.target}`
      : `${planet} opens in house ${house(opening[planet])} · ${signName(birthPoints[target])} ${target}`;
    const active=hit&&(tense.has(hit.aspect)||hit.aspect==='conjunction');
    return `<div><dt>${topic}</dt><dd>${active?busy:quiet}<small>${cue}</small></dd></div>`;
  }).join('')+'</dl>';
}

function monthlyReading(chart,days,end,house){
  const natal=[...chart.points.slice(0,2),['Ascendant',chart.ascendant]];
  const best=new Map();
  for(const [date,planets] of days)for(const [planet,lon] of planets)for(const [target,natalLon] of natal){
    const separation=Math.abs(signed(lon-natalLon));
    for(const [angle,aspect,meaning] of aspectTypes){
      const orb=Math.abs(separation-angle);
      if(orb>2)continue;
      const key=planet+':'+target+':'+aspect;
      if(!best.has(key)||orb<best.get(key).orb)best.set(key,{planet,target,aspect,meaning,orb,date,lon,natalLon});
    }
  }
  const chosen=[];
  for(const hit of [...best.values()].sort((a,b)=>a.orb-b.orb)){
    if(chosen.some(item=>item.planet===hit.planet))continue;
    chosen.push(hit);
    if(chosen.length===3)break;
  }
  const sunHouses=[...new Set(days.map(([,points])=>house(points[0][1])))];
  const houseList=sunHouses.map(n=>houseExamples[n-1]);
  const hits=chosen.sort((a,b)=>a.date.localeCompare(b.date)).map(hit=>{
    const {planet,target,aspect,meaning,date,orb,lon,natalLon}=hit;
    return `<li><strong>${readingDate.format(Date.parse(date))} · ${planet} ${aspect} natal ${target}</strong>
      <p>${planet} is in ${signName(lon)}. Your natal ${target} is in ${signName(natalLon)}. Astrologically, the angle ${meaning}. Think about how ${themes[planet]} might meet ${themes[target]}. ${transitPrompts[planet]}.</p>
      <span class="fine">Closest daily sample: ${orb.toFixed(1)}° from exact.</span></li>`;

  });
  const topicList=new Intl.ListFormat('en-US').format(houseList.slice(1));
  return `<p>Through ${readingDate.format(+end-86400000)} (UTC)</p>
    <p><strong>The month ahead.</strong> The month opens with an emphasis on ${houseList[0]}.${topicList?` As the Sun moves through your chart, the focus shifts to ${topicList}.`:''} Read on for a few lighthearted ways that might show up in daily life.</p>
    ${magazineReading(chart,days,best,house)}
    <details><summary>See the transits behind the reading</summary>${hits.length?'<ul>'+hits.join('')+'</ul>':'<p>No sampled transit came within 2° of one of the five major aspects to these three natal points this month.</p>'}</details>
    <p class="fine">This lesson samples once a day at the selected UTC time and uses a 2° tolerance. It highlights up to three close contacts from the Sun and planets, excluding the fast-moving transiting Moon. The interpretations are symbolic and intended for reflection.</p>`;
}

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
  drawLine(point(0,1.02),point(180,1.02),'#caa675');
  label('ASC',point(0,1.105),gold,11);
  label('DSC',point(180,1.105),gold,11);
  label('E',point(0,1.105).map((v,i)=>v+(i?15:0)),faint,10);
  label('W',point(180,1.105).map((v,i)=>v+(i?15:0)),faint,10);
  label('Above horizon',point(270,1.09),faint,10);
  label('Below horizon',point(90,1.09),faint,10);
  for(const [points,color,rad] of [[[...birth.points,['Lilith',birth.lilith]],blue,.63],[transit?.points??[],gold,.75]]){
    // Keep close labels readable by alternating bands while retaining true longitude ticks.
    const sorted=[...points].sort((a,b)=>a[1]-b[1]);
    sorted.forEach(([name,lon],i)=>{
      const a=lon-zero;
      const close=sorted.some(([,other],j)=>i!==j&&Math.abs(signed(other-lon))<11);
      drawLine(point(a,rad-.055),point(a,rad-.018),color);
      label(symbols[name],point(a,rad+(close?(i%2?.045:-.039):0)),color,15);
    });
  }
  label(transit?'Natal + transits':'Natal chart',[x,y-10],faint,13);
  label('Horizon',[x,y+11],gold,10);
  if(!transit){
    // Draw a depth cue inside the empty center, separate from the ecliptic rings.
    for(const [direction,offset,tip,tail,head] of [
      ['N',-31,-9,3,4],
      ['S',33,9,2,5]
    ]){
      const py=y+offset;
      const shade=c.createLinearGradient(x,py-9,x,py+9);
      shade.addColorStop(0,'#7c9bbd');
      shade.addColorStop(1,blue);
      c.fillStyle=shade;
      c.beginPath();
      c.moveTo(x,py+tip);
      c.lineTo(x-head,py+tip/4);
      c.lineTo(x-tail,py+tip/4);
      c.lineTo(x-tail,py-tip);
      c.lineTo(x+tail,py-tip);
      c.lineTo(x+tail,py+tip/4);
      c.lineTo(x+head,py+tip/4);
      c.closePath();
      c.fill();
      label(direction,[x+13,py],blue,12);
    }
  }
}

export function mountAstrology(root,api){
  const now=new Date().toISOString().slice(0,16);
  root.innerHTML=`<div class="lab-stack astro-lab">
    <article class="lab-card"><h2>Astrology &amp; Astronomy</h2>
    <p>Astrology interprets the positions of celestial bodies as signs about human affairs. Its predictive claims lack reliable scientific evidence. Historically, divination and calendar making helped motivate sustained observations of the sky. Astronomy grew partly out of that shared tradition, in a loose parallel with alchemy and chemistry.</p>
    <p>This is a guide to reading the symbols and the sky geometry behind them. The calculations use the Western tropical zodiac and equal houses.</p></article>
    <article class="lab-card"><details class="astro-meanings"><summary>What do the symbols mean?</summary>
    <p>Astrologers read the chart in layers. Start with a <strong>body</strong> (the subject), then its <strong>sign</strong> (the style), then its <strong>house</strong> (an area of life). Different traditions give these symbols different meanings. The associations below describe the practice and its vocabulary.</p>
    <h3>1. What is the subject?</h3>
    <dl>${meanings.map(([name,note])=>`<dt>${icon(symbols[name],name==='Lilith'?'Black Moon Lilith':name)}</dt><dd>${note}</dd>`).join('')}</dl>
    <h3>2. How is it expressed?</h3>
    <p>Each tropical sign is a 30° sector measured from the March equinox. Astrologers assign a style to each sector.</p>
    <dl>${signs.map((name,i)=>`<dt>${icon(glyphs[i],name)}</dt><dd>${signMeanings[i]}</dd>`).join('')}</dl>
    <h3>3. Where does the story play out?</h3>
    <p>Houses are counted from the Ascendant. Their boundaries depend on the time and place of birth, so two people with the same Sun sign can have the Sun in different houses.</p>
    <dl>${houseMeanings.map((note,i)=>`<dt>House ${i+1}</dt><dd>${note}</dd>`).join('')}</dl>
    <h3>Read one placement</h3>
    <p>Take <strong>Saturn in Gemini in house 4</strong>. An astrologer might combine Saturn’s association with patience and responsibility, Gemini’s association with communication, and the fourth house’s association with family. One possible reading is that a person learns patience through difficult family conversations. A <strong>transit</strong> repeats that exercise with today’s planets over the birth chart. An <strong>aspect</strong> compares two positions by angle. For example, a conjunction puts them close together and is traditionally read as linking their themes.</p>
    <p><strong>Ascendant and Descendant.</strong> The Ascendant is where the ecliptic rises on the eastern side of the horizon. The Descendant is the opposite crossing on the western side. Astrologers associate the first with how someone approaches the world and the second with close partnerships.</p>
    <p><strong>Where is Lilith?</strong> Black Moon Lilith is a calculated direction. This chart uses the Moon’s <em>mean apogee</em>, the direction of the farthest point of its mean orbit. In a simple ellipse, Earth sits at one focus and the empty focus lies along the same direction as apogee, but at a different distance. Neither point is a moon or a visible body. Some astrologers use a varying, rather than mean, apogee.</p></details></article>
    <article class="lab-card"><h2>Make a birth chart</h2>
    <form class="lab-actions"><label>Birth time (local) ${dateField('astro-birth','1973-10-04T10:30')}</label><label>Birthplace <select>${locations}</select></label><button type="submit">Draw charts</button></form>
    <div class="lab-actions"><label>Famous example <select data-example><option value="">Choose a person</option>${Object.entries(examples).map(([key,[name]])=>`<option value="${key}">${name}</option>`).join('')}</select></label></div>
    <p data-example-note></p><p data-status role="status"></p>
    <div class="lab-rows astro-views">
    <div><h3>The sky from the ground</h3><p data-sky-time></p>
    <canvas data-ground tabindex="0" aria-label="Birth sky. Drag or use the arrow keys to look around."></canvas>
    <div class="lab-actions" data-sky-controls><button data-look="Sun">Look toward the Sun</button><button data-look="ASC">Look at the ascendant</button><button data-look="DSC">Look at the descendant</button><button data-look="Taurus">Taurus</button><button data-look="Gemini">Gemini</button><label><input type="checkbox" checked> Show hidden sky</label><output></output></div>
    <p>The horizon separates sky from ground. The overlay reveals stars washed out by sunlight and positions below the horizon. The constellation figures connect a few bright stars. They illustrate the constellations without tracing official boundaries.</p></div>
    <div><h3>The same sky as a birth chart</h3><canvas data-natal-wheel aria-label="Natal chart with twelve tropical signs, twelve equal houses, and the horizon from the eastern ascendant to the western descendant. At the center, north points away from the viewer and south points toward the viewer."></canvas>
    <p><strong>Sun sign:</strong> the 30° sector of the ecliptic containing the Sun. Think of the ecliptic as the Sun’s yearly route against the stars. <strong>Ascendant:</strong> the point on that route rising on the eastern horizon. The <strong>Descendant</strong> is the opposite point, setting on the western horizon. The gold line connects those two directions. The top half shows ecliptic directions above the horizon. The bottom half shows directions below it. E and W mark the eastern and western halves of the horizon. Imagine standing at the center and facing north. The small N arrow recedes into the screen in front of you. The S arrow comes toward you, along the direction behind you. These two arrows are a compass cue. The zodiac rings still show positions along the ecliptic. The bearings below give the actual rising and setting directions.</p>
    <p><strong>Houses:</strong> twelve 30° sectors in this example, starting at the ascendant. Astrology traditionally associates them with areas of life, such as self (1), home (4), and partnerships (7). Other systems draw different boundaries.</p>
    <div data-natal></div><p>The IAU column gives the constellation on the star map. A star marker (✦) identifies constellations outside the zodiac band.</p></div></div>
    <section class="astro-reading"><h3>How an astrologer would interpret it…</h3><div data-profile></div></section></article>
    <article class="lab-card"><h2>Read the sky for a chosen month</h2>
    <label>Month starts (UTC) ${dateField('astro-day',now)}</label>
    <div class="lab-rows astro-views">
    <div><h3>The sky at the start of the month</h3><p data-transit-sky-time></p>
      <canvas data-transit-ground tabindex="0" aria-label="The sky at the chosen date and place. Drag or use arrow keys to look around."></canvas>
      <div class="lab-actions" data-transit-sky-controls><button data-look="Sun">Look toward the Sun</button><button data-look="Moon">Look toward the Moon</button><label><input type="checkbox" checked> Show hidden sky</label><output></output></div></div>
    <div><h3>Birth chart with transits</h3><canvas data-transit-wheel aria-label="Natal chart with planetary transit positions overlaid"></canvas>
    <p>The blue marks are the birth positions. Gold shows <strong>transits</strong>, the positions at the selected time, laid over the same birth houses. For example, “Saturn in Gemini” means Saturn’s ecliptic longitude is in the 60°–90° tropical sector.</p>
    <div data-transits></div></div></div>
    <section class="astro-reading"><h3 data-month-title>The monthly horoscope that an astrologer would give you for the month starting…</h3><div data-month></div>
    <p><strong>How the reading works.</strong> Astrologers compare moving planets with the birth chart. The five major aspects are conjunction (0°), sextile (60°), square (90°), trine (120°), and opposition (180°).</p>    <details><summary>Why the same sky gives different readings</summary>
    <p>Imagine Saturn is at <strong>15° Gemini today</strong>. Its position is the same for everyone at that moment. Your <strong>natal Saturn</strong> is a separate entry: it records where Saturn was when you were born. On the wheel, today’s Saturn is gold and your birth Saturn is blue.</p>
    <p>What changes from person to person is where today’s Saturn lands on the birth chart. With <strong>10° Scorpio rising</strong>, 15° Gemini falls in house 8, which an astrologer might link to shared finances or trust. With <strong>10° Virgo rising</strong>, the same Saturn falls in house 10, associated with work or public responsibilities. These examples use equal houses, each starting at the same degree in the next sign.</p>
    <p>Astrologers also measure angles. Saturn at 15° Gemini forms a <strong>120° trine</strong> to a natal Sun at 15° Libra. For a natal Sun at 15° Taurus, the angle is 30°. The different readings come from comparing the same Saturn with two different birth positions.</p></details>
</section></article>
    <article class="lab-card"><h2>Why signs do not really match what goes on in the sky today</h2>
    <p>Imagine you could see the stars behind the Sun in broad daylight. Start with October 4 in the modern sky. Then switch to the same point in the seasonal year around 400 BCE, when Babylonian astronomers established a zodiac of twelve equal signs. The same stars stay in place so you can compare the Sun’s position.</p>
    <div class="lab-actions" data-era><button type="button" data-period="modern" aria-pressed="true">October 4 · modern sky</button><button type="button" data-period="ancient" aria-pressed="false">Around 400 BCE</button></div>
    <p data-drift role="status">Loading the star background…</p><canvas data-precession aria-label="Earth-based view of the Sun against the same background constellations in two eras"></canvas>
    <p>October 4 still falls in the tropical sign of Libra. The modern Sun is actually in front of the stars of Virgo. Around 400 BCE, at the same point in the seasonal year, the Sun was in the part of the sky now mapped as Libra. Earth’s axis slowly changes direction, shifting the March equinox against the stars. The tropical zodiac follows that equinox, so its signs shift relative to the constellations.</p>
    <p><strong>During one night:</strong> stars drift east to west as Earth rotates. <strong>At the same clock time on later nights:</strong> those stars also appear farther west (about four minutes earlier each night), because Earth moves around the Sun. Over the year, this brings different zodiac constellations into the evening sky. Against the stars, the Sun itself shifts eastward over the year.</p>
    <p>The ecliptic’s tilt here is illustrative. Its angle to the local horizon changes with latitude, date, and time. The colored strip below the horizon is a key to the constellation boundaries along the ecliptic. The Sun’s disk is enlarged.</p></article>
    </div>`;
  const q=s=>root.querySelector(s);
  const natalCanvas=q('[data-natal-wheel]'),transitCanvas=q('[data-transit-wheel]'),precession=q('[data-precession]');
  const ground=mountZodiacSky(q('[data-ground]'),q('[data-sky-controls]'));
  const transitGround=mountZodiacSky(q('[data-transit-ground]'),q('[data-transit-sky-controls]'));
  const form=q('form'), birth=q('#astro-birth'), day=q('#astro-day'), site=form.querySelector('select');
  let current, sky, comparison, period='modern', revision=0, closed=false;
  function drawPrecession(){
    if(!comparison)return;
    const env=canvasContext(precession);if(!env)return;
    const {ctx:c,w,h}=env,{bands,stars}=comparison,sun=comparison[period];
    const x=offset=>w*(60-offset)/120;
    const y=(lat,lon)=>h*.48+lon*h*.0027-lat*Math.min(w/120,h/90);
    c.fillStyle='#0a1326';c.fillRect(0,0,w,h);
    const bandTop=h-29,horizon=bandTop-22;
    c.fillStyle='#121e2b';c.fillRect(0,horizon,w,22);
    c.strokeStyle='#91a5bb';c.beginPath();c.moveTo(0,horizon);c.lineTo(w,horizon);c.stroke();
    c.font='600 11px system-ui';c.textAlign='left';c.fillStyle=faint;
    c.fillText('EAST',8,horizon+15);c.textAlign='right';c.fillText('WEST',w-8,horizon+15);
    c.textAlign='center';c.fillText('Illustrative horizon',w/2,horizon+15);
    c.strokeStyle='#a4bfdd99';c.setLineDash([4,5]);c.beginPath();c.moveTo(0,y(0,60));c.lineTo(w,y(0,-60));c.stroke();c.setLineDash([]);
    c.textAlign='left';c.fillText('Ecliptic',10,y(0,60)-9);
    const arrow=(caption,py,color)=>{
      const left=w*.08,right=w*.91;
      c.strokeStyle=color;c.beginPath();c.moveTo(left,py);c.lineTo(right,py);
      c.lineTo(right-6,py-4);c.moveTo(right,py);c.lineTo(right-6,py+4);c.stroke();
      c.fillStyle=color;c.fillText(caption,left,py-5);
    };
    arrow('During the night',24,blue);
    arrow('Same time on later nights',47,gold);
    for(const group of Object.values(stars)){
      c.beginPath();
      let connected=false;
      for(const [lon,lat] of group){
        if(Math.abs(lon)>66){connected=false;continue;}
        if(connected)c.lineTo(x(lon),y(lat,lon));else c.moveTo(x(lon),y(lat,lon));
        connected=true;
      }
      c.strokeStyle='#9abbdf66';c.stroke();
      for(const [lon,lat] of group){
        if(Math.abs(lon)>60)continue;
        c.fillStyle=blue;c.beginPath();c.arc(x(lon),y(lat,lon),2.4,0,Math.PI*2);c.fill();
      }
    }
    for(const [name,start,end] of bands){
      const active=name===sun.region,width=x(start)-x(end);
      c.fillStyle=active?'#724b31':'#233958';c.fillRect(x(end),bandTop,Math.max(0,width-1),29);
      if(width<24)continue;
      c.fillStyle=active?gold:faint;c.textAlign='center';c.font='600 11px system-ui';
      c.fillText(width>c.measureText(name).width+8?name:constellationGlyph(name),x((start+end)/2),bandTop+18,width-4);
    }
    const sx=x(sun.offset),sy=y(sun.lat,sun.offset);
    const glow=c.createRadialGradient(sx,sy,2,sx,sy,27);
    glow.addColorStop(0,'#ffebac');glow.addColorStop(.37,'#ffbd6388');glow.addColorStop(1,'#ffbd6300');
    c.fillStyle=glow;c.fillRect(sx-27,sy-27,54,54);
    c.fillStyle='#fff0b6';c.beginPath();c.arc(sx,sy,8,0,Math.PI*2);c.fill();
    c.fillStyle=gold;c.font='600 13px system-ui';c.textAlign='center';c.fillText('Sun',sx,sy-20);
  }
  const year=new Date().getFullYear();
  const dateForSky=new Date(Date.UTC(year,9,4,12)).toISOString();
  function showEra(){
    if(!comparison)return;
    const sun=comparison[period];
    const when=period==='modern'?'October 4, '+year:'Around 400 BCE · same seasonal position as October 4';
    q('[data-drift]').textContent=when+' — The Sun appears in '+sun.region+'.';
    for(const button of q('[data-era]').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.period===period));
    drawPrecession();
  }
  q('[data-era]').onclick=event=>{
    const next=event.target.closest('button')?.dataset.period;
    if(next){period=next;showEra();}
  };
  api('precession',[dateForSky]).then(result=>{
    if(!closed){comparison=result;showEra();}
  }).catch(()=>{
    if(!closed)q('[data-drift]').textContent='The star background could not be calculated.';
  });
  const house=lon=>Math.floor(wrap(lon-current.ascendant)/30)+1;
  function table(points,natal){
    return '<table class="astro-table"><thead><tr><th>Object</th><th>Tropical sign</th><th>House</th>'+
      (natal?'<th>IAU constellation</th>':'')+'</tr></thead><tbody>'+
      points.map(([name,lon,constellation])=>`<tr><th>${icon(symbols[name],name)}</th><td>${icon(glyphs[signIndex(lon)],position(lon))}</td><td>${name==='Ascendant'?1:name==='Descendant'?7:house(lon)}</td>${natal?'<td>'+icon(constellation==='—'?null:constellationGlyph(constellation),constellation)+'</td>':''}</tr>`).join('')+
      '</tbody></table>';
  }
  const render=()=>{wheel(natalCanvas,current);wheel(transitCanvas,current,sky);drawPrecession();};
  async function refresh(event){
    event?.preventDefault();
    if(!birth.checkValidity()||!day.checkValidity())return;
    const rev=++revision,[lat,lon]=site.value.split(',').map(Number);
    q('[data-status]').textContent='Computing sky positions…';
    try{
      const instant=localToUTC(birth.value,timeZones[site.selectedIndex]);
      const start=new Date(day.value+':00Z'),end=monthEnd(start);
      const [a,b,month]=await Promise.all([api('zodiac',[instant,lat,lon]),
        api('zodiac',[start.toISOString(),lat,lon]),api('monthly_transits',[start.toISOString(),end.toISOString()])]);
      if(closed||rev!==revision)return;
      current=a;sky=b;ground.set(a);transitGround.set(b);
      const local=new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeStyle:'short',timeZone:timeZones[site.selectedIndex]}).format(new Date(instant));
      q('[data-sky-time]').textContent=siteNames[site.selectedIndex]+' · '+local+' local · '+instant.slice(11,16)+' UTC';
      q('[data-transit-sky-time]').textContent=siteNames[site.selectedIndex]+' · '+readingDate.format(start)+' · '+start.toISOString().slice(11,16)+' UTC';
      const dsc=wrap(a.ascendant+180);
      const bearing=key=>compass(a.sky[key][0])+' '+Math.round(a.sky[key][0])+'°';
      q('[data-status]').textContent='ASC · '+position(a.ascendant)+' · '+bearing('ASC')+
        '  |  DSC · '+position(dsc)+' · '+bearing('DSC');
      q('[data-natal]').innerHTML=table([...a.points,...a.angles,['Lilith',a.lilith,'—']],true);
      q('[data-transits]').innerHTML=table(b.points,false);
      q('[data-profile]').innerHTML=natalReading(a,house);
      q('[data-month-title]').textContent='The monthly horoscope that an astrologer would give you for the month starting '+readingDate.format(start);
      q('[data-month]').innerHTML=monthlyReading(a,month,end,house);
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
    site.value=place;birth.value=localStamp(new Date(time+'Z'),timeZones[site.selectedIndex]);
    exampleNote.textContent=example.value==='elizabeth'?'Elizabeth II · 2:40 a.m. London time, recorded by the Royal Family (01:40 UTC).':name+' · birth date and birthplace, with 12:00 UTC used as a teaching assumption. The ascendant and houses are hypothetical.';
    void refresh();
  };
  birth.onchange=resetExample;
  site.onchange=resetExample;
  form.onsubmit=refresh;
  day.onchange=refresh;
  const resize=new ResizeObserver(render);
  [natalCanvas,transitCanvas,precession].forEach(c=>resize.observe(c));
  void refresh();
  return ()=>{closed=true;resize.disconnect();ground.dispose();transitGround.dispose();};
}
