export const add = (a,b) => a.map((x,i)=>x+b[i]);
export const sub = (a,b) => a.map((x,i)=>x-b[i]);
export const mul = (a,k) => a.map(x=>x*k);
export const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit = a => mul(a,1/(Math.hypot(...a)||1));
export const Z=[0,0,1], TAU=Math.PI*2;
const AU=149597870.7;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const color={sun:'#ffc484',earth:'#8bbcff',moon:'#e2e9f4',orbit:'#b2a0f9'};
const textures={};

export async function loadTextures() {
  await Promise.allSettled(['earth','moon'].map(async body=>{
    const im=new Image();
    im.src=new URL('assets/'+body+'.webp',import.meta.url);
    await im.decode();
    const c=document.createElement('canvas');
    c.width=im.naturalWidth;c.height=im.naturalHeight;
    const ctx=c.getContext('2d');
    ctx.drawImage(im,0,0);
    textures[body]=ctx.getImageData(0,0,c.width,c.height);
  }));
}

export function canvasContext(canvas) {
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return null;
  const dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  }
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  return {ctx,w,h};
}

const spriteSize=112;
let sunSprite;
const normals=[];
for(let j=0;j<spriteSize;j++)for(let i=0;i<spriteSize;i++){
  const x=(i+.5)/(spriteSize/2)-1,y=1-(j+.5)/(spriteSize/2),r=x*x+y*y;
  if(r<1)normals.push([4*(j*spriteSize+i),x,y,Math.sqrt(1-r),i,j]);
}

function makeGlobeSprite(body,camera,light,pole,prime,red){
  // WebKit may defer drawImage reads. Each submitted sprite must stay immutable.
  const sprite=document.createElement('canvas');
  sprite.width=sprite.height=spriteSize;
  const spriteCtx=sprite.getContext('2d');
  const pixels=spriteCtx.createImageData(spriteSize,spriteSize);
  const [east,up,front]=camera;
  const tex=textures[body], side=cross(pole,prime);
  const l=[dot(light,east),dot(light,up),dot(light,front)];
  const ax=[dot(prime,east),dot(prime,up),dot(prime,front)];
  const ay=[dot(side,east),dot(side,up),dot(side,front)];
  const az=[dot(pole,east),dot(pole,up),dot(pole,front)];
  const data=pixels.data;
  for(const [q,x,y,z,i,j] of normals){
    const lit=clamp(x*l[0]+y*l[1]+z*l[2],0,1);
    if(body==='sun'){
      const noise=Math.sin(i*127.1+j*311.7)*43758.5453;
      const n=2*(noise-Math.floor(noise))-.98+.26*Math.sin(i*.14)*Math.cos(j*.17);
      data[q]=248+9*n;data[q+1]=119+66*z+25*n;data[q+2]=42+66*z+16*n;
    }else{
      let rgb=body==='earth'?[71,144,221]:[171,168,158], at=0;
      if(tex){
        const u=Math.atan2(x*ay[0]+y*ay[1]+z*ay[2],x*ax[0]+y*ax[1]+z*ax[2])/TAU+.5;
        const v=Math.acos(clamp(x*az[0]+y*az[1]+z*az[2],-1,1))/Math.PI;
        at=4*(Math.min(tex.height-1,Math.floor(v*tex.height))*tex.width+Math.floor(u*tex.width)%tex.width);
        rgb=tex.data;
      }
      const k=red?.15+.23*lit:(body==='earth'?.14:.09)+1.13*Math.pow(lit,.49);
      const rim=body==='earth'?26*Math.pow(1-z,4)*lit:0;
      data[q]=k*rgb[at]+(red?41:rim*.28);
      data[q+1]=k*rgb[at+1]*(red?.38:1)+rim*.68;
      data[q+2]=k*rgb[at+2]*(red?.26:1)+rim;
    }
    data[q+3]=Math.min(255,z*1600);
  }
  spriteCtx.putImageData(pixels,0,0);
  return sprite;
}

function globe(ctx,p,r,body,camera,light,pole=Z,prime=[1,0,0],red=false) {
  const [cx,cy]=p;
  if(body==='sun'){
    const g=ctx.createRadialGradient(cx,cy,r*.7,cx,cy,r*2.2);
    g.addColorStop(0,'#ffb45162');g.addColorStop(.35,'#ff8c3232');g.addColorStop(1,'#ff672300');
    ctx.fillStyle=g;ctx.fillRect(cx-r*2.2,cy-r*2.2,r*4.4,r*4.4);
  }
  const sprite=body==='sun' ? (sunSprite??=makeGlobeSprite(body,camera,light,pole,prime,false))
    : makeGlobeSprite(body,camera,light,pole,prime,red);
  ctx.drawImage(sprite,cx-r,cy-r,2*r,2*r);
  if(body==='sun'){
    ctx.strokeStyle='#ffe09e';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  }
  if(body==='earth'){
    ctx.strokeStyle='#78bfffce';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  }
}

let earthSprite, earthTexture;
function staticEarth(ctx,[x,y],r){
  if(!earthSprite||earthTexture!==textures.earth){
    const lon=-Math.PI/6, lat=Math.PI/6;
    const front=[Math.cos(lon)*Math.cos(lat),Math.sin(lon)*Math.cos(lat),Math.sin(lat)];
    const right=[-Math.sin(lon),Math.cos(lon),0];
    earthSprite=makeGlobeSprite('earth',[right,cross(front,right),front],front,Z,[1,0,0],false);
    earthTexture=textures.earth;
  }
  ctx.drawImage(earthSprite,x-r,y-r,2*r,2*r);
}

function line(ctx,pts,stroke,width=1,dash=[],closed=false,fill='') {
  ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=stroke;ctx.lineWidth=width;
  for(let i=0;i<pts.length;i++)i?ctx.lineTo(pts[i][0],pts[i][1]):ctx.moveTo(pts[i][0],pts[i][1]);
  if(closed)ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  ctx.stroke();ctx.setLineDash([]);
}

function label(ctx,text,p,c='#cedbee',align='center'){
  ctx.font='600 11px system-ui';ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.lineWidth=4;ctx.strokeStyle='#080d17';ctx.strokeText(text,p[0],p[1]);ctx.fillStyle=c;ctx.fillText(text,p[0],p[1]);
}

function gridBg(ctx,w,h){
  const bg=ctx.createRadialGradient(w*.5,h*.43,0,w*.5,h*.43,w*.69);
  bg.addColorStop(0,'#15223a');bg.addColorStop(.56,'#090f1e');bg.addColorStop(1,'#060910');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(let i=1;i<=195;i++){
    const x=(Math.sin(i*26.17)*34857.2)%1,y=(Math.sin(i*95.72)*7439.8)%1;
    ctx.fillStyle=i%13===0?'#cbe5ff85':'#a9bde644';
    ctx.fillRect(Math.abs(x)*w,Math.abs(y)*h,i%13===0?1.6:.8,i%13===0?1.6:.8);
  }
}

function cameraBasis(az,el){
  const front=[Math.cos(az)*Math.cos(el),Math.sin(az)*Math.cos(el),Math.sin(el)];
  const right=[-Math.sin(az),Math.cos(az),0];
  return [right,cross(front,right),front];
}
const circle=(r,u,v)=>Array.from({length:121},(_,i)=>add(mul(u,r*Math.cos(i*TAU/120)),mul(v,r*Math.sin(i*TAU/120))));
const moonPrime=(m,n)=>unit(sub(mul(m,-1),mul(n,dot(mul(m,-1),n))));

export function phaseDisc(canvas,frame,local=false){
  const view=canvasContext(canvas);
  if(!view||!frame)return;
  const {ctx,w,h}=view;
  const front=local?frame.skyView:unit(mul(frame.moon,-1));
  const reference=local?frame.zenith:frame.pole;
  let right=unit(cross(reference,front));
  if(Math.hypot(...right)<.1)right=unit(cross([1,0,0],front));
  const up=cross(front,right);
  globe(ctx,[w/2,h/2],Math.min(w,h)*.46,'moon',[right,up,front],
    local?frame.skyLight:unit(mul(add(frame.earth,frame.moon),-1)),frame.normal,
    moonPrime(frame.moon,frame.normal),frame.shadow==='Inside Earth’s umbra');
}

function arrow(ctx,a,b,c){
  line(ctx,[a,b],c,1.25);
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  line(ctx,[b,[b[0]-7*Math.cos(angle-.45),b[1]-7*Math.sin(angle-.45)]],c);
  line(ctx,[b,[b[0]-7*Math.cos(angle+.45),b[1]-7*Math.sin(angle+.45)]],c);
}

function earthCentered(ctx,w,h,camera,zoom,frame){
  const toward=unit(mul(frame.earth,-1));
  const horizontal=unit([toward[0],toward[1],0]);
  const side=unit(cross(Z,horizontal));
  const fromWorld=v=>[-dot(v,horizontal),-dot(v,side),v[2]];
  const m=fromWorld(frame.moon), normal=unit(fromWorld(frame.normal));
  const light=fromWorld(toward);
  const scale=Math.min(w*.153,h*.30)*zoom;
  const project=v=>[w*.54+dot(v,camera[0])*scale,h*.49-dot(v,camera[1])*scale,dot(v,camera[2])];
  const earth=[0,0,0],sun=mul(light,2.84),moon=mul(m,1/.00257);
  const node=unit(cross(Z,normal)),other=unit(cross(normal,node));
  line(ctx,circle(1.49,[1,0,0],[0,1,0]).map(project),'#708dae55',1,[],true,'#35527b22');
  line(ctx,circle(1.01,node,other).map(project),'#8ab8eaad',1.3,[4,4]);
  const axisA=project([-2.34,0,0]), axisB=project([1.28,0,0]);
  const breadth=22*zoom;
  for(const offset of [-breadth,0,breadth]){
    const a=[axisA[0],axisA[1]+offset],b=[axisB[0],axisB[1]+offset];
    if(Math.hypot(a[0]-b[0],a[1]-b[1])>35)arrow(ctx,a,b,'#ffcc827e');
  }
  label(ctx,'SUNLIGHT',[(axisA[0]*2+axisB[0])/3,(axisA[1]*2+axisB[1])/3-breadth-10],color.sun);
  const a=project(earth),b=project(moon);
  line(ctx,[a,b],'#c2e2ff90',1,[3,4]);
  const bodies=[['sun',sun,.37],['earth',earth,.235],['moon',moon,.138]];
  bodies.sort((a,b)=>project(a[1])[2]-project(b[1])[2]);
  for(const [body,v,r] of bodies){
    const p=project(v),radius=Math.max(body==='moon'?8:12,r*scale);
    if(body==='earth')staticEarth(ctx,p,radius);
    else globe(ctx,p,radius,body,camera,body==='moon'?unit(fromWorld(mul(add(frame.earth,frame.moon),-1))):light,
      normal,moonPrime(m,normal),body==='moon'&&frame.shadow==='Inside Earth’s umbra');
  }
  const labels=bodies.map(([body,v,r])=>{
    const [x,y]=project(v);
    return {body,x:clamp(x,24,w-24),y:y+Math.max(12,r*scale)+13};
  }).sort((a,b)=>a.y-b.y);
  for(let i=0;i<labels.length;i++){
    const e=labels[i];
    for(const prev of labels.slice(0,i))if(Math.abs(e.x-prev.x)<53&&Math.abs(e.y-prev.y)<14)e.y=prev.y+15;
    label(ctx,e.body.toUpperCase(),[e.x,e.y],color[e.body]);
  }
}

const flat=[[1,0,0],[0,1,0],Z];
function eclipseScene(ctx,w,h,mode){
  const [family,kind]=mode.split('-'), lunar=family==='lunar', missed=kind==='miss';
  const y=h*.32, sx=w*.15, ax=w*.43, bx=w*.79;
  const r=Math.min(26,w*.055), sunRadius=r*1.32;
  const caster=r*(lunar?1:.65), receiver=r*(lunar?.56:1);
  const spread=r*(lunar?1.55:1.32), core=r*(lunar?.74:.30);
  const targetY=y-(missed?spread+receiver+8:kind==='partial'?(lunar?core:r*1.55):0);
  const tipX=bx+r*.63;
  const sunlight='#ffd092b0';
  for(const offset of [-r*.35,r*.35])arrow(ctx,[sx+sunRadius+4,y+offset],[ax-caster-5,y+offset],sunlight);
  line(ctx,[[ax,y-caster],[tipX,y-spread],[tipX,y+spread],[ax,y+caster]],'#b990e699',1,[],true,'#9a76d45b');
  line(ctx,[[ax,y-caster],[tipX,y-core],[tipX,y+core],[ax,y+caster]],'#a57cdd',1,[],true,'#59377f');
  globe(ctx,[sx,y],sunRadius,'sun',flat,[-1,0,0]);
  if(lunar){
    staticEarth(ctx,[ax,y],caster);
    globe(ctx,[bx,targetY],receiver,'moon',flat,[0,0,1],Z,[1,0,0],kind==='total');
    if(kind==='partial'){
      ctx.save();ctx.beginPath();ctx.arc(bx,targetY,receiver,0,TAU);ctx.clip();
      ctx.fillStyle='#37192bd9';ctx.fillRect(bx-receiver,y-core,2*receiver,2*core);ctx.restore();
    }
  }else{
    globe(ctx,[ax,y],caster,'moon',flat,[-1,0,0]);
    staticEarth(ctx,[bx,targetY],receiver);
    if(!missed){
      ctx.save();ctx.beginPath();ctx.arc(bx,targetY,receiver,0,TAU);ctx.clip();
      ctx.fillStyle='#7d5ba670';ctx.fillRect(bx-receiver,y-spread,2*receiver,2*spread);
      ctx.fillStyle='#22132ddf';ctx.fillRect(bx-receiver,y-core,2*receiver,2*core);ctx.restore();
    }
  }
  label(ctx,'SUN',[sx,y+sunRadius+15],color.sun);
  label(ctx,lunar?'EARTH':'MOON',[ax,y+caster+16],lunar?color.earth:color.moon);
  label(ctx,lunar?'MOON':'EARTH',[bx,targetY+receiver+17],lunar?color.moon:color.earth);
  const mid=(ax+bx)/2;
  if(w>450){
    label(ctx,'Umbra',[mid,y-3],'#f4e5ff');
    label(ctx,'Penumbra',[mid,y-spread-10],'#dbbfff');
  }
  line(ctx,[[w*.10,h*.56],[w*.90,h*.56]],'#42567c');
  const ly=h*.77,l=w*.13,u=w*.87,my=h*.09, node=(l+u)/2;
  label(ctx,'ORBIT PLANES, SEEN EDGE-ON',[w*.5,h*.61],color.moon);
  line(ctx,[[l,ly],[u,ly]],'#7ebfff',1.2,[5,4]);
  line(ctx,[[l,ly+my],[u,ly-my]],'#beabff',2);
  ctx.fillStyle='#ffd092';ctx.beginPath();ctx.arc(node,ly,4,0,TAU);ctx.fill();
  label(ctx,'Node',[node,ly+19],color.sun);
  label(ctx,'Earth’s orbital plane',[l,ly-13],color.earth,'left');
  label(ctx,'Moon’s orbit (~5° tilt)',[u,ly-my-11],'#dbbfff','right');
  const t=missed?.86:kind==='partial'?.60:.51;
  const point=[l+t*(u-l),ly+my*(1-2*t)];
  ctx.fillStyle=color.moon;ctx.beginPath();ctx.arc(...point,5,0,TAU);ctx.fill();
  label(ctx,missed?'Moon well away from node':'Moon near node',[point[0],point[1]+(missed?19:-19)],color.moon);
}

const seasonLabels={mar_equinox:'March equinox',jun_solstice:'June solstice',
  sep_equinox:'September equinox',dec_solstice:'December solstice'};

function seasonScene(ctx,w,h,camera,zoom,frame,season){
  if(!season)return;
  const scale=Math.min(w*.31,h*.33)*zoom;
  const project=v=>[w*.5+scale*dot(v,camera[0]),h*.49-scale*dot(v,camera[1])];
  line(ctx,season.orbit.map(project),'#81a5d1a6',1.3);
  const origin=project([0,0,0]), earth=project(frame.earth);
  const sunRadius=Math.min(38,w*.077), er=Math.min(26,w*.058);
  globe(ctx,origin,sunRadius,'sun',camera,[1,0,0]);
  const sunward=unit(sub(origin,earth).slice(0,2));
  const off=[-sunward[1],sunward[0]];
  const span=Math.hypot(...sub(origin,earth).slice(0,2));
  if(span>sunRadius+er+12){
    for(const k of [-.9,-.6,-.3,0,.3,.6,.9]){
      const offset=mul(off,k*er);
      const surface=add(add(earth,offset),mul(sunward,er*Math.sqrt(1-k*k)));
      const start=add(add(origin,offset),mul(sunward,-Math.sqrt(Math.max(0,sunRadius**2-(k*er)**2))-3));
      arrow(ctx,start,surface,'#ffca80aa');
    }
  }
  for(const [key,name] of Object.entries(seasonLabels)){
    const p=project(season.markers[key].earth);
    ctx.fillStyle='#a7cfff';ctx.beginPath();ctx.arc(...p,4,0,TAU);ctx.fill();
    const solstice=key.endsWith('solstice');
    label(ctx,name,[clamp(p[0],65,w-65),p[1]+(solstice?-47:21)],solstice?color.sun:color.earth);
  }
  // Project the same spatial axis everywhere. Lengthen the drawing of the axis for legibility.
  const shift=[dot(frame.pole,camera[0]),-dot(frame.pole,camera[1])];
  const a=add(earth,mul(shift,-er*2.7)),b=add(earth,mul(shift,er*2.7));
  staticEarth(ctx,earth,er);
  arrow(ctx,a,b,'#b5ffdf');label(ctx,'N',[b[0]+10,b[1]-4],'#b5ffdf');
  // Equal-width parallel beams produce shorter footprints on more directly lit ground.
  if(Math.abs(frame.declination)>1)label(ctx,frame.declination>0?'More direct at 45° N':'More direct at 45° S',
    [w*.5,h*.93],color.sun);
  label(ctx,'EARTH',[earth[0],earth[1]+er+13],color.earth);
  label(ctx,'SUN',[origin[0],origin[1]+sunRadius+13],color.sun);
}
const YEAR=365.256, MONTH=27.322, LUNAR_AU=.00257;
function orbitPoint(day){
  const a=day*TAU/YEAR,b=day*TAU/MONTH;
  return {earth:[Math.cos(a),Math.sin(a),0],moon:[LUNAR_AU*Math.cos(b),LUNAR_AU*Math.sin(b),0],a};
}
function orbitScene(ctx,w,h,{orbitDay:day,orbitView},gain){
  const now=orbitPoint(day), scale=Math.min(w*.40,h*.39);
  const center=[w*.5,h*.48], towardSun=orbitView==='sun';
  const toScreen=v=>[center[0]+scale*v[0],center[1]-scale*v[1]];
  const trail=Array.from({length:220},(_,i)=>orbitPoint(day-55+i*55/219));
  if(!towardSun){
    const ring=Array.from({length:151},(_,i)=>toScreen(orbitPoint(YEAR*i/150).earth));
    line(ctx,ring,'#648bb267',1);
    line(ctx,trail.map(p=>toScreen(p.earth)),color.earth,2.1);
    line(ctx,trail.map(p=>toScreen(add(p.earth,mul(p.moon,gain)))),color.moon,1.25,gain===1?[3,4]:[]);
    globe(ctx,center,Math.min(30,w*.066),'sun',flat,[0,0,1]);
    label(ctx,'SUN',[center[0],center[1]+Math.min(30,w*.066)+14],color.sun);
    const e=toScreen(now.earth), m=toScreen(add(now.earth,mul(now.moon,gain)));
    staticEarth(ctx,e,8);
    ctx.fillStyle=color.moon;ctx.beginPath();ctx.arc(...m,3,0,TAU);ctx.fill();
    label(ctx,'EARTH',[e[0],e[1]-15],color.earth);
    return;
  }
  // Track Earth from the Sun: remove Earth's year-long azimuth while keeping the Moon's
  // displacement perpendicular to the sight line and its actual distance in front or behind.
  const east=[-Math.sin(now.a),Math.cos(now.a),0];
  const radial=dot(now.earth,now.moon);
  const side=dot(east,now.moon)/LUNAR_AU, r=Math.min(w*.29,h*.24);
  const moon=[center[0]+side*r,center[1]];
  line(ctx,[[center[0]-r,center[1]],[center[0]+r,center[1]]],'#799dce88',1,[4,4]);
  const earthRadius=Math.max(15,r*.14), moonRadius=earthRadius*.273;
  const paintMoon=()=>{globe(ctx,moon,moonRadius,'moon',flat,[0,0,1]);};
  if(radial>0)paintMoon();
  staticEarth(ctx,center,earthRadius);
  if(radial<=0)paintMoon();
  label(ctx,'EARTH',[center[0],center[1]+earthRadius+16],color.earth);
  label(ctx,radial<=0?'Moon is closer to the Sun':'Moon is farther from the Sun',
    [center[0],center[1]+earthRadius+45],color.moon);
  label(ctx,'LOOKING FROM THE SUN, FOLLOWING EARTH',[center[0],h*.19],color.sun);
  label(ctx,'Moon moves left and right across the line of sight',[center[0],h*.78],color.moon);
}

export function solsticeDiagram(canvas,declination){
  const env=canvasContext(canvas);
  if(!env)return;
  const {ctx,w,h}=env;
  for(const [i,lat] of [45,-45].entries()){
    const x=w*(i+.5)/2, y=h*.75;
    const altitude=90-Math.abs(lat-declination);
    const a=altitude*Math.PI/180, gap=Math.min(13,w*.033), span=gap/Math.sin(a);
    line(ctx,[[x-w*.21,y],[x+w*.21,y]],'#91a5bb',1);
    for(const j of [-1,0,1]){
      const hit=x+j*span,len=Math.min(h*.48,w*.16);
      arrow(ctx,[hit-len*Math.cos(a),y-len*Math.sin(a)],[hit,y],'#ffc984');
    }
    line(ctx,[[x-span,y+6],[x+span,y+6]],'#8bbcff',3);
    label(ctx,(i?'45° S':'45° N')+' · '+altitude.toFixed(0)+'° noon Sun',[x,h*.14],color.moon);
  }
}

export function render(canvas,view,camera,frame,gain,lesson){
  const env=canvasContext(canvas);
  if(!env)return;
  const {ctx,w,h}=env;
  gridBg(ctx,w,h);
  const basis=cameraBasis(camera.az,camera.el);
  if(view==='orbit')orbitScene(ctx,w,h,lesson,gain);
  else if(view==='eclipse')eclipseScene(ctx,w,h,lesson.eclipse);
  else if(frame&&view==='seasons')seasonScene(ctx,w,h,basis,camera.zoom,frame,lesson.season);
  else if(frame)earthCentered(ctx,w,h,basis,camera.zoom,frame);
}

export function skyChart(canvas,sky,hours,frame){
  const env=canvasContext(canvas);
  if(!env||!sky)return;
  const {ctx,w,h}=env;
  const x=t=>37+t*(w-49)/36, y=alt=>14+(90-alt)*(h-40)/180;
  ctx.fillStyle='#0d1420';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#1a2537';ctx.fillRect(x(0),y(0),x(36)-x(0),y(-90)-y(0));
  for(const alt of [60,30,0,-30,-60]){
    line(ctx,[[x(0),y(alt)],[x(36),y(alt)]],alt===0?'#a4bddb':'#40516c',1,alt===0?[]:[3,4]);
    label(ctx,alt+'°',[29,y(alt)],'#a2b1c8','right');
  }
  for(let t=0;t<=36;t+=6)line(ctx,[[x(t),y(90)],[x(t),y(-90)]],'#53647d65');
  for(const [j,c] of [[1,color.sun],[2,color.earth]]){
    line(ctx,sky.samples.map(row=>[x(row[0]),y(row[j][1])]),c,2);
    const alt=(j===1?frame.sunSky:frame.moonSky)?.[1];
    if(alt!==undefined){
      ctx.beginPath();ctx.arc(x(hours),y(alt),4,0,TAU);ctx.fillStyle=c;ctx.fill();
    }
  }
  line(ctx,[[x(hours),y(90)],[x(hours),y(-90)]],'#d6e8ffac',1,[3,4]);
  label(ctx,'Sun',[x(0)+7,h-12],color.sun,'left');
  label(ctx,'Moon',[x(0)+42,h-12],color.earth,'left');
}

export function skyDome(canvas,sky,frame){
  const env=canvasContext(canvas);
  if(!env||!sky)return;
  const {ctx,w,h}=env, cx=w/2,cy=h/2,r=Math.min(w,h)/2-19;
  const plot=([az,alt])=>{
    const d=r*(1-alt/90), theta=az*TAU/360;
    return [cx+d*Math.sin(theta),cy-d*Math.cos(theta)];
  };
  ctx.fillStyle=frame.sunSky[1]>0?'#1c3145':'#090f1f';ctx.fillRect(0,0,w,h);
  for(const a of [0,30,60]){
    ctx.beginPath();ctx.arc(cx,cy,r*(1-a/90),0,TAU);
    ctx.strokeStyle=a===0?'#9cb6d5':'#53647d75';ctx.stroke();
  }
  for(const [name,az] of [['N',0],['E',90],['S',180],['W',270]])label(ctx,name,plot([az,-12]));
  label(ctx,'Zenith',[cx,cy],'#a2b1c8');
  for(const [j,c,now] of [[1,color.sun,frame.sunSky],[2,color.earth,frame.moonSky]]){
    let segment=[];
    for(const row of sky.samples){
      const position=row[j];
      if(position[1]>=0)segment.push(plot(position));
      else if(segment.length){line(ctx,segment,c+'90',1.3);segment=[];}
    }
    if(segment.length)line(ctx,segment,c+'90',1.3);
    if(now[1]>=0){
      ctx.fillStyle=c;ctx.beginPath();ctx.arc(...plot(now),4.5,0,TAU);ctx.fill();
    }
  }
}
