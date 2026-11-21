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
      const n=Math.sin(i*2.17+j*1.31)*Math.cos(i*.87-j*1.84)+.55*Math.sin(i*.31+j*.47);
      data[q]=248+9*n;data[q+1]=119+66*z+25*n;data[q+2]=42+66*z+16*n;
    }else{
      let rgb=body==='earth'?[71,144,221]:[171,168,158], at=0;
      if(tex){
        const u=Math.atan2(x*ay[0]+y*ay[1]+z*ay[2],x*ax[0]+y*ax[1]+z*ax[2])/TAU+.5;
        const v=Math.acos(clamp(x*az[0]+y*az[1]+z*az[2],-1,1))/Math.PI;
        at=4*(Math.min(tex.height-1,Math.floor(v*tex.height))*tex.width+Math.floor(u*tex.width)%tex.width);
        rgb=tex.data;
      }
      const k=red?.15+.23*lit:.10+.97*Math.pow(lit,.57);
      const rim=body==='earth'?26*Math.pow(1-z,4)*lit:0;
      data[q]=k*rgb[at]+(red?41:rim*.28);
      data[q+1]=k*rgb[at+1]*(red?.38:1)+rim*.68;
      data[q+2]=k*rgb[at+2]*(red?.26:1)+rim;
    }
    data[q+3]=Math.min(255,z*1600);
  }
  spriteCtx.putImageData(pixels,0,0);
  ctx.drawImage(sprite,cx-r,cy-r,2*r,2*r);
  if(body==='earth'){
    ctx.strokeStyle='#78bfff55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
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

function cone(ctx,project,base,direction,start,end,len,side,name){
  const tip=add(base,mul(direction,len));
  const rim=(p,r)=>[add(p,mul(side,r)),add(p,mul(side,-r))];
  const [a,b]=rim(base,start),[c,d]=rim(tip,end);
  line(ctx,[a,c,d,b].map(project),'#f3a66b64',1,[],true,'#d97e4434');
  if(name){const p=project(add(base,mul(direction,len*.69)));label(ctx,name,[p[0],p[1]+15],'#ffc484');}
}

function earthCentered(ctx,w,h,camera,zoom,frame,eclipses){
  const toward=unit(mul(frame.earth,-1));
  const horizontal=unit([toward[0],toward[1],0]);
  const side=unit(cross(Z,horizontal));
  // Align the scene's left-right axis to the Sun; retain ecliptic north.
  const fromWorld=v=>[-dot(v,horizontal),-dot(v,side),v[2]];
  const m=fromWorld(frame.moon),normal=unit(fromWorld(frame.normal));
  const localLight=fromWorld(toward), pole=fromWorld(frame.pole),prime=fromWorld(frame.spin);
  const scale=Math.min(w*.152,h*.27)*zoom;
  const project=v=>[w*.53+dot(v,camera[0])*scale,h*.51-dot(v,camera[1])*scale,dot(v,camera[2])];
  const earth=[0,0,0],sun=mul(localLight,2.86),moon=mul(m,1/.00257);
  const node=unit(cross(Z,normal)),other=unit(cross(normal,node));
  line(ctx,circle(eclipses?1.72:1.48,[1,0,0],[0,1,0]).map(project),'#708dae55',1,[],true,'#35527b22');
  if(eclipses){
    for(const y of [-1,-.5,0,.5,1])line(ctx,[project([-1.45,y,0]),project([1.45,y,0])],'#7998c031');
    line(ctx,circle(1.02,node,other).map(project),'#b2a0f9aa',1.5,[],true,'#9480d321');
    line(ctx,[project(mul(node,-1.38)),project(mul(node,1.38))],'#ac9aefdf',1,[4,4]);
    for(const k of [-1,1]){
      const p=project(mul(node,1.04*k));ctx.fillStyle=color.orbit;ctx.fillRect(p[0]-2,p[1]-2,4,4);
      label(ctx,'Node',[p[0],p[1]+13],color.orbit);
    }
    const sunAway=mul(localLight,-1);
    const direction=unit(sub(moon,sun));
    let silhouette=unit(cross(camera[2],sunAway));
    if(Math.hypot(...silhouette)<.1)silhouette=Z;
    cone(ctx,project,earth,sunAway,.18,.26,1.32,silhouette,'');
    cone(ctx,project,earth,sunAway,.18,.06,1.32,silhouette,'Earth shadow');
    cone(ctx,project,moon,direction,.10,.16,1.15,silhouette,'');
    cone(ctx,project,moon,direction,.10,0,1.15,silhouette,'');
  }else{
    line(ctx,circle(1.02,node,other).map(project),'#8ab8eaad',1.3,[4,4]);
  }
  line(ctx,[project(sun),project(earth)],'#ffc48476',1.2,[5,5]);
  const bodies=[['sun',sun,.37],['earth',earth,.21],['moon',moon,.118]];
  bodies.sort((a,b)=>project(a[1])[2]-project(b[1])[2]);
  for(const [b,v,r] of bodies){
    const p=project(v),radius=Math.max(7,r*scale);
    const light=b==='moon'?unit(fromWorld(mul(add(frame.earth,frame.moon),-1))):localLight;
    globe(ctx,p,radius,b,camera,light,b==='earth'?pole:normal,b==='earth'?prime:moonPrime(m,normal),
      b==='moon'&&frame.shadow==='Inside Earth’s umbra');
  }
  const labels=bodies.map(([b,v,r])=>{const [x,y]=project(v);return {b,x,y:y+Math.max(7,r*scale)+12};}).sort((a,b)=>a.y-b.y);
  for(let i=0;i<labels.length;i++){
    const entry=labels[i];
    for(const prev of labels.slice(0,i))if(Math.abs(entry.x-prev.x)<53&&Math.abs(entry.y-prev.y)<14)entry.y=prev.y+15;
    label(ctx,entry.b[0].toUpperCase()+entry.b.slice(1),[entry.x,entry.y],color[entry.b]);
  }
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

export function render(canvas,view,camera,frame,trajectory,gain){
  const env=canvasContext(canvas);
  if(!env)return;
  const {ctx,w,h}=env;
  gridBg(ctx,w,h);
  if(!frame)return;
  const basis=cameraBasis(camera.az,camera.el);
  if(view==='orbit')heliocentric(ctx,w,h,basis,camera.zoom,frame,trajectory,gain);
  else earthCentered(ctx,w,h,basis,camera.zoom,frame,view==='eclipse');
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
