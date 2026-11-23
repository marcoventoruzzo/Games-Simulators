import {atlasGlobe,canvasContext,loadTextures} from './scene.js';

const AU=149597870.7, LY=9.46073e12, TAU=Math.PI*2;
const observable=46e9*LY;
const stops=[
  ['Milan',3,'A model of the city at ground scale.'],
  ['Earth',19000,'Earth is about 12,742 km across. The gold point marks Milan.'],
  ['Earth and Moon',1.12e6,'The Moon is about 384,400 km from Earth on average.'],
  ['Inner Solar System',4*AU,'Mercury, Venus, Earth and Mars orbit the Sun. Their positions are illustrative; the orbit sizes use mean distances.'],
  ['Outer Solar System',85*AU,'Neptune orbits at about 30 AU. One AU is the mean Earth–Sun distance.'],
  ['Nearby stars',22*LY,'Proxima Centauri is our nearest stellar neighbor, about 4.24 light-years from the Sun.'],
  ['Orion Spur',10000*LY,'The Sun sits inside the Milky Way’s Local Arm, also called the Orion Spur.'],
  ['Milky Way',178000*LY,'Our galaxy spans about 100,000 light-years. Sagittarius A* sits roughly 26,000 light-years from the Sun.'],
  ['Local Group',9e6*LY,'Andromeda is roughly 2.5 million light-years away. Triangulum is a little farther.'],
  ['Cosmic web',2e9*LY,'On this scale galaxies cluster along filaments, with broad voids in between. The pattern is illustrative.'],
  ['Observable universe',2.3*observable,'The ring represents the observable horizon. What lies beyond it remains unknown.']
];
const objects=[
  ['Mercury',.387,2439,'#b4aaa0',.65],['Venus',.723,6052,'#e9cf9f',2.9],
  ['Earth',1,6371,'#7eaff2',0],['Mars',1.524,3390,'#dd8866',-1.1],
  ['Jupiter',5.203,69911,'#dfbd9d',-.7],['Saturn',9.54,58232,'#e5d3a4',2.5],
  ['Uranus',19.2,25362,'#a2deda',-2.15],['Neptune',30.05,24622,'#7198e6',.15]
];
const cap=(n,a,b)=>Math.max(a,Math.min(n,b));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=cap((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function random(seed){const s=Math.sin(seed*91.73+1.12)*43891.234;return s-Math.floor(s)}
function spot(c,x,y,r,color){
  c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
function halo(c,x,y,r,color){
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color+'aa');g.addColorStop(.28,color+'50');g.addColorStop(1,color+'00');
  spot(c,x,y,r,g);
}
function label(c,name,x,y,color='#cadcf1',align='left'){
  c.font='600 11px system-ui';c.textAlign=align;c.strokeStyle='#070b14';c.lineWidth=4;
  c.strokeText(name,x,y);c.fillStyle=color;c.fillText(name,x,y);
}

function distance(km){
  const [value,unit]=km>=LY*.1?[km/LY,'ly']:km>=AU*.5?[km/AU,'AU']:km>=1?[km,'km']:[km*1000,'m'];
  if(value>=1e9)return Number((value/1e9).toPrecision(3))+' billion '+unit;
  if(value>=1e6)return Number((value/1e6).toPrecision(3))+' million '+unit;
  return value.toLocaleString('en-US',{maximumSignificantDigits:3})+' '+unit;
}
function barDistance(span){
  const max=span*.25, power=10**Math.floor(Math.log10(max));
  return [5,2,1].find(n=>n*power<=max)*power;
}

function milkyWayPoints(){
  return Array.from({length:1800},(_,i)=>{
    const r=Math.pow(random(i+100),1.7),arm=(i%4)*TAU/4;
    const a=arm+r*5.3+(random(i+42)-.5)*(.34+.72*r);
    return [r*Math.cos(a),.64*r*Math.sin(a),random(i+500)];
  });
}
function webPoints(){
  return Array.from({length:1900},(_,i)=>{
    const u=random(i+2000),j=i%9, v=(j+.6)/10+.11*Math.sin(u*TAU*(1+j%3)+j)+(random(i+6000)-.5)*.048;
    return [(u-.5)*2,(v-.5)*2,random(i+456)];
  });
}

function solarOrbit(c,x,y,r){
  if(r<3||r>c.canvas.width*7)return;
  c.strokeStyle='#6483a53a';c.lineWidth=1;c.beginPath();c.ellipse(x,y,r,r*.68,0,0,TAU);c.stroke();
}
function drawDistrict(c,w,h,scale,alpha){
  c.save();c.globalAlpha=alpha;
  c.fillStyle='#37484b';c.fillRect(0,0,w,h);
  c.translate(w/2,h*.48);
  const step=cap(w*.11*(3/scale)**.33,5,w*.35);
  c.rotate(-.24);
  for(let row=-28;row<=28;row++)for(let col=-28;col<=28;col++){
    const x=col*step,y=row*step;
    if(Math.abs(x)>w*.85||Math.abs(y)>h*.88+w*.2)continue;
    const n=random(row*97+col),pad=step*.12;
    c.fillStyle=n>.86?'#506857':n>.55?'#756f62':'#5c6060';
    c.fillRect(x+pad,y+pad,step-pad*1.7,step-pad*1.7);
    if(step>13&&n<.86){
      c.fillStyle='#93918866';c.fillRect(x+pad*1.4,y+pad*1.4,step*.43,step*.22);
    }
  }
  c.restore();
}

export function mountCosmicZoom(root){
  root.innerHTML=`<article class="lab-card explorer cosmic-zoom"><h2>From Earth to the observable universe</h2>
    <div class="flight-window"><canvas aria-label="Continuous zoom from Milan and Earth, past stellar and galactic scales, to the observable horizon"></canvas>
      <div class="flight-marker" data-flight-title></div></div>
    <div class="flight-scale"><div><span data-flight-ruler></span><strong data-flight-length></strong></div><span data-flight-width></span></div>
    <label class="journey-slider">Zoom distance <input type="range" min="${Math.log10(stops[0][1])}" max="${Math.log10(stops.at(-1)[1])}" step="any" value="${Math.log10(stops[0][1])}" data-flight-slider></label>
    <div class="journey-controls"><button type="button" data-flight-play>Play zoom</button><div class="journey-ticks"><button type="button" data-go="1">Earth</button><button type="button" data-go="4">Solar System</button><button type="button" data-go="7">Milky Way</button><button type="button" data-go="10">Observable universe</button></div></div>
    <p class="flight-note" data-flight-note></p>
    <p class="fine">The ruler measures the width of this view. Local landmarks, orbit orientations, spiral arms and cosmic structure are schematic. Tiny objects use enlarged markers so you can keep track of them.</p>
    <section class="cosmic-expansion"><h3>Why is the observable universe about 92 billion light-years across?</h3>
      <p>If space had stayed the same size for 13.8 billion years, light could have traveled at most 13.8 billion light-years toward us from any direction. The observable diameter would be about 27.6 billion light-years.</p>
      <p>Space expanded while the light was traveling. The regions at the edge of what we can observe are now about 46 billion light-years away. Double that for the estimated present-day diameter of the observable universe. The size of the whole universe is unknown.</p>
      <div class="cosmic-elastic"><div aria-hidden="true"><span></span><span></span></div><label>Stretch the elastic <input type="range" min="0" max="100" value="0" data-stretch></label></div>
      <p>Two dots on an elastic get farther apart when you stretch it. Here they stand for galaxies held together by gravity. The space between distant galaxies expands while the stars inside each galaxy remain bound.</p>
      <p><a href="https://www.nasa.gov/science-research/astrophysics/how-big-is-space-we-asked-a-nasa-expert-episode-61/">NASA · How big is space?</a></p>
    </section></article>`;
  const q=s=>root.querySelector(s),canvas=q('canvas'),slider=q('[data-flight-slider]'),play=q('[data-flight-play]');
  const title=q('[data-flight-title]'),note=q('[data-flight-note]'),ruler=q('[data-flight-ruler]'),width=q('[data-flight-width]'),length=q('[data-flight-length]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const galaxy=milkyWayPoints(),filaments=webPoints();
  const min=+slider.min,max=+slider.max;
  const checkpoints=[4,7,10].map(i=>Math.log10(stops[i][1]));
  let z=min,frame=0,chapter=-1,closed=false,paused=false;

  function draw(){
    const env=canvasContext(canvas);if(!env)return;
    const {ctx:c,w,h}=env,span=10**z,px=Math.min(w,h)/span,cx=w*.5,cy=h*.48;
    const viewWidth=w/px;
    const at=(x,y)=>[cx+x*px,cy+y*px];
    const scene=stops.findLastIndex(([,km])=>km<=span*1.15);
    const index=Math.max(0,scene);
    if(chapter!==index){chapter=index;title.textContent=stops[index][0];note.textContent=stops[index][2]}
    const bar=z>=max-1e-8?50e9*LY:barDistance(viewWidth);
    ruler.style.width=(bar/viewWidth*100)+'%';length.textContent=distance(bar);
    width.textContent='View width · '+distance(viewWidth);
    slider.setAttribute('aria-valuetext',distance(viewWidth)+' across · '+stops[index][0]);
    c.fillStyle='#03070f';c.fillRect(0,0,w,h);
    for(let i=0;i<165;i++){
      const x=((random(i+800)-.5)*w*(1+.016*z)+w)%w;
      const y=((random(i+1100)-.5)*h*(1+.012*z)+h)%h;
      spot(c,x,y,.32+random(i+360)*.93,i%9===0?'#d5b69d8a':'#9cb9dd65');
    }
    if(span<LY*.55){
      const focus=smooth(AU*.55,AU*5,span), sunX=AU*(focus-1), earthR=6371*px;
      function mark(name,x,y,r,color,minimum=0,align='left'){
        const [sx,sy]=at(x,y);
        if(sx<-r-15||sx>w+r+15||sy<-r-15||sy>h+r+15)return;
        if(r>=1.2)spot(c,sx,sy,r,color);
        else if(minimum&&w>0)spot(c,sx,sy,minimum,color);
        if((minimum||r>=1.2)&&sy>15&&sy<h-8)label(c,name,sx+(align==='right'?-8:8),sy-9,color,align);
      }
      if(earthR<Math.min(w,h)*.61&&earthR>2){
        const [ex,ey]=at(AU*focus,0);
        halo(c,ex,ey,earthR*1.14,'#6cbeff');atlasGlobe(c,ex,ey,earthR,'earth');
        if(earthR>15){spot(c,ex,ey,3.3,'#ffd294');label(c,'Milan',ex+8,ey-8,'#ffd294')}
        if(span>65000)label(c,'Earth',ex+earthR+7,ey+7);
      }else if(earthR<=2&&span<120*AU){mark('Earth',AU*focus,0,earthR,'#88b9ff',1.6)}
      if(span>92000&&span<14e6){
        const [mx,my]=at(AU*focus+384400,-56000),r=1737.4*px;
        if(mx>0&&mx<w&&my>0&&my<h&&r>1.3){atlasGlobe(c,mx,my,r,'moon');label(c,'Moon',mx+7,my-8)}
        else mark('Moon',AU*focus+384400,-56000,r,'#c3c9d2',1.2);
      }
      if(span>AU*.7){
        const [sx,sy]=at(sunX,0);
        if(sx>-16&&sx<w+16)halo(c,sx,sy,Math.max(9,696340*px*3),'#ffad63');
        mark(span>150*AU?'Solar System':'Sun',sunX,0,696340*px,'#ffcd8e',2);
        if(span<140*AU){
          for(const [name,orbit,r,color,angle] of objects){
            solarOrbit(c,sx,sy,orbit*AU*px);
            if(name!=='Earth')mark(name,sunX+orbit*AU*Math.cos(angle),orbit*AU*Math.sin(angle)*.68,r*px,color,1.35,angle>0&&angle<3?'right':'left');
          }
        }
      }
      if(span<21000){
        const [ex,ey]=at(0,0), rr=Math.max(earthR,1);
        if(span>=80&&earthR>=Math.min(w,h)*.61){
          const globeR=Math.min(rr,Math.max(w,h)*2), offset=smooth(1200,21000,span)*.45;
          atlasGlobe(c,ex,ey+globeR*offset,globeR,'earth');
        }
        const alpha=1-smooth(25,420,span);
        if(alpha>0)drawDistrict(c,w,h,span,alpha);
        if(span<14500){spot(c,cx,cy,3.5,'#ffd294');label(c,'Milan',cx+9,cy-9,'#ffd294')}
      }
    }
    if(span>=LY*.55&&span<8e6*LY){
      const sunPoint=at(0,0),galactic=at(26000*LY,0),r=50000*LY*px;
      if(span>4800*LY){
        const [gx,gy]=galactic;
        if(r>=2.5&&r<w*12){
          c.save();c.globalAlpha=smooth(4800,16000,span/LY);
          halo(c,gx,gy,Math.max(8,r*.41),'#c9a8a1');
          for(const [a,b,k] of galaxy){
            const x=gx+a*r,y=gy+b*r;
            if(x>0&&x<w&&y>0&&y<h)spot(c,x,y,.45+k*.8,k>.78?'#dfb08792':'#91a9e26e');
          }
          c.restore();
        }
        if(gx>18&&gx<w-20&&r>5){
          spot(c,gx,gy,2.5,'#ffc389');label(c,'Sagittarius A*',gx+8,gy+14,'#ffc389');
        }
      }
      if(span<220000*LY){spot(c,...sunPoint,2.2,'#ffe1aa');label(c,span>220*LY?'Solar System · Orion Spur':'Sun',cx+8,cy-10,'#ffe1aa')}
      if(span<135*LY){
        for(const [name,x,y,color] of [['Proxima Centauri',4.24,0,'#f19c83'],['Sirius',-5.6,6.55,'#adcfff'],['Barnard’s Star',-5.96,0,'#f5af86']]){
          const [sx,sy]=at(x*LY,y*LY);
          if(sx<10||sx>w-10||sy<11||sy>h-12)continue;
          halo(c,sx,sy,10,color);spot(c,sx,sy,2,color);label(c,name,sx+(x>0?-7:7),sy-8,color,x>0?'right':'left');
        }
      }
    }
    if(span>=220000*LY&&span<95e6*LY){
      spot(c,cx,cy,2.4,'#ffcf8d');label(c,'Milky Way',cx+9,cy+14,'#ffcf8d');
      for(const [name,x,y] of [['Andromeda',2.5e6,0],['Triangulum',2.64e6,.7e6]]){
        const [sx,sy]=at(x*LY,y*LY);
        if(sx>w-15||sy>h-16)continue;
        halo(c,sx,sy,Math.max(7,90000*LY*px),'#a5b9ef');spot(c,sx,sy,2.2,'#c1d5ff');label(c,name,sx-8,sy-9,'#d4e3ff','right');
      }
    }
    if(span>=9e6*LY){
      const fade=smooth(9e6,105e6,span/LY), horizon=observable*px;
      c.save();c.globalAlpha=fade;
      if(horizon<Math.hypot(w,h)){
        c.beginPath();c.arc(cx,cy,horizon,0,TAU);c.clip();
      }
      for(const [a,b,k] of filaments){
        const xx=cx+a*w*.66,yy=cy+b*h*.73;
        if(xx>0&&xx<w&&yy>0&&yy<h)spot(c,xx,yy,.36+k*.88,k>.82?'#e4ae90ab':'#99a4e88a');
      }
      c.restore();
      if(horizon<Math.hypot(w,h)){
        c.beginPath();c.arc(cx,cy,horizon,0,TAU);c.strokeStyle='#b7d1fc80';c.lineWidth=1;c.stroke();
      }
      if(horizon<w*.49&&horizon<h*.58)label(c,'Observable horizon',cx,Math.max(19,cy-horizon-9),'#a7c8ff','center');
      spot(c,cx,cy,2.7,'#ffe0a1');label(c,'Milky Way · our viewpoint',cx+8,cy-9,'#ffe0a1');
    }
    const measurement=checkpoints.findIndex(point=>Math.abs(point-z)<1e-8);
    if(measurement>=0){
      const [center,radius,name]=[
        [0,30.05*AU,'Solar System · 60.1 AU across Neptune’s orbit'],
        [26000*LY,50000*LY,'Milky Way · about 100,000 ly'],
        [0,observable,'Observable diameter · about 92 billion ly']
      ][measurement];
      const [left]=at(center-radius,0),[right]=at(center+radius,0),by=cy+Math.min(34,h*.1);
      c.beginPath();c.moveTo(left,by-8);c.lineTo(left,by+8);c.moveTo(left,by);c.lineTo(right,by);
      c.moveTo(right,by-8);c.lineTo(right,by+8);c.strokeStyle='#ffd18e';c.lineWidth=1.8;c.stroke();
      label(c,name,(left+right)/2,by+21,'#ffe2ab','center');
    }

  }
  function render(value){z=cap(value,min,max);slider.value=String(z);draw()}
  function stop(){cancelAnimationFrame(frame);frame=0;play.textContent=paused?'Continue zoom':'Play zoom'}
  function go(target,duration,checkpoint=false){
    paused=false;stop();
    if(reduced.matches){render(target);paused=checkpoint;stop();return}
    const from=z,start=performance.now();
    play.textContent='Pause';
    function tick(now){
      const t=cap((now-start)/duration,0,1), easing=t<1?t*t*(3-2*t):1;
      render(lerp(from,target,easing));
      if(t<1)frame=requestAnimationFrame(tick);else{paused=checkpoint;stop();}
    }
    frame=requestAnimationFrame(tick);
  }
  slider.oninput=()=>{const value=+slider.value;stop();render(value)};
  slider.onkeydown=event=>{
    const step={ArrowRight:.08,ArrowUp:.08,ArrowLeft:-.08,ArrowDown:-.08}[event.key];
    if(step){event.preventDefault();stop();render(z+step)}
  };
  play.onclick=()=>{
    if(frame){paused=true;stop();return}
    if(z>=max-.001)render(min);
    const next=checkpoints.find(point=>point>z+1e-7)??max;
    go(next,Math.max(900,26000*(next-z)/(max-min)),next<max-1e-7);
  };
  for(const button of root.querySelectorAll('[data-go]'))button.onclick=()=>go(Math.log10(stops[+button.dataset.go][1]),1300);
  q('[data-stretch]').oninput=event=>q('.cosmic-elastic>div').style.width=(34+.64*Number(event.target.value))+'%';
  const resize=new ResizeObserver(draw);resize.observe(canvas);render(min);
  void loadTextures().then(()=>{if(!closed)draw()});
  return ()=>{closed=true;stop();resize.disconnect()};
}
