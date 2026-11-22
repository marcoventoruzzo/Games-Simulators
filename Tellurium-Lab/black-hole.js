import {canvasContext} from './scene.js';

const imageURL=new URL('./assets/sagittarius-a.jpg',import.meta.url).href;
const simulations={
  fall:'Giulia and Pietro',
  escape:'Light sent outward above the horizon',
  graze:'Light passing nearby',
  captured:'Light sent inward across the horizon'
};
const dark='#080e1d', ink='#e6efff', blue='#99c9ff', gold='#ffd091';
function circle(c,x,y,r,fill){
  c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
}
function label(c,s,x,y,fill=ink){
  c.fillStyle=fill;c.textAlign='center';c.font='600 12px system-ui';c.fillText(s,x,y);
}

export function mountBlackHole(root){
  root.innerHTML=`<div class="lab-stack">
  <article class="lab-card black-hole-card"><h2>What a black hole looks like</h2>
    <div class="lab-rows"><figure><img src="${imageURL}" alt="The Event Horizon Telescope image of Sagittarius A*: a blurry orange ring around a dark center"><figcaption>Sagittarius A* · Event Horizon Telescope Collaboration</figcaption></figure>
    <div><p>A <strong>black hole</strong> is a region from which nothing, including light, can escape to the outside universe. Its boundary is the <strong>event horizon</strong>. It is a point of no return, without a solid surface.</p>
    <p>This is the real radio image of the black hole at the center of our Milky Way. The bright ring comes from hot material and light bent by gravity. The dark center is its <strong>shadow</strong>, which appears larger than the event horizon.</p>
    <p><a href="https://www.eso.org/public/images/eso2208-eht-mwh/">Original image and credit</a></p></div></div>
  </article>
  <article class="lab-card black-hole-card"><h2>What happens near the horizon?</h2>
    <p>Use the simulator to follow light or two imaginary explorers. This is a schematic of a non-spinning black hole, viewed from above. Sizes, paths, stretching, and playback times are illustrative.</p>
    <div class="lab-actions"><label>Follow <select data-subject>${Object.entries(simulations).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label>
      <button type="button" data-play>Play</button><button type="button" data-reset>Restart</button></div>
    <label>Progress <input type="range" min="0" max="100" value="0"></label>
    <canvas aria-label="Black hole event horizon with optional light trajectories or imaginary falling explorers"></canvas>
    <p data-feedback></p>
    <p><strong>Spaghettification</strong> is stretching caused by tidal gravity. Point your feet toward the black hole: it pulls more strongly on your feet than on your head. The difference stretches you lengthwise and squeezes you sideways. For a small stellar black hole, this can happen outside the horizon. At a supermassive black hole, tidal forces can be much weaker at the horizon and grow severe deeper inside.</p>
    <p>A light ray always travels locally at light speed. In the drawing the light marker tracks progress along its path. The dimmed figures show the part of the story that takes place inside the horizon. To a distant observer, signals from the explorers grow redder and fainter as they approach it. A person falling in can cross the horizon in finite time on their own clock.</p>
  </article>
  <article class="lab-card"><h2>Where do black holes come from?</h2>
    <p>Some are born when the core of a massive star collapses. They can grow by swallowing matter or by merging with other black holes. Many large galaxies have a supermassive black hole at the center. Ours is called <strong>Sagittarius A*</strong> and has about four million times the Sun’s mass. How the earliest supermassive black holes grew is still being studied.</p>
    <h3>Can a black hole die?</h3>
    <p>Stephen Hawking predicted that black holes can slowly lose energy and mass through <strong>Hawking radiation</strong>. If they lose more than they gain, they can eventually evaporate. For known astronomical black holes this would take enormously longer than the present age of the universe. The radiation has yet to be observed from an astrophysical black hole, and the final stage is uncertain.</p>
    <p><a href="https://science.nasa.gov/apod/frequently-asked-questions-faqs-on-black-holes/">More about black holes · NASA</a></p>
  </article></div>`;
  const subject=root.querySelector('[data-subject]'), progress=root.querySelector('input');
  const play=root.querySelector('[data-play]'), canvas=root.querySelector('canvas');
  const output=root.querySelector('[data-feedback]');
  let frame=0;

  function explorer(c,x,y,stretch,shade){
    c.save();c.translate(x,y);c.scale(1+stretch,.98/(1+.55*stretch));
    circle(c,-8,0,4.2,'#fce8d1');
    c.fillStyle=shade;c.fillRect(-4,-4,12,8);
    c.strokeStyle=shade;c.lineWidth=2;c.beginPath();
    c.moveTo(6,-1);c.lineTo(15,-5);c.moveTo(6,1);c.lineTo(15,5);
    c.moveTo(-1,0);c.lineTo(4,-8);c.moveTo(-1,0);c.lineTo(4,8);c.stroke();
    c.restore();
  }
  function lightPath(c,point,target){
    c.strokeStyle=gold;c.lineWidth=1.65;c.beginPath();
    for(let i=0;i<=100;i++){
      const [x,y]=point(i/100);
      if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.stroke();
    const [x,y]=point(target);circle(c,x,y,5.3,'#fff4bd');
  }
  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,x=w*.42,y=h*.48,r=Math.min(w,h)*.16,t=Number(progress.value)/100, mode=subject.value;
    c.fillStyle=dark;c.fillRect(0,0,w,h);
    for(let i=0;i<70;i++)circle(c,((i*137.37)%100)*w/100,((i*59.93+18)%100)*h/100,.65,'#7996bd80');
    circle(c,x,y,r,'#010204');
    c.setLineDash([5,5]);c.strokeStyle=blue;c.lineWidth=1.4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);
    label(c,'Event horizon',x,y+r+19,blue);
    if(mode==='fall'){
      const d=(w*.44)*(1-t)+r*.6*t;
      const crossing=Math.hypot(d,12)<r, stretch=Math.min(1.6,(r/d)**2);
      c.save();c.globalAlpha=crossing?.28:1;
      explorer(c,x+d,y-12,stretch,'#ef9dc2');
      explorer(c,x+d,y+12,stretch,'#9de0eb');
      c.restore();
      label(c,'Giulia',x+d,y-31);label(c,'Pietro',x+d,y+43);
      output.textContent=crossing?'They have crossed the horizon. No signal sent from inside can reach the outside.':
        stretch>.35?'Their feet are being pulled harder than their heads. Both figures stretch toward the black hole.':
        'Giulia and Pietro are falling feet first. At first, the pull differs only slightly from head to feet.';
    }else if(mode==='escape'){
      lightPath(c,u=>[x+r*(1.28+u*1.5),y],t);
      output.textContent='This photon starts outside the horizon and is aimed straight outward. It can get away.';
    }else if(mode==='graze'){
      lightPath(c,u=>{
        const d=u-.50;
        return [w*(.07+.86*u),y-r*(2.05-2.1*d*d)+r*.86*d];
      },t);
      output.textContent='This photon misses the black hole. Gravity bends its path. A closer pass can instead be captured.';
    }else{
      const crossAt=(w*.89-x-r)/(w*.89-x);
      const point=u=>[w*.89+(x-w*.89)*u,y];
      lightPath(c,u=>point(u*crossAt),Math.min(1,t/crossAt));
      if(t>=crossAt)circle(c,...point(t),4,'#7c613e');
      output.textContent=t>=crossAt?'The photon is now inside. It still moves locally at light speed, but every future light path stays inside.':'This photon is aimed inward. Its path crosses the event horizon.';
    }
  }
  function stop(){cancelAnimationFrame(frame);frame=0;play.textContent='Play';}
  function reset(){stop();progress.value=0;draw();}
  play.onclick=()=>{
    if(frame){stop();return;}
    if(Number(progress.value)===100)progress.value=0;
    const initial=Number(progress.value), start=performance.now();
    play.textContent='Pause';
    function advance(now){
      progress.value=Math.min(100,initial+Math.floor((now-start)/64));draw();
      if(Number(progress.value)<100)frame=requestAnimationFrame(advance);else stop();
    }
    frame=requestAnimationFrame(advance);
  };
  subject.onchange=reset;
  progress.oninput=()=>{stop();draw();};
  root.querySelector('[data-reset]').onclick=reset;
  const resize=new ResizeObserver(draw);resize.observe(canvas);draw();
  return ()=>{stop();resize.disconnect();};
}
