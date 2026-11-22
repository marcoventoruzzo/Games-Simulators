import {canvasContext} from './scene.js';

const episodes = [
  {
    title:'The first stars', summary:'Follow one possible life of a massive, almost metal-free star.',
    scenes:[
      ['A cloud collapses','Gravity draws together gas made almost entirely of hydrogen and helium, with traces of lithium left from the Big Bang. As the cloud contracts, the center heats up.','cloud','H · He'],
      ['Hydrogen fusion begins','In the hot, dense core, hydrogen nuclei ultimately combine into helium. Fusion releases energy. The resulting heat, gas pressure, and radiation help support the star against gravity.','star','Hydrogen → helium'],
      ['The core changes fuel','When core hydrogen runs low, the core contracts and heats. In a massive star, helium fusion makes carbon and oxygen. Later burning stages build elements such as neon, magnesium, silicon, and sulfur.','shells','H / He / C / Ne / O / Si'],
      ['An iron-group core grows','Silicon burning builds iron-group nuclei. Fusing these nuclei onward does not supply the energy needed to support the core. The outer layers can still contain fuel while the core approaches collapse.','shells','Iron-group core'],
      ['Core collapse and explosion','The core loses support as electrons are captured and energetic photons break apart nuclei. It collapses in a fraction of a second. A shock aided by neutrinos can drive an explosion. Some massive stars instead collapse with little visible explosion.','collapse','Core collapse'],
      ['A supernova enriches its surroundings','The explosion ejects material made during the star’s life and makes some additional nuclei. In this example a neutron star remains. Other collapses leave black holes. The expanding debris carries fresh elements into surrounding gas.','burst','Fresh nuclei enter space']
    ]
  },
  {
    title:'A new generation', summary:'Follow enriched material as it mixes, cools, and becomes part of another star.',
    scenes:[
      ['Debris meets interstellar gas','A supernova remnant expands into surrounding gas. Its ejecta mix with much more hydrogen and helium. The resulting gas can contain traces of carbon, oxygen, silicon, iron, and other elements.','burst','Mixing and enrichment'],
      ['A new cloud takes shape','As parts of the mixture cool, gravity can gather dense fragments. Later clouds can inherit material from several stars and other events over long periods of time.','enriched','H · He · C · O · Si · Fe'],
      ['A protostar grows','A dense fragment collapses. Material falling inward builds a hot central protostar. Some of the surrounding material can settle into a rotating disk.','disk','Cloud → protostar'],
      ['A later star lights up','Hydrogen again becomes helium in the core. The heavier elements were already mixed into the gas that formed this star. Their spectral lines provide clues to the cloud’s chemical history.','star','Mostly H and He, with inherited heavy elements']
    ]
  },
  {
    title:'The Solar System and the Moon', summary:'Follow a separate, much later cloud in the Milky Way, about 4.6 billion years ago.',
    scenes:[
      ['The solar nebula','A region of an enriched cloud collapses. As it spins faster, most material falls toward the growing Sun and the remainder spreads into a rotating disk of gas and dust.','disk','Young Sun and protoplanetary disk'],
      ['Dust becomes worlds','Dust grains clump and grow. Once planetesimals form, gravity helps them merge into larger bodies. In the hot inner disk, rock and metal remain solid and build Mercury, Venus, Earth, and Mars.','inner','Rocky planets'],
      ['Giants and belts take shape','Farther out, more compounds can freeze into solids. Jupiter and Saturn acquired large hydrogen–helium envelopes. Uranus and Neptune have a larger proportion of heavier material, including compounds such as water, ammonia, and methane. Leftover bodies populate the asteroid belt between Mars and Jupiter and the icy Kuiper Belt beyond Neptune.','outer','Gas giants · ice giants · small bodies'],
      ['A giant impact','The leading family of hypotheses proposes that a large body struck the young Earth. This illustration shows a Mars-sized impactor, often called Theia. Its size, the impact conditions, and the mix of material are still studied.','impact','Young Earth and impactor'],
      ['The Moon assembles','Some debris from the collision stays in orbit. It gathers into the Moon. The finished system in the drawing uses enlarged bodies and compressed orbital distances.','moon','Debris disk → Moon']
    ]
  }
];

const TAU=2*Math.PI;
const palette=['#9abdec','#c174ed','#f5bb80','#ffdca2','#80cddc'];
const random=i=>{const n=Math.sin(i*127.1+83.4)*43758.5453;return n-Math.floor(n);};
function disk(c,x,y,r,fill){
  c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
function glow(c,x,y,r,hot='#fff4cf',mid='#ffaf69',edge='#e9574888'){
  const g=c.createRadialGradient(x-r*.22,y-r*.19,0,x,y,r);
  g.addColorStop(0,hot);g.addColorStop(.48,mid);g.addColorStop(1,edge);
  disk(c,x,y,r,g);
}
function label(c,text,x,y,color='#e5efff'){
  c.fillStyle=color;c.font='600 12px system-ui';c.textAlign='center';c.fillText(text,x,y);
}
function particles(c,x,y,r,flatten,phase,count,enriched){
  const opacity=c.globalAlpha;
  for(let i=0;i<count;i++){
    const angle=random(i+200)*TAU+phase*(.24+random(i+50)*.6);
    const d=(.12+.88*Math.sqrt(random(i)))*r;
    c.globalAlpha=opacity*(.25+random(i+120)*.67);
    disk(c,x+Math.cos(angle)*d,y+Math.sin(angle)*d*flatten,.6+random(i+500)*2.5,
      enriched?palette[i%palette.length]:'#9fbee4');
  }
  c.globalAlpha=opacity;
}
function ring(c,x,y,r,flatten,color){
  c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.ellipse(x,y,r,r*flatten,0,0,TAU);c.stroke();
}

function planets(c,x,y,r,outer,phase){
  const bodies=[
    ['Mercury',.11,3,'#c5b3a4'],['Venus',.18,4,'#dfb475'],['Earth',.25,5,'#629af1'],
    ['Mars',.32,4,'#df826e'],['Jupiter',.52,12,'#e4b08c'],['Saturn',.67,10,'#e2c686'],
    ['Uranus',.82,7,'#97d8de'],['Neptune',.95,7,'#698ee7']
  ];
  glow(c,x,y,14);
  if(outer){
    ring(c,x,y,r*.409,.6,'#f7bf7c85');
    ring(c,x,y,r*.435,.6,'#f7bf7c5a');
    ring(c,x,y,r*1.05,.6,'#96caff85');
    ring(c,x,y,r*1.09,.6,'#96caff5a');
  }
  bodies.slice(0,outer?8:4).forEach(([name,d,size,color],i)=>{
    const a=i*.66+phase*.7/Math.sqrt(d);
    const bx=x+Math.cos(a)*r*d, by=y+Math.sin(a)*r*d*.6;
    ring(c,x,y,r*d,.6,'#7f9abe42');disk(c,bx,by,size,color);
    if(name==='Saturn')ring(c,bx,by,size*1.55,.42,'#f5d4a6');
    if(name==='Earth'||name==='Mars'||i>=4)label(c,name,bx,by+(i%2?19:-13));
  });
}

function drawScene(canvas,scene,next,position){
  const env=canvasContext(canvas);if(!env)return;
  const {ctx:c,w,h}=env, x=w*.5,y=h*.43,r=Math.min(w,h)*.33;
  const bg=c.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,'#182442');bg.addColorStop(1,'#070c17');
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(let i=0;i<85;i++)disk(c,random(i+800)*w,random(i+420)*h,.35+random(i)*.9,'#a9badc67');
  const blend=next?Math.max(0,(position-.72)/.28):0;
  const fade=blend*blend*(3-2*blend);
  drawStage(c,w,h,scene,position,1-fade);
  if(fade>0)drawStage(c,w,h,next,0,fade);
}
function drawStage(c,w,h,[,,mode,caption],phase,opacity){
  const x=w*.5,y=h*.43,r=Math.min(w,h)*.33;
  if(opacity<=0)return;
  c.save();c.globalAlpha=opacity;
  if(mode==='cloud'||mode==='enriched'||mode==='disk'){
    const size=r*(mode==='disk'?1.48:1.4-.32*phase);
    glow(c,x,y,size,'#d5bafe','#9c6bcd44','#49418c00');
    particles(c,x,y,size,mode==='disk'?.33:.76,phase,240,mode!=='cloud');
    if(mode==='disk')glow(c,x,y,12+phase*8);
  }else if(mode==='star'){
    glow(c,x,y,r*.94,'#fffdf4','#9dd0fb60','#6282e800');
    glow(c,x,y,r*.50+Math.sin(phase*TAU)*2);
    disk(c,x,y,r*.12,'#fff8d1');
    // An enlarged view of the net reaction, drawn beside the stellar core.
    const ix=w*.78, iy=y-12, jump=Math.min(w*.08,39);
    const f=Math.min(1,phase*1.6);
    for(let i=0;i<4;i++){
      const a=Math.PI/4+i*Math.PI/2, d=jump*(1-f)+5;
      disk(c,ix+Math.cos(a)*d,iy+Math.sin(a)*d,5,f<.85?'#8cc9ff':i%2?'#ffdd9f':'#f99778');
    }
    if(f>.85)ring(c,ix,iy,13,1,'#ffdd9f90');
    label(c,f<.85?'Hydrogen nuclei':'Helium nucleus',ix,iy+61);
    label(c,'Net reaction',ix,iy-51,'#a9c8f5');
    label(c,'Fusion in the core',x,y+r*.85);
  }else if(mode==='shells'){
    for(const [i,color] of ['#ad6551','#d48b61','#ebac77','#ffc77e','#fbdc91','#fff0bd'].entries()){
      disk(c,x,y,r*(.77-i*.103),color);
    }
    label(c,'Burning shells · schematic cutaway',x,y+r+6);
  }else if(mode==='collapse'){
    glow(c,x,y,r*(.72-.46*phase),'#ffffff','#eca082','#9f295f80');
    ring(c,x,y,r*.89,1,'#e4858080');
    for(let i=0;i<8;i++){
      const a=i*TAU/8;c.strokeStyle='#ffa992';c.beginPath();
      c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
      c.lineTo(x+Math.cos(a)*r*.58,y+Math.sin(a)*r*.58);c.stroke();
    }
  }else if(mode==='burst'){
    const s=r*(.58+phase*.86);
    glow(c,x,y,s,'#fff2d7','#fa8eaf50','#7465c300');
    particles(c,x,y,s,1,phase,280,true);disk(c,x,y,4,'#edf7ff');
  }else if(mode==='inner'||mode==='outer'){
    planets(c,x,y,Math.min(w*.42,h*.53),mode==='outer',phase);
    if(mode==='outer')label(c,'Asteroid belt (amber) · Kuiper Belt (blue)',x,h*.77,'#a9c8f5');
  }else{
    const ex=x-r*.22, earth=r*.39;
    glow(c,ex,y,earth,'#d5e9ff','#538bd7','#265086');
    if(mode==='impact'){
      const distance=r*(1.45-phase*1.03);
      glow(c,ex+distance,y-r*.15,earth*.45,'#ffe4c3','#c68e70','#714f59');
      if(phase>.65)particles(c,ex+earth*.9,y,r*.48,.62,phase,75,true);
    }else{
      ring(c,ex,y,r*1.07,.36,'#a6c8ef77');
      particles(c,ex,y,r*1.06,.34,phase,70,true);
      disk(c,ex+Math.cos(phase*.8)*r*.91,y-Math.sin(phase*.8)*r*.31,earth*.26,'#d3d4dd');
    }
  }
  if(opacity>=.5)label(c,caption,x,h*.93,'#ffcf9a');
  c.restore();
}

const enrichmentNote = `<details class="birth-note"><summary>Where do gold, uranium, and the other elements come from?</summary>
<p>Big Bang nucleosynthesis left mostly hydrogen and helium and a little lithium. Fusion in stars makes many nuclei through the iron group. Gold is far beyond iron, and stellar processes can make elements heavier than gold.</p>
<p>Beyond iron, many nuclei grow by capturing neutrons. In evolved stars, <strong>slow neutron capture</strong> can build elements such as barium and lead. <strong>Rapid neutron capture</strong> in neutron-star mergers, and possibly some rare stellar explosions, can make gold and nuclei as heavy as uranium. Neutron capture also occurs in other stellar environments. Some rarer isotopes form through other reactions in hot stellar material, and cosmic rays help make lithium, beryllium, and boron. Several of the heaviest elements on the periodic table are known only from laboratory synthesis.</p>
<p><a href="https://science.nasa.gov/universe/stars/neutron-stars/magnetars/where-does-gold-come-from-nasa-data-has-clues/">NASA · where gold comes from</a></p></details>`;

export function mountBirth(root){
  root.innerHTML='<div class="lab-stack birth-stack">'+episodes.map((episode,i)=>`
    <article class="lab-card birth-card">
      <h2>${episode.title}</h2><p>${episode.summary}</p>
      <canvas aria-label="${episode.title}, animated schematic"></canvas>
      <div class="lab-actions"><button type="button" data-play>Play</button>
        <button type="button" data-reset>Restart</button></div>
      <label>Timeline <input type="range" min="0" max="${episode.scenes.length*100-1}" value="0" step="1"></label>
      <h3 data-stage></h3><p data-description></p>
      ${i===1?enrichmentNote:i===2?'<p><a href="https://science.nasa.gov/solar-system/solar-system-facts/">NASA · Solar System formation</a> · <a href="https://science.nasa.gov/moon/formation/">NASA · Moon formation</a></p>':''}
    </article>`).join('')+fusionMarkup+'</div>';

  const cleanup=[...root.querySelectorAll('.birth-card')].map((card,i)=>{
    const timeline=card.querySelector('input'), play=card.querySelector('[data-play]');
    const heading=card.querySelector('[data-stage]'), description=card.querySelector('[data-description]');
    const canvas=card.querySelector('canvas');
    let frame=0, prior=-1, start=0, from=0;
    function render(){
      const value=Number(timeline.value), index=Math.floor(value/100);
      const scene=episodes[i].scenes[index], [name,note]=scene;
      if(prior!==index){
        heading.textContent=name;description.textContent=note;
        timeline.setAttribute('aria-valuetext',name);prior=index;
      }
      drawScene(canvas,scene,episodes[i].scenes[index+1],(value%100)/100);
    }
    function stop(){
      cancelAnimationFrame(frame);frame=0;play.textContent='Play';
    }
    function advance(now){
      const next=Math.min(Number(timeline.max),from+Math.floor((now-start)/52));
      timeline.value=next;render();
      if(next<Number(timeline.max))frame=requestAnimationFrame(advance);
      else stop();
    }
    play.onclick=()=>{
      if(frame){stop();return;}
      if(timeline.value===timeline.max)timeline.value=0;
      from=Number(timeline.value);start=performance.now();
      frame=requestAnimationFrame(advance);play.textContent='Pause';
    };
    card.querySelector('[data-reset]').onclick=()=>{stop();timeline.value=0;render();};
    timeline.oninput=()=>{stop();render();};
    const resize=new ResizeObserver(render);resize.observe(canvas);render();
    return ()=>{stop();resize.disconnect();};
  });
  cleanup.push(mountFusion(root));
  return ()=>cleanup.forEach(dispose=>dispose());
}

const reactions=[
  ['Hydrogen → helium',[1,1,1,1],2,2,'Four hydrogen nuclei ultimately yield one helium-4 nucleus. In this chain, two protons become neutrons. Positrons and neutrinos also emerge. Energy is carried away by the products and radiation.'],
  ['Helium → carbon',[4,4,4],6,6,'Three helium-4 nuclei can make carbon-12. The first two briefly form beryllium-8. If a third joins before it falls apart, the carbon nucleus can release energy and survive.'],
  ['Carbon + helium → oxygen',[12,4],8,8,'Carbon-12 can capture a helium-4 nucleus and emit a gamma ray, forming oxygen-16. Adding protons changes the element. Oxygen has eight, while carbon has six.']
];
const fusionMarkup=`<article class="lab-card birth-card" data-fusion>
<h2>Zoom into nuclear fusion</h2>
<p>Inside a star, heat strips electrons from atoms. Fusion joins or rearranges the bare nuclei. The number of protons tells you which element you have.</p>
<div class="lab-actions"><label>Reaction <select>${reactions.map(([name],i)=>`<option value="${i}">${name}</option>`).join('')}</select></label><button type="button">Play reaction</button></div>
<canvas aria-label="Diagram of nuclei joining, with different colors for protons and neutrons"></canvas>
<label>Reaction progress <input type="range" min="0" max="100" value="0"></label>
<p><strong style="color:#ffa38e">● Proton</strong> · <strong style="color:#9bcaff">● Neutron</strong> · gold ripple represents energy released</p>
<p data-reaction></p><p>These are net reactions. The drawings enlarge nuclei and compress several steps. A product nucleus can weigh slightly less than the starting particles. The difference appears as released energy.</p>
</article>`;

function mountFusion(root){
  const section=root.querySelector('[data-fusion]');
  const select=section.querySelector('select'), input=section.querySelector('input');
  const button=section.querySelector('button'), canvas=section.querySelector('canvas');
  let frame=0;
  function nucleus(c,x,y,protons,neutrons,r){
    const n=protons+neutrons;
    for(let i=0;i<n;i++){
      const a=i*2.39996,d=Math.sqrt(i)*r*.9;
      disk(c,x+Math.cos(a)*d,y+Math.sin(a)*d,r,i%2===0?'#ffa38e':'#9bcaff');
    }
  }
  function draw(){
    const [name,inputs,p,n,note]=reactions[Number(select.value)];
    section.querySelector('[data-reaction]').textContent=note;
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,x=w/2,y=h*.49,r=Math.min(9,w*.022);
    const t=Number(input.value)/100, merging=Math.min(1,t/.62);
    c.fillStyle='#0d172a';c.fillRect(0,0,w,h);
    label(c,name,x,28);
    if(t<.62){
      inputs.forEach((mass,i)=>{
        const a=i*TAU/inputs.length+.26,d=w*.31*(1-merging)+r*2;
        nucleus(c,x+Math.cos(a)*d,y+Math.sin(a)*d*.56,mass===1?1:mass/2,mass===1?0:mass/2,r);
      });
      label(c,'Starting nuclei',x,h-24);
    }else{
      const wave=(t-.62)/.38;
      ring(c,x,y,20+wave*Math.min(w,h)*.25,1,'rgba(255,206,132,'+(.9-.8*wave)+')');
      nucleus(c,x,y,p,n,r);
      label(c,'Product: '+p+' protons + '+n+' neutrons',x,h-24);
    }
  }
  function stop(){cancelAnimationFrame(frame);frame=0;button.textContent='Play reaction';}
  button.onclick=()=>{
    if(frame){stop();return;}
    input.value=0;
    const start=performance.now();
    button.textContent='Pause';
    function animate(now){
      input.value=Math.min(100,Math.floor((now-start)/33));
      draw();
      if(Number(input.value)<100)frame=requestAnimationFrame(animate);else stop();
    }
    frame=requestAnimationFrame(animate);
  };
  select.onchange=()=>{stop();input.value=0;draw();};
  input.oninput=()=>{stop();draw();};
  const observer=new ResizeObserver(draw);observer.observe(canvas);draw();
  return ()=>{stop();observer.disconnect();};
}
