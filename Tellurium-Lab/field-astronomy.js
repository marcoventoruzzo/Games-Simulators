const rad=Math.PI/180;
const q=(root,selector)=>root.querySelector(selector);
const figure=(label,content,view='0 0 360 250')=>`<svg class="field-figure" viewBox="${view}" role="img" aria-label="${label}">${content}</svg>`;
const label=(x,y,copy,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${copy}</text>`;
const line=(x1,y1,x2,y2,style='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${style}"/>`;
const dot=(x,y,r=4,style='field-gold')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${style}"/>`;
const number=(value,digits=1)=>Number(value.toFixed(digits)).toString();
const twelve=h=>h===12?'Noon':(h%12||12)+(h<12?' a.m.':' p.m.');
const dateFormat=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',timeZone:'UTC'});
const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const zodiac=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const zodiacNames=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function clockTime(minutes){
  const m=(Math.round(minutes)%1440+1440)%1440,h=Math.floor(m/60);
  return (h%12||12)+':'+String(m%60).padStart(2,'0')+(h<12?' a.m.':' p.m.');
}

function drawFlorence(data,index){
  const [, , ,eq]=data[index],center=180, minY=Math.min(...data.map(row=>row[2])),maxY=Math.max(...data.map(row=>row[2]));
  const maxX=Math.max(...data.map(row=>Math.abs(row[1])));
  const x=value=>center+value*57/maxX;
  const y=value=>67+(value-minY)*259/(maxY-minY);
  const points=data.map(row=>[x(row[1]),y(row[2])]);
  const [px,py]=points[index];
  let calendar='';
  for(let m=0;m<12;m++){
    const i=data.findIndex(row=>row[0].slice(5)===String(m+1).padStart(2,'0')+'-15');
    const [mx,my]=points[i],left=mx<center,tx=left?46:302;
    const ty=82+calendarSide(data,points,m,left)*44;
    calendar+=line(mx,my,left?tx+20:tx-20,ty-3,'field-guide')+dot(mx,my,2)+label(tx,ty,monthNames[m]);
  }
  for(let s=0;s<12;s++){
    const a=s*30;
    const separation=row=>Math.abs((row[4]-a+540)%360-180);
    const i=data.reduce((best,row,j)=>separation(row)<separation(data[best])?j:best,0);
    const [zx,zy]=points[i];
    calendar+=dot(zx,zy,2.2,'field-cyan')+label(zx+(zx<center?-10:10),zy-4,zodiac[s]);
  }
  return figure('Florence-inspired wall dial with a straight apparent-noon line, a mean-noon figure eight and calendar marks',
    `<rect x="16" y="12" width="328" height="352" rx="10" class="field-plate"/>`+
    label(center,36,'TIME AND CALENDAR')+line(center,51,center,338,'field-guide')+
    `<polyline points="${[...points,points[0]].map(p=>p.join(',')).join(' ')}" class="field-goldline"/>`+
    calendar+dot(px,py,7,'field-cyan')+label(center,354,'Straight line = apparent noon'), '0 0 360 376');
}

function calendarSide(data,points,month,left){
  const months=monthNames.map((_,i)=>{
    const index=data.findIndex(row=>row[0].slice(5)===String(i+1).padStart(2,'0')+'-15');
    return [i,...points[index]];
  }).filter(([,x])=>(x<180)===left).sort((a,b)=>a[2]-b[2]);
  return months.findIndex(([i])=>i===month)*5/Math.max(5,months.length-1);
}

function hourLine(latitude,hour){
  const h=(hour-12)*15*rad;
  return Math.atan2(Math.sin(latitude*rad)*Math.sin(h),Math.cos(h));
}

function horizontalDial(latitude){
  const center=[180,125],r=94;
  let ticks='';
  for(let h=6;h<=18;h++){
    const a=hourLine(latitude,h),sx=Math.sin(a),cy=Math.cos(a);
    ticks+=line(center[0],center[1],center[0]+r*sx,center[1]-r*cy,h===12?'field-goldline':'field-guide')+
      label(center[0]+(r+15)*sx,center[1]-(r+15)*cy+4,h===12?'12':String(h%12||12));
  }
  const a=latitude*rad,ax=86,ay=221,len=63;
  return figure('Horizontal sundial seen from above and a side view of the tilted rod',
    `<circle cx="180" cy="125" r="${r}" class="field-plate"/>`+ticks+dot(...center,4)+
    label(180,15,'TRUE NORTH')+label(66,130,'W')+label(294,130,'E')+
    line(48,ay,157,ay,'field-guide')+line(ax,ay,ax+len*Math.cos(a),ay-len*Math.sin(a),'field-goldline')+
    label(172,216,number(latitude,2)+'° above the plate','start')+label(180,244,'Side view · rod points north'));
}

export function mountMeridian(root,api){
  root.innerHTML=`<div class="lab-stack field-lab">
    <article class="lab-card"><h2>How to Read and Build a Meridian</h2><h3>Read the clock and calendar</h3>
      <p>This teaching reconstruction is based on the wall dial in Florence’s Piazza della Signoria. The historic dial has a straight noon line and a month-marked figure eight. This version adds zodiac symbols to link the calendar to the Sun’s annual path.</p>
      <div class="field-columns"><div data-florence></div><div>
        <div class="lab-actions"><label>Date on the dial <input type="range" min="0" max="364" value="45" data-dial-date></label>
        <label><input type="checkbox" data-dst> Add daylight saving time</label></div>
        <output class="lab-readout" data-dial-read>Calculating the calendar…</output>
        <ol>
          <li><strong>Find the shadow tip.</strong> The rod is called a <em>gnomon</em>. Its tip makes the calendar reading. As the Sun moves during the day, the shadow moves across the dial.</li>
          <li><strong>Use the straight line for apparent solar noon.</strong> When the tip crosses the line, the Sun is due south in Florence. At that moment it is noon by the local Sun. A full sundial may have separate hour lines for morning and afternoon. This historic meridian is a noon instrument.</li>
          <li><strong>Use the eight for local mean noon.</strong> The curve marks where the same tip lands at 12:00 local <em>mean</em> solar time throughout the year. Its height mainly reflects how high the Sun is in the season. The sideways offset reflects the equation of time, the difference between apparent and mean solar time.</li>
          <li><strong>Read the calendar on the right branch.</strong> At local mean noon, match the spot on the eight to the neighboring month marks. At apparent noon, use its height on the straight line to estimate the season. Similar Sun heights recur before and after a solstice, so follow the branch for the season you are in. Near the crossing, knowing the month resolves the ambiguity. The zodiac symbols here mark the Sun’s entry into successive 30° tropical longitude sectors.</li>
        </ol>
      </div></div>
      <p><strong>Compare with a wristwatch.</strong> Florence is west of the Central European Time reference meridian (15° E), so its local mean noon comes about 15 minutes after 12:00 CET. The equation of time moves apparent noon earlier or later. Summer civil time adds an hour. The checkbox lets you see that hour separately.</p>
      <p><a href="https://cultura.comune.fi.it/system/files/2018-12/La_meridiana_di_Piazza_della_Signoria.pdf">City of Florence · the historic instrument</a></p>
    </article>
    <article class="lab-card"><h3>Build a horizontal dial</h3>
      <p>Use a foam disk, a short wooden dowel, a ruler, a protractor, and a marker. This template is designed for northern midlatitudes. Start with Milan (45.46° N).</p>
      <div class="lab-actions"><label>Latitude ° N <input type="number" min="25" max="70" step=".01" value="45.46" data-lat></label><label>Disk radius (cm) <input type="number" min="5" max="100" value="15" data-radius></label></div>
      <div class="field-columns"><div data-flat-dial></div><ol>
        <li><strong>Mark true north.</strong> Level the disk in a sunny spot. Mark its center, then draw the northward radius. That is the noon line. Use a map or a compass corrected for magnetic declination to align it.</li>
        <li><strong>Set the rod.</strong> Insert it at the center and lean the upper end toward true north. Use a protractor to set the angle <em>above the flat disk</em> equal to the local latitude. On a horizontal dial the rod lies parallel to Earth’s axis.</li>
        <li><strong>Draw the hour lines.</strong> Mark the angles in the table from the noon radius. Afternoon marks turn toward east, morning marks toward west. Their spacing is uneven on a flat disk.</li>
        <li><strong>Check with your watch.</strong> Look up local apparent solar noon for your date and place, or find when the shadow crosses your true-north line. Keep the disk fixed. About one hour after that watch time, mark the shadow direction as 1 p.m. solar time, then repeat for 2, 3, 4, and 5 p.m. For example, if the shadow crosses noon at 12:25 p.m. on your watch, mark solar 2 p.m. at 2:25 p.m. Check on a day with enough sunlight to reach the late marks.</li>
      </ol></div>
      <h4>Measure the marks</h4><p>The hour angle is 15° × hours from solar noon. The dial angle is atan2(sin(latitude) × sin(hour angle), cos(hour angle)). For two neighbor marks on the rim, the straight-line gap is 2 × radius × sin(half their angular separation). Use the table for either side of noon.</p>
      <div class="field-table" data-hours></div><p><a href="https://sundialsoc.org.uk/making-sundials/sundial-angle-finder/">British Sundial Society · angle calculator</a></p>
    </article>
  </div>`;
  const year=new Date().getFullYear(),input=q(root,'[data-dial-date]'),dst=q(root,'[data-dst]');
  let days=null,closed=false;
  function drawCalendar(){
    if(!days)return;
    const i=+input.value,[date,,,eq,lon]=days[i],z=Math.floor(lon/30);
    q(root,'[data-florence]').innerHTML=drawFlorence(days,i);
    const offset=4*(15-11.256)+(dst.checked?60:0);
    q(root,'[data-dial-read]').textContent=dateFormat.format(Date.parse(date+'T12:00Z'))+' · '+zodiac[z]+' '+zodiacNames[z]+
      ' · mean noon at '+clockTime(720+offset)+' on your watch · apparent noon at '+clockTime(720+offset-eq)+
      ' · apparent time minus mean time: '+(eq>=0?'+':'')+number(eq)+' min';
  }
  function drawBuilder(){
    const latitude=q(root,'[data-lat]'),radius=q(root,'[data-radius]');
    if(!latitude.checkValidity()||!radius.checkValidity()||!latitude.value||!radius.value)return;
    const lat=+latitude.value,r=+radius.value;
    q(root,'[data-flat-dial]').innerHTML=horizontalDial(lat);
    q(root,'[data-hours]').innerHTML=`<table><thead><tr><th>Solar hour</th><th>Angle from noon</th><th>Straight gap from previous mark</th></tr></thead><tbody>
    ${Array.from({length:7},(_,i)=>{
      const angle=hourLine(lat,12+i),previous=hourLine(lat,12+Math.max(0,i-1));
      return `<tr><th>${i?twelve(12-i)+' / '+twelve(12+i):'Noon'}</th><td>${number(angle/rad)}°</td><td>${i?number(2*r*Math.sin((angle-previous)/2))+' cm':'—'}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  input.oninput=dst.onchange=drawCalendar;
  q(root,'[data-lat]').oninput=q(root,'[data-radius]').oninput=drawBuilder;
  drawBuilder();
  api('florence_dial',[year]).then(data=>{
    if(closed)return;
    days=data;input.max=days.length-1;drawCalendar();
  }).catch(()=>{if(!closed)q(root,'[data-dial-read]').textContent='The calendar could not be calculated.'});
  return ()=>{closed=true};
}

function sextantView(nocturnal,adjusted,target){
  const x=180,y=180,r=111, endpoint=a=>[x+r*Math.cos(a*rad),y-r*Math.sin(a*rad)];
  const [sx,sy]=endpoint(target),[ix,iy]=endpoint(adjusted);
  return figure(nocturnal?'Sextant measuring the altitude of Polaris':'Sextant measuring the altitude of the Sun',
    `<rect x="9" y="10" width="342" height="226" rx="12" class="field-plate"/>`+
    line(28,y,331,y,'field-cyanline')+label(292,201,'Sea horizon')+
    line(x,y,sx,sy,'field-guide')+line(x,y,ix,iy,'field-goldline')+
    dot(sx,sy,nocturnal?4:9)+label(sx,sy-14,nocturnal?'Polaris':'Sun')+
    dot(x,y,5,'field-cyan')+label(x,201,'Observer')+label(26,36,'Altitude angle','start')+
    label(26,61,adjusted.toFixed(1)+'°','start')+label(180,224,'Adjust the index arm until the rays meet'));
}

function watchFace(south){
  const x=180,y=128,r=76,point=(h,length)=>[x+Math.sin(h*30*rad)*length,y-Math.cos(h*30*rad)*length];
  const sunAt=south?0:4,poleAt=2;
  let dial=`<circle cx="${x}" cy="${y}" r="${r}" class="field-plate"/>`;
  for(let h=0;h<12;h++)dial+=label(...point(h,r-12).map((v,i)=>v+(i?4:0)),h||12);
  dial+=line(x,y,...point(4,47),'field-cyanline')+line(x,y,...point(0,39),'field-guide')+
    line(...point(poleAt+6,95),...point(poleAt,95),'field-goldline')+dot(x,y,4)+
    dot(...point(sunAt,94),8)+label(...point(sunAt,115).map((v,i)=>v+(i?3:0)),'Sun')+
    label(...point(poleAt,119).map((v,i)=>v+(i?4:0)),south?'N ≈':'S ≈')+
    label(...point(poleAt+6,118).map((v,i)=>v+(i?4:0)),south?'S ≈':'N ≈')+label(180,238,'Example · 4 p.m. standard time');
  return figure('Watch face with a line halfway between the hour hand and twelve',dial);
}

export function mountStarNavigation(root){
  root.innerHTML=`<div class="lab-stack field-lab">
    <article class="lab-card"><h2>Navigation with the Stars</h2>
      <h3>1 · Measure the Sun by day</h3>
      <div class="field-columns"><div><div data-day-sight></div><label>Practice the sight <input data-day-angle type="range" min="0" max="90" step=".5" value="24"></label><output class="lab-readout" data-day-output></output></div>
      <div><p>A sextant sees the horizon directly and brings an image of the Sun down to it through two mirrors. The calibrated scale gives the angle between them. In practice, navigators use the bottom edge of the Sun, called the lower limb, and apply instrument, horizon dip, refraction, and solar-disk corrections.</p>
      <p><strong>For a real Sun sight, use only an instrument with proper solar shades and follow its manual. Never look at the Sun through unfiltered optics.</strong> The exercise here uses a simulated image.</p>
      <p><strong>Noon latitude example.</strong> Around local solar noon, take repeated sights through the Sun’s meridian passage. Suppose the corrected center altitude is 50° and the Sun is due south. It is 90° − 50° = 40° from your zenith. If the Nautical Almanac puts the Sun at declination 10° N, you are at <strong>10° + 40° = 50° N</strong>. If the Sun transits to your north, subtract the zenith distance from the signed declination instead.</p></div></div>
    </article>
    <article class="lab-card"><h3>2 · Use Polaris at night, then solve longitude</h3>
      <div class="field-columns"><div><div data-night-sight></div><label>Practice the star sight <input data-night-angle type="range" min="0" max="90" step=".5" value="20"></label><output class="lab-readout" data-night-output></output></div>
      <div><p><strong>Start with the North Star.</strong> Follow the two outer stars of the Big Dipper’s bowl toward Polaris. Bring the star’s image down to the north horizon. Twilight often makes it easier to see both. Polaris sits close to the north celestial pole, so an altitude of about 45.5° gives a latitude of about <strong>45.5° N</strong>. For precision, use the Nautical Almanac’s Polaris tables and the normal altitude corrections. South of the equator, navigators can use almanac sights of other stars.</p>
      <p><strong>The missing coordinate.</strong> Latitude alone tells you which parallel you’re on. Longitude requires a time comparison. Earth turns 15° per hour relative to mean solar time. If your local <em>mean</em> noon coincides with 3 p.m. Greenwich mean time, you’re three hours behind Greenwich, or <strong>45° W</strong>. In practice, the equation of time converts observed Sun noon to mean noon, and timed sights can also be reduced with an almanac.</p></div></div>
      <h4>The Scilly wrecks and Harrison’s clock</h4>
      <p>In 1707, four Royal Navy ships were lost off the Isles of Scilly. The disaster became a powerful example of the dangers of uncertain position at sea. Parliament’s Longitude Act of 1714 offered up to £20,000 for a practical method. Astronomers pursued lunar distances, while clockmaker John Harrison worked on keeping reference time aboard a moving ship. His compact H4 performed well on an Atlantic trial beginning in 1761. Harrison eventually received payments for his work, including a final parliamentary award in 1773. The original full prize was never formally awarded to any one entrant.</p>
      <p><a href="https://www.rmg.co.uk/stories/time/harrisons-clocks-longitude-problem">Royal Museums Greenwich · Harrison’s timekeepers</a> · <a href="https://aa.usno.navy.mil/data/celnav">U.S. Naval Observatory · sight corrections</a></p>
    </article>
    <article class="lab-card"><h3>3 · Find a rough compass direction with a watch</h3>
      <div class="lab-actions"><label>Hemisphere <select data-hemisphere><option value="north">Northern</option><option value="south">Southern</option></select></label></div>
      <div class="field-columns"><div data-watch></div><div><p>Hold an analog watch flat. Use the direction opposite a vertical stick’s shadow to locate the Sun’s bearing without looking at it. Work in local standard time. If your clock is an hour ahead for summer time, mentally turn it back an hour first.</p>
      <p data-watch-instruction></p>
      <p>On a watch the hour hand turns 30° per hour. The Sun’s hour angle changes about 15° per hour. Halving the watch angle gives a rough north–south line. The Sun’s compass bearing is only an approximation to that geometry. The trick works best as a midlatitude demonstration around the middle of the day. Longitude within a time zone and the Sun’s high altitude can cause large errors. Use a compass or GPS for practical navigation.</p></div></div>
    </article>
  </div>`;
  const setup=(type,nocturnal,target)=>{
    const slider=q(root,'[data-'+type+'-angle]');
    const draw=()=>{
      const value=+slider.value;
      q(root,'[data-'+type+'-sight]').innerHTML=sextantView(nocturnal,value,target);
      q(root,'[data-'+type+'-output]').textContent=value===target?'Sight aligned · '+target+'° altitude':
        'Index arm: '+value.toFixed(1)+'° · '+(value<target?'Increase':'Decrease')+' the reading to align the sight.';
    };
    slider.oninput=draw;draw();
  };
  setup('day',false,50);setup('night',true,45.5);
  const hemisphere=q(root,'[data-hemisphere]');
  const draw=()=>{
    const south=hemisphere.value==='south';
    q(root,'[data-watch]').innerHTML=watchFace(south);
    q(root,'[data-watch-instruction]').textContent=south
      ? 'Point 12 toward the Sun’s bearing. Halfway between 12 and the hour hand is roughly north. The opposite end is roughly south.'
      : 'Point the hour hand toward the Sun’s bearing. Halfway between the hour hand and 12 is roughly south. The opposite end is roughly north.';
  };
  hemisphere.onchange=draw;draw();
  return ()=>{};
}
