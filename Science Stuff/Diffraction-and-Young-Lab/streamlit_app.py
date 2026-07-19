from __future__ import annotations

import streamlit as st


st.set_page_config(
    page_title="Diffraction & uncertainty lab",
    page_icon=":material/blur_on:",
    layout="wide",
)


LAB_HTML = """
<section id="diffraction-lab" aria-label="Interactive laser diffraction experiment">
  <div class="controls">
    <label>Experiment
      <select id="mode"><option value="single">Single slit · diffraction</option><option value="double">Young double slit · interference</option></select>
    </label>
    <label>Slit width <output id="a-out">40 µm</output><input id="aperture" type="range" min="-0.699" max="2.699" value="1.602" step="0.001"></label>
    <label>Laser wavelength <output id="lambda-out">650 nm</output><input id="wavelength" type="range" min="420" max="700" value="650" step="1"></label>
    <label>Screen distance <output id="L-out">2.0 m</output><input id="distance" type="range" min="0.5" max="5" value="2" step="0.1"></label>
    <label id="d-control" hidden>Slit separation <output id="d-out">250 µm</output><input id="separation" type="range" min="80" max="800" value="250" step="5"></label>
    <button id="pause" type="button" aria-pressed="false">Pause photons</button>
  </div>
  <div class="metrics" aria-live="polite">
    <div><span>First minimum from centre</span><strong id="first-min">32.5 mm</strong></div>
    <div><span>Central bright width</span><strong id="central-width">65.0 mm</strong></div>
    <div><span>Diffraction half-angle</span><strong id="angle">0.93°</strong></div>
    <div><span>Position uncertainty Δy</span><strong id="dy">11.5 µm</strong></div>
    <div><span>Heisenberg minimum Δpᵧ</span><strong id="dp-min">4.57×10⁻³⁰ kg·m/s</strong></div>
  </div>
  <div class="stage-wrap">
    <svg id="stage" viewBox="0 0 1120 510" role="img" aria-label="Laser passing through a slit and forming a diffraction pattern on a screen">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect class="room" x="0" y="0" width="1120" height="510" rx="18"/>
      <g class="laser"><rect x="45" y="226" width="112" height="58" rx="14"/><circle id="laser-lens" cx="157" cy="255" r="15"/><text x="101" y="218">LASER</text></g>
      <path id="incoming-beam" d="M157 255 L465 244 L465 266 Z"/>
      <g id="barrier"><rect x="462" y="45" width="14" height="410" rx="5"/><rect id="slit-cover" x="459" y="247" width="20" height="16"/><rect id="slit-cover-2" x="459" y="247" width="20" height="8" hidden/><text id="slit-label" x="469" y="478" text-anchor="middle">one adjustable slit</text></g>
      <g id="wavefronts"></g>
      <path id="fan" d="M476 255 L1000 205 L1000 305 Z"/>
      <line class="axis" x1="157" y1="255" x2="1000" y2="255"/>
      <g id="screen"><rect x="999" y="35" width="28" height="440" rx="10"/><g id="screen-stripes"></g><text x="1013" y="498" text-anchor="middle">screen</text></g>
      <g id="photon-layer"></g>
      <g class="angle-mark"><path id="angle-arc"/><text id="angle-label" x="545" y="235">0.93°</text></g>
      <g class="dimension"><line id="width-line" x1="970" x2="970"/><line id="tick-top" x1="963" x2="977"/><line id="tick-bottom" x1="963" x2="977"/><text id="width-label" x="957" text-anchor="end">65.0 mm</text></g>
    </svg>
    <div class="plot-panel">
      <div class="plot-head"><strong>Predicted intensity on the screen</strong><span id="plot-description">single-slit sinc² envelope</span></div>
      <svg id="plot" viewBox="0 0 1120 240" role="img" aria-label="Relative light intensity across the screen">
        <line class="plot-axis" x1="55" y1="195" x2="1090" y2="195"/><line class="plot-axis" x1="560" y1="25" x2="560" y2="205"/>
        <path id="area"/><path id="curve"/><text x="560" y="225" text-anchor="middle">position on screen y (mm)</text><text x="62" y="32">I / I₀</text>
        <g id="ticks"></g>
      </svg>
    </div>
  </div>
  <div class="uncertainty-strip">
    <div class="formula"><span>Heisenberg</span><strong>Δy · Δpᵧ ≥ ℏ / 2</strong></div>
    <div class="arrow">← narrower slit: smaller Δy</div><div class="tradeoff">therefore a larger possible sideways momentum Δpᵧ → wider beam</div>
  </div>
</section>
"""


LAB_CSS = """
:host{--ink:var(--st-text-color,#eef5ff);--muted:color-mix(in srgb,var(--st-text-color,#eef5ff) 62%,transparent);display:block;color:var(--ink);font-family:var(--st-font,system-ui,sans-serif)}
*{box-sizing:border-box}#diffraction-lab{padding:16px;border-radius:22px;border:1px solid color-mix(in srgb,var(--st-border-color,#51637f) 60%,transparent);background:linear-gradient(145deg,#07101c,#101a30 58%,#081221);overflow:hidden}
.controls{display:grid;grid-template-columns:1.25fr repeat(4,1fr) auto;gap:12px;align-items:end;margin-bottom:13px}.controls label{display:grid;gap:5px;color:#aebed7;font-size:.75rem}.controls output{color:#fff;font-weight:500}.controls input{width:100%;accent-color:#63d6ff}.controls select,.controls button{height:38px;border:1px solid rgba(137,177,220,.35);border-radius:10px;background:#162640;color:#eef5ff;padding:0 10px;font:inherit}.controls button{cursor:pointer;background:#315efb;font-weight:500}
.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}.metrics div{padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.045)}.metrics span{display:block;color:#8da2c0;font-size:.66rem;margin-bottom:2px}.metrics strong{font-size:.86rem;font-weight:500;color:#f4f8ff}
.stage-wrap{border:1px solid rgba(133,157,202,.18);border-radius:17px;overflow:hidden;background:#050b15}.room{fill:#070e1c}.laser rect{fill:#253553;stroke:#607aa5}.laser text,#barrier text,#screen text{fill:#8094b3;font-size:12px;letter-spacing:.06em}.laser circle{filter:url(#glow)}#incoming-beam{opacity:.7;filter:url(#glow)}#barrier rect:first-child{fill:#8794aa}#slit-cover{fill:#050b15}.axis{stroke:#58708f;stroke-width:1;stroke-dasharray:5 8;opacity:.5}#fan{opacity:.17;filter:url(#glow)}#screen rect{fill:#17243b;stroke:#6d82a5}.screen-band{filter:url(#glow)}.wave{fill:none;stroke-width:1.4;opacity:.4}.photon{filter:url(#glow)}.angle-mark path,.dimension line{fill:none;stroke:#8ecdf4;stroke-width:1.5}.angle-mark text,.dimension text{fill:#b9ddf6;font-size:12px}
.plot-panel{border-top:1px solid rgba(133,157,202,.16);padding:10px 12px 2px}.plot-head{display:flex;justify-content:space-between;color:#dfeafa;font-size:.76rem}.plot-head strong{font-weight:500}.plot-head span{color:#87a1c6}.plot-axis{stroke:#617694;stroke-width:1}.plot-panel text{fill:#8499b9;font-size:12px}#curve{fill:none;stroke-width:3;filter:url(#glow)}#area{opacity:.18}.tick{stroke:#536984}.uncertainty-strip{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:12px;color:#9fb3cf;font-size:.76rem}.formula{display:flex;align-items:center;gap:9px;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.06)}.formula span{color:#7fdcff}.formula strong{font-size:1rem;color:#fff;font-weight:500}.arrow{color:#72d6ff}.tradeoff{color:#ffcf68}
@media(max-width:1000px){.controls{grid-template-columns:repeat(3,1fr)}.metrics{grid-template-columns:repeat(3,1fr)}}
@media(max-width:650px){
  #diffraction-lab{padding:9px;border-radius:15px}
  .controls{grid-template-columns:1fr}
  .controls button{width:100%}
  .metrics{grid-template-columns:1fr 1fr}
  .metrics div:last-child{grid-column:1/-1}
  .stage-wrap{overflow:hidden}
  #stage,#plot{display:block;width:100%;height:auto;min-width:0}
  .plot-panel{padding:8px 5px 2px}
  .plot-head{align-items:flex-start;flex-direction:column;gap:3px}
  .uncertainty-strip{align-items:stretch;flex-direction:column;gap:7px}
  .formula{justify-content:center;border-radius:14px}
}
@media(max-width:390px){.metrics{grid-template-columns:1fr}.metrics div:last-child{grid-column:auto}}
"""


LAB_JS = """
const mounted = new WeakMap()
const H=6.62607015e-34, HBAR=1.054571817e-34
function wlColor(w){let r=0,g=0,b=0;if(w<440){r=-(w-440)/20;b=1}else if(w<490){g=(w-440)/50;b=1}else if(w<510){g=1;b=-(w-510)/20}else if(w<580){r=(w-510)/70;g=1}else if(w<645){r=1;g=-(w-645)/65}else r=1;let f=w<420?.4:(w<470?.55+(w-420)/100:(w>645?.55+(700-w)/122:1));return `rgb(${Math.round(255*r*f)},${Math.round(255*g*f)},${Math.round(255*b*f)})`}
function sinc(x){return Math.abs(x)<1e-8?1:Math.sin(x)/x}
function sci(v){if(!isFinite(v))return '—';const e=Math.floor(Math.log10(Math.abs(v))),m=v/10**e;return `${m.toFixed(2)}×10${String(e).replace('-','⁻').replaceAll('0','⁰').replaceAll('1','¹').replaceAll('2','²').replaceAll('3','³').replaceAll('4','⁴').replaceAll('5','⁵').replaceAll('6','⁶').replaceAll('7','⁷').replaceAll('8','⁸').replaceAll('9','⁹')}`}
function intensity(y,s){const beta=Math.PI*s.a*y/(s.lambda*s.L),env=sinc(beta)**2;if(s.mode==='single')return env;const phase=Math.PI*s.d*y/(s.lambda*s.L);return env*Math.cos(phase)**2}
function sampleY(s){const range=s.range;for(let i=0;i<100;i++){const y=(Math.random()*2-1)*range;if(Math.random()<intensity(y,s))return y}return 0}
function update(root,s){
  const color=wlColor(s.lambda*1e9);root.style.setProperty('--laser',color);root.querySelector('#laser-lens').setAttribute('fill',color);root.querySelector('#incoming-beam').setAttribute('fill',color);root.querySelector('#fan').setAttribute('fill',color)
  const y1=s.lambda*s.L/s.a, theta=Math.asin(Math.min(1,s.lambda/s.a)), width=2*y1, dy=s.a/Math.sqrt(12), dp=HBAR/(2*dy);s.range=Math.max(.012,Math.min(.35,y1*4.2))
  root.querySelector('#a-out').textContent=s.a<1e-6?`${(s.a*1e9).toFixed(0)} nm`:`${(s.a*1e6).toFixed(s.a<10e-6?1:0)} µm`;root.querySelector('#lambda-out').textContent=`${(s.lambda*1e9).toFixed(0)} nm`;root.querySelector('#L-out').textContent=`${s.L.toFixed(1)} m`;root.querySelector('#d-out').textContent=`${(s.d*1e6).toFixed(0)} µm`
  root.querySelector('#first-min').textContent=s.lambda>=s.a?'no finite first minimum':`${(y1*1000).toFixed(y1<.1?1:0)} mm`;root.querySelector('#central-width').textContent=s.lambda>=s.a?'fills nearly all directions':`${(width*1000).toFixed(width<.1?1:0)} mm`;root.querySelector('#angle').textContent=`${(theta*180/Math.PI).toFixed(theta<.1?2:1)}°`;root.querySelector('#dy').textContent=`${(dy*1e6).toFixed(dy<1e-6?2:1)} µm`;root.querySelector('#dp-min').textContent=`${sci(dp)} kg·m/s`
  root.querySelector('#d-control').hidden=s.mode!=='double';root.querySelector('#plot-description').textContent=s.mode==='single'?'single-slit sinc² envelope':'Young fringes inside a sinc² envelope'
  const slitPx=Math.max(3,Math.min(46,7+Math.log10(s.a/1e-6)*15)),cover=root.querySelector('#slit-cover'),cover2=root.querySelector('#slit-cover-2'),waves=root.querySelector('#wavefronts')
  if(s.mode==='single'){
    s.slitY1=255;s.slitY2=255;cover.hidden=false;cover2.hidden=true;cover.setAttribute('y',255-slitPx/2);cover.setAttribute('height',slitPx);root.querySelector('#slit-label').textContent='one adjustable slit';waves.innerHTML=''
  }else{
    const sepPx=22+(s.d-80e-6)/(720e-6)*78;s.slitY1=255-sepPx/2;s.slitY2=255+sepPx/2
    cover.hidden=false;cover2.hidden=false;cover.setAttribute('y',s.slitY1-slitPx/2);cover2.setAttribute('y',s.slitY2-slitPx/2);cover.setAttribute('height',slitPx);cover2.setAttribute('height',slitPx);root.querySelector('#slit-label').textContent='two coherent slits'
    waves.innerHTML='';[s.slitY1,s.slitY2].forEach(y=>[55,115,180,250].forEach((r,i)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',`M476 ${y-r} A ${r} ${r} 0 0 1 476 ${y+r}`);p.setAttribute('class','wave');p.setAttribute('stroke',color);p.setAttribute('opacity',String(.42-i*.07));waves.appendChild(p)}))
  }
  const spreadPx=Math.min(205,Math.max(8,Math.tan(theta)*410));root.querySelector('#fan').setAttribute('d',`M476 255 L1000 ${255-spreadPx} L1000 ${255+spreadPx} Z`)
  const yTop=255-spreadPx,yBot=255+spreadPx;for(const id of ['width-line']){const el=root.querySelector('#'+id);el.setAttribute('y1',yTop);el.setAttribute('y2',yBot)}root.querySelector('#tick-top').setAttribute('y1',yTop);root.querySelector('#tick-top').setAttribute('y2',yTop);root.querySelector('#tick-bottom').setAttribute('y1',yBot);root.querySelector('#tick-bottom').setAttribute('y2',yBot);root.querySelector('#width-label').setAttribute('y',(yTop+yBot)/2);root.querySelector('#width-label').textContent=s.lambda>=s.a?'> hemisphere':`${(width*1000).toFixed(width<.1?1:0)} mm`
  root.querySelector('#angle-arc').setAttribute('d',`M516 255 A40 40 0 0 0 ${516+40*Math.cos(theta)} ${255-40*Math.sin(theta)}`);root.querySelector('#angle-label').textContent=`${(theta*180/Math.PI).toFixed(theta<.1?2:1)}°`
  const stripes=root.querySelector('#screen-stripes');stripes.innerHTML='';for(let i=0;i<180;i++){const yp=(i/179*2-1)*s.range,I=intensity(yp,s),r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x','1002');r.setAttribute('y',String(45+i*2.32));r.setAttribute('width',String(21*I+1));r.setAttribute('height','2.7');r.setAttribute('fill',color);r.setAttribute('opacity',String(.08+.92*I));r.classList.add('screen-band');stripes.appendChild(r)}
  let path='',area='M55 195';for(let i=0;i<=520;i++){const x=55+i/520*1035,y=(i/520*2-1)*s.range,I=intensity(y,s),py=195-I*155;path+=`${i?'L':'M'}${x.toFixed(1)} ${py.toFixed(1)} `;area+=` L${x.toFixed(1)} ${py.toFixed(1)}`}area+=' L1090 195 Z';root.querySelector('#curve').setAttribute('d',path);root.querySelector('#curve').setAttribute('stroke',color);root.querySelector('#area').setAttribute('d',area);root.querySelector('#area').setAttribute('fill',color)
  const ticks=root.querySelector('#ticks');ticks.innerHTML='';for(let i=-2;i<=2;i++){const x=560+i*230,t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y','215');t.setAttribute('text-anchor','middle');t.textContent=`${(i*s.range/2*1000).toFixed(0)}`;ticks.appendChild(t)}
}
function animate(root,s,now){if(s.paused)return;const layer=root.querySelector('#photon-layer');if(now-s.last>75){s.last=now;const y=sampleY(s),endY=255-y/s.range*205,p=document.createElementNS('http://www.w3.org/2000/svg','circle'),slitY=s.mode==='double'?(Math.random()<.5?s.slitY1:s.slitY2):255;p.setAttribute('r','3.4');p.setAttribute('fill',wlColor(s.lambda*1e9));p.setAttribute('class','photon');p.dataset.t=now;p.dataset.end=endY;p.dataset.slit=slitY;p.setAttribute('cx','160');p.setAttribute('cy','255');layer.appendChild(p);while(layer.children.length>110)layer.firstChild.remove()}
  for(const p of [...layer.children]){const age=(now-Number(p.dataset.t))/1900;if(age>1){p.remove();continue}let x,y,slitY=Number(p.dataset.slit);if(age<.42){x=160+age/.42*310;y=255+(slitY-255)*age/.42}else{x=470+(age-.42)/.58*540;y=slitY+(Number(p.dataset.end)-slitY)*(age-.42)/.58}p.setAttribute('cx',x);p.setAttribute('cy',y);p.setAttribute('opacity',String(Math.min(1,(1-age)*2)))}s.raf=requestAnimationFrame(n=>animate(root,s,n))}
export default function(component){const{parentElement}=component,root=parentElement.querySelector('#diffraction-lab');if(!root)return;const old=mounted.get(parentElement);if(old){cancelAnimationFrame(old.raf);old.cleanup()}
  const s={mode:'single',a:40e-6,lambda:650e-9,L:2,d:250e-6,range:.14,paused:false,last:0,raf:0},handlers=[]
  const bind=(id,event,fn)=>{const el=root.querySelector('#'+id);el.addEventListener(event,fn);handlers.push([el,event,fn])}
  bind('mode','change',e=>{s.mode=e.target.value;update(root,s)});bind('aperture','input',e=>{s.a=10**Number(e.target.value)*1e-6;update(root,s)});bind('wavelength','input',e=>{s.lambda=Number(e.target.value)*1e-9;update(root,s)});bind('distance','input',e=>{s.L=Number(e.target.value);update(root,s)});bind('separation','input',e=>{s.d=Number(e.target.value)*1e-6;update(root,s)});bind('pause','click',e=>{s.paused=!s.paused;e.target.textContent=s.paused?'Resume photons':'Pause photons';e.target.setAttribute('aria-pressed',String(s.paused));if(!s.paused)s.raf=requestAnimationFrame(n=>animate(root,s,n))})
  const cleanup=()=>handlers.forEach(([e,t,f])=>e.removeEventListener(t,f));s.cleanup=cleanup;mounted.set(parentElement,s);update(root,s);s.raf=requestAnimationFrame(n=>animate(root,s,n));return()=>{cancelAnimationFrame(s.raf);cleanup();mounted.delete(parentElement)}}
"""


lab = st.components.v2.component("diffraction_uncertainty_lab", html=LAB_HTML, css=LAB_CSS, js=LAB_JS)

st.title("Diffraction & uncertainty lab")
st.caption("Shrink a slit, watch a laser spread, then compare single-slit diffraction with Young's two-slit interference.")
lab(key="diffraction_lab", height="content", width="stretch")

with st.expander("The physics behind the experiment", icon=":material/function:"):
    st.markdown(
        r"""
        **Single slit.** For a slit of width $a$, wavelength $\lambda$, screen distance $L$ and screen coordinate $y$, the far-field intensity is
        $$I(y)=I_0\left(\frac{\sin\beta}{\beta}\right)^2,\qquad \beta\approx\frac{\pi ay}{\lambda L}.$$
        The first dark minimum is approximately $y_1=\lambda L/a$, so the central bright region has width $2\lambda L/a$. Making $a$ smaller therefore makes the pattern wider.

        **Heisenberg connection.** Localising a photon across the slit reduces its transverse position spread $\Delta y$. Quantum mechanics requires
        $$\Delta y\,\Delta p_y\geq\frac{\hbar}{2}.$$
        Thus a smaller $\Delta y$ requires a broader distribution of sideways momentum $p_y$, which appears as a broader angular distribution after the slit. The app estimates $\Delta y=a/\sqrt{12}$ for a uniform aperture and displays the corresponding lower bound $\hbar/(2\Delta y)$.

        **Young's experiment.** Two slits add interference fringes. Their approximate spacing is $\Delta y_{fringe}=\lambda L/d$, while each slit still supplies the broader single-slit envelope. The laser is retained because both openings must receive coherent light with a stable phase relationship. Two ordinary independent torches would wash the fringes out. Heisenberg explains the localisation–momentum trade-off; the exact fringe and diffraction shapes come from wave amplitudes interfering.

        The formulas use the Fraunhofer, small-angle approximation when appropriate. When the slit becomes comparable to the wavelength, the simple $y_1=\lambda L/a$ screen formula stops being reliable; the app flags that regime rather than pretending otherwise.
        """
    )

st.caption("© Marco Ventoruzzo 2026 · made with support from Codex")
