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

const sprite=document.createElement('canvas');
sprite.width=sprite.height=112;
const spriteCtx=sprite.getContext('2d');
const pixels=spriteCtx.createImageData(112,112);
const normals=[];
for(let j=0;j<112;j++)for(let i=0;i<112;i++){
  const x=(i+.5)/56-1,y=1-(j+.5)/56,r=x*x+y*y;
  if(r<1)normals.push([4*(j*112+i),x,y,Math.sqrt(1-r),i,j]);
}

function globe(ctx,p,r,body,camera,light,pole=Z,prime=[1,0,0],red=false) {
  const [cx,cy]=p;
  const [east,up,front]=camera;
  if(body==='sun'){
    const g=ctx.createRadialGradient(cx,cy,r*.7,cx,cy,r*2.2);
    g.addColorStop(0,'#ffb45162');g.addColorStop(.35,'#ff8c3232');g.addColorStop(1,'#ff672300');
    ctx.fillStyle=g;ctx.fillRect(cx-r*2.2,cy-r*2.2,r*4.4,r*4.4);
  }
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
  ctx.drawImage(sprite,cx-r,cy-r,2*r,2*r);
  if(body==='sun'){
    ctx.strokeStyle='#ffe09e';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  }
  if(body==='earth'){
    ctx.strokeStyle='#78bfffce';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  }
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
  const light=fromWorld(toward), pole=fromWorld(frame.pole), prime=fromWorld(frame.spin);
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
    globe(ctx,p,radius,body,camera,body==='moon'?unit(fromWorld(mul(add(frame.earth,frame.moon),-1))):light,
      body==='earth'?pole:normal,body==='earth'?prime:moonPrime(m,normal),
      body==='moon'&&frame.shadow==='Inside Earth’s umbra');
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

function eclipseScene(ctx,w,h,frame,mode,sestri) {
  const y=h*.32, sx=w*.16, ex=w*.73, er=Math.min(27,w*.067), mr=er*.59;
  const sunlight=unit(mul(frame.earth,-1));
  const along=dot(unit(frame.moon),sunlight);
  const signed=(frame.phase+180)%360-180;
  const lunar=mode==='lunar';
  const phaseOffset=lunar?(frame.phase-180):signed;
  const my=y-clamp(frame.latitude*6+phaseOffset*.33,-h*.13,h*.13);
  const mx=ex-along*w*.29;
  const sr=Math.min(38,w*.087);
  const earth=[ex,y],moon=[mx,my],sun=[sx,y];
  const caster=lunar?earth:moon;
  const receiver=lunar?moon:earth;
  const r=lunar?er:mr;
  const end=Math.max(caster[0]+10,receiver[0]+(lunar?mr:er)+11);
  const shadowY=caster[1]+(end-caster[0])*(caster[1]-y)/Math.max(45,caster[0]-sx);
  line(ctx,[[caster[0],caster[1]-r],[end,shadowY-r*1.42],[end,shadowY+r*1.42],[caster[0],caster[1]+r]],'#b990e689',1,[],true,'#9975ca42');
  line(ctx,[[caster[0],caster[1]-r],[end,shadowY-r*.39],[end,shadowY+r*.39],[caster[0],caster[1]+r]],'#986adb99',1,[],true,'#68459ac2');
  for(const off of [-13,13])arrow(ctx,[sx+sr+7,y+off],[sx+sr+w*.09,y+off],'#ffd092b0');
  const basis=[[1,0,0],[0,1,0],Z];
  globe(ctx,sun,sr,'sun',basis,[-1,0,0]);
  globe(ctx,earth,er,'earth',basis,[-1,0,0]);
  globe(ctx,moon,mr,'moon',basis,[-1,0,0],Z,[1,0,0],lunar&&frame.shadow==='Inside Earth’s umbra');
  label(ctx,'SUN',[sx,y+sr+16],color.sun);
  label(ctx,'EARTH',[ex,y+er+18],color.earth);
  label(ctx,'MOON',[clamp(mx,25,w-25),my+(Math.abs(mx-ex)<62?-mr-16:mr+14)],color.moon);

  const by=h*.73, left=w*.12, right=sestri?w*.65:w*.9;
  line(ctx,[[left,by],[right,by]],'#7ebfff9c',1.3,[5,4]);
  line(ctx,[[left,by+h*.089],[right,by-h*.089]],'#beabff',2);
  const node=(left+right)/2;
  ctx.fillStyle='#ffe2a6';ctx.beginPath();ctx.arc(node,by,4,0,TAU);ctx.fill();
  label(ctx,'Node',[node,by+17],color.sun);
  // The marker shows the actual signed ecliptic latitude on the schematic line.
  const progress=clamp(frame.latitude/6,-1,1);
  const marker=[node+progress*(right-left)*.47,by-progress*h*.084];
  ctx.beginPath();ctx.arc(...marker,5,0,TAU);ctx.fillStyle='#f5eeff';ctx.fill();
  label(ctx,'Moon now',[marker[0],marker[1]+(progress>.25?14:-15)],color.moon);
  label(ctx,'Lunar orbit',[right-4,by-h*.089-13],'#d0bbff','right');
  label(ctx,'Earth’s orbital plane',[left,by-11],color.earth,'left');
  label(ctx,'WHY MOST ALIGNMENTS MISS',[w*.5,h*.53],'#d9e6f7');
  if(sestri){
    const inset=Math.min(w*.079,35), center=[w*.84,h*.78];
    // The apparent disks use actual angular radii and separation at Sestri.
    globe(ctx,center,inset,'sun',basis,[-1,0,0]);
    ctx.save();ctx.beginPath();ctx.arc(...center,inset,0,TAU);ctx.clip();
    ctx.fillStyle='#101326';ctx.beginPath();
    ctx.arc(center[0]+sestri.x*inset,center[1]-sestri.y*inset,sestri.ratio*inset,0,TAU);ctx.fill();ctx.restore();
    label(ctx,'FROM SESTRI',[center[0],center[1]+inset+14],color.sun);
  }
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
  line(ctx,[origin,earth],'#ffd09085',1,[5,4]);
  for(const [key,name] of Object.entries(seasonLabels)){
    const p=project(season.markers[key].earth);
    ctx.fillStyle='#a7cfff';ctx.beginPath();ctx.arc(...p,4,0,TAU);ctx.fill();
    const side=p[0]>w*.5;
    label(ctx,name,[clamp(p[0]+(side?8:-8),94,w-94),p[1]-15],color.earth);
    const v=season.markers[key].earth;
    line(ctx,[project(add(v,mul(frame.pole,-.12))),project(add(v,mul(frame.pole,.12)))],'#b9f6e0b5',1.4);
  }
  const a=project(add(frame.earth,mul(frame.pole,-.26))),b=project(add(frame.earth,mul(frame.pole,.26)));
  globe(ctx,earth,er,'earth',camera,unit(mul(frame.earth,-1)),frame.pole,frame.spin);
  arrow(ctx,a,b,'#a5f0d3');label(ctx,'N',[b[0]+9,b[1]-5],'#a5f0d3');
  label(ctx,'EARTH',[earth[0],earth[1]+er+13],color.earth);
  label(ctx,'SUN',[origin[0],origin[1]+sunRadius+13],color.sun);
}
function heliocentric(ctx,w,h,camera,zoom,frame,trajectory,gain){
  if(!trajectory)return;
  const scale=Math.min(w/229,h/133)*zoom;
  const project=v=>[w*.50+dot(v,camera[0])*scale,h*.48-dot(v,camera[1])*scale];
  const {axes,origin,points}=trajectory;
  const e=axes.map(axis=>dot(sub(frame.earth,origin),axis)*AU/1e6);
  const delta=axes.map(axis=>dot(frame.moon,axis)*AU/1e6);
  for(const y of [-35,-20,-5,10,25,40]){
    line(ctx,[project([-95,y,0]),project([95,y,0])],'#7496bc32');
  }
  for(const x of [-90,-60,-30,0,30,60,90]){
    line(ctx,[project([x,-40,0]),project([x,43,0])],'#7496bc32');
  }
  line(ctx,points.map(([e])=>project(e)),color.earth,2.2);
  line(ctx,points.map(([e,m])=>project(add(e,mul(m,gain)))),color.sun,1.6,gain===1?[3,4]:[]);
  const ePoint=project(e),mPoint=project(add(e,mul(delta,gain)));
  line(ctx,[ePoint,mPoint],'#dbe8ff85',1,[3,3]);
  for(const [p,c,text,dy] of [[ePoint,color.earth,'Earth',-15],[mPoint,color.sun,'Moon',16]]){
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(...p,4,0,TAU);ctx.fill();label(ctx,text,[p[0],p[1]+dy],c);
  }
  const sun=project([e[0],e[1]-22,e[2]]);
  line(ctx,[ePoint,sun],'#ffc48488',1,[3,4]);label(ctx,'Toward Sun',[sun[0],sun[1]+11],color.sun);
  const p=project([-60,36,0]),q=project([-30,36,0]);
  line(ctx,[p,q],'#b6c9e0',1);
  if(Math.hypot(p[0]-q[0],p[1]-q[1])>26)label(ctx,'30 million km',[(p[0]+q[0])/2,(p[1]+q[1])/2-10]);
}

export function render(canvas,view,camera,frame,trajectory,gain,lesson){
  const env=canvasContext(canvas);
  if(!env)return;
  const {ctx,w,h}=env;
  gridBg(ctx,w,h);
  if(!frame)return;
  const basis=cameraBasis(camera.az,camera.el);
  if(view==='orbit')heliocentric(ctx,w,h,basis,camera.zoom,frame,trajectory,gain);
  else if(view==='eclipse')eclipseScene(ctx,w,h,frame,lesson.eclipse,lesson.sestri);
  else if(view==='seasons')seasonScene(ctx,w,h,basis,camera.zoom,frame,lesson.season);
  else earthCentered(ctx,w,h,basis,camera.zoom,frame);
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
