import {canvasContext} from './scene.js';

const rad=Math.PI/180;
const blue='#a6d5ff',gold='#ffcf90';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const zenith=[0,90],nadir=[0,-90];
const directions=['N','NE','E','SE','S','SW','W','NW'];
const vector=([a,h])=>[Math.cos(h*rad)*Math.sin(a*rad),Math.cos(h*rad)*Math.cos(a*rad),Math.sin(h*rad)];
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);

export function mountZodiacSky(canvas,controls){
  let birth, az=0, el=0, grip;
  function pointAt([a,h]){az=a;el=clamp(h,-90,90);draw();}
  function draw(){
    const env=canvasContext(canvas);if(!env||!birth)return;
    const {ctx:c,w,h}=env;
    const front=vector([az,el]),right=vector([az+90,0]),up=vector([az,el+90]);
    const focal=Math.min(w,h)*.59;
    function project(position){
      const v=vector(position),depth=dot(v,front);
      if(depth<.12)return null;
      return [w/2+focal*dot(v,right)/depth,h/2-focal*dot(v,up)/depth];
    }
    const daytime=birth.sky.Sun[1]>0, showHidden=controls.querySelector('input').checked;
    const bg=c.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,daytime?'#255184':'#09142e');bg.addColorStop(1,daytime?'#83adc9':'#1a2c4c');
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    // Classify each screen row at both edges to draw the geometric horizon even when tilted.
    const edgeAltitude=y=>front[2]+up[2]*(h/2-y)/focal;
    c.fillStyle=daytime?'#354858':'#0d1524';
    for(let y=0;y<h;y+=2)if(edgeAltitude(y)<0)c.fillRect(0,y,w,2);
    function mark(name,position,color,r){
      if(position[1]<-.01&&!showHidden)return;
      const p=project(position);if(!p||p[0]<0||p[0]>w||p[1]<0||p[1]>h)return;
      const [x,y]=p;
      c.save();c.globalAlpha=position[1]<-.01?.58:1;
      c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
      if(name){
        c.font='600 11px system-ui';c.textAlign=x>w*.70?'right':'left';
        const at=x+(x>w*.70?-7:7);
        c.strokeStyle='#14243dee';c.lineWidth=3;c.strokeText(name,at,y-5);c.fillText(name,at,y-5);
      }
      c.restore();
    }
    function trace(values,color,floor){
      c.strokeStyle=color;c.lineWidth=1;c.beginPath();
      let drawing=false;
      for(const v of values){
        const p=project(v);
        if(!p||v[1]<floor){drawing=false;continue;}
        if(drawing)c.lineTo(...p);else c.moveTo(...p);
        drawing=true;
      }
      c.stroke();
    }
    trace(Array.from({length:91},(_,i)=>[i*4,0]),'#d3e3ef80',-1);
    for(const [i,name] of directions.entries())mark(name,[i*45,0],blue,2);
    mark('Zenith',zenith,blue,2.5);
    if(showHidden)mark('Nadir',nadir,blue,2.5);
    if(showHidden||!daytime){
      c.setLineDash([3,4]);trace(birth.ecliptic,'#ffd29d9e',showHidden?-90:0);c.setLineDash([]);
      for(const [name,stars] of Object.entries(birth.constellations)){
        trace(stars,'#cbdeff5e',showHidden?-90:0);
        stars.forEach((p,i)=>mark(i===0?name:'',p,blue,1.9));
      }
    }
    for(const [name,p] of Object.entries(birth.sky)){
      if(showHidden||!daytime||['Sun','Moon','ASC','DSC'].includes(name))mark(name,p,['Sun','ASC','DSC'].includes(name)?gold:'#ecf6ff',name==='Sun'?7:name==='Moon'?4:2.8);
    }
    controls.querySelector('output').textContent=(Math.abs(el)===90?(el>0?'Looking straight up':'Looking straight down'):
      'Facing '+directions[Math.round(((az%360+360)%360)/45)%8])+' · elevation '+Math.round(el)+'°'+(daytime?' · daylight':' · nighttime');
  }
  canvas.onpointerdown=e=>{grip=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
  canvas.onpointerup=canvas.onpointercancel=()=>{grip=null;};
  canvas.onpointermove=e=>{
    if(!grip)return;
    az-=(e.clientX-grip[0])*.31;el=clamp(el+(e.clientY-grip[1])*.31,-85,85);
    grip=[e.clientX,e.clientY];draw();
  };
  canvas.onkeydown=e=>{
    const step={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];
    if(step){e.preventDefault();pointAt([az+step[0],el+step[1]]);}
  };
  controls.onchange=draw;
  controls.onclick=e=>{
    const name=e.target.closest('button')?.dataset.look;
    if(!name||!birth)return;
    pointAt(birth.sky[name]??birth.constellations[name][0]);
  };
  const resize=new ResizeObserver(draw);resize.observe(canvas);
  return {
    set(data){birth=data;pointAt(data.sky.Sun);},
    dispose(){resize.disconnect();}
  };
}
