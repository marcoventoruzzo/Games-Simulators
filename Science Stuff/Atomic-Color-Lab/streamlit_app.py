Exit code: 0
Wall time: 1.4 seconds
Output:
from __future__ import annotations

import streamlit as st


st.set_page_config(
    page_title="Atomic color lab",
    page_icon=":material/flare:",
    layout="wide",
)


# Shell populations are exact for neutral ground-state atoms.  The animated
# line is a representative observed neutral-atom line; it is deliberately kept
# separate from the colour of the bulk solid under white illumination.
ATOMS = [
    {
        "id": "copper",
        "name": "Copper",
        "symbol": "Cu",
        "atomic_number": 29,
        "shells": [2, 8, 18, 1],
        "configuration": "[Ar] 3dÂ¹â° 4sÂ¹",
        "material_color": "red-orange",
        "material_hex": "#b86238",
        "line": "Cu I Â· representative visible line",
        "wavelength": 510.554,
        "energy": 2.43,
        "photon_color": "#42f58d",
        "glow": "rgba(66,245,141,.58)",
        "note": "Bulk copper reflects red-orange light preferentially. Its 510.554 nm atomic photon is green.",
    },
    {
        "id": "sulfur",
        "name": "Sulfur",
        "symbol": "S",
        "atomic_number": 16,
        "shells": [2, 8, 6],
        "configuration": "[Ne] 3sÂ² 3pâ´",
        "material_color": "yellow",
        "material_hex": "#e7d43b",
        "line": "S I Â· representative visible line",
        "wavelength": 469.411,
        "energy": 2.64,
        "photon_color": "#4f8cff",
        "glow": "rgba(79,140,255,.60)",
        "note": "Solid sulfur reflects yellow light preferentially. This 469.411 nm atomic photon is blue.",
    },
    {
        "id": "silicon",
        "name": "Silicon",
        "symbol": "Si",
        "atomic_number": 14,
        "shells": [2, 8, 4],
        "configuration": "[Ne] 3sÂ² 3pÂ²",
        "material_color": "blue-grey",
        "material_hex": "#657786",
        "line": "Si I Â· representative visible line",
        "wavelength": 390.552,
        "energy": 3.17,
        "photon_color": "#8d5cff",
        "glow": "rgba(141,92,255,.64)",
        "note": "Crystalline silicon looks blue-grey. Its 390.552 nm atomic line is at the violet edge of vision.",
    },
]


COMPONENT_HTML = """
<section id="atomic-lab" aria-label="Interactive atomic colour laboratory">
  <header class="lab-toolbar">
    <div>
      <span class="eyebrow">SOLID COLOUR + ATOMIC EMISSION</span>
      <strong>Compare white-light appearance with one real atomic emission line</strong>
    </div>
    <div class="actions">
      <button id="all-atoms" type="button">Excite all atoms</button>
      <button id="pause" class="quiet" type="button" aria-pressed="false">Pause</button>
      <label>Speed <output id="speed-label">1.0Ã—</output></label>
      <input id="speed" type="range" min=".55" max="1.55" value="1" step=".05">
    </div>
  </header>
  <div id="atom-grid" class="atom-grid"></div>
  <div class="timeline">
    <span><b>1</b> Energy arrives</span><i></i>
    <span><b>2</b> Electron is excited</span><i></i>
    <span><b>3</b> Excited state</span><i></i>
    <span><b>4</b> Relaxation emits a photon</span>
  </div>
</section>
"""


COMPONENT_CSS = """
:host{--ink:#eef5ff;display:block;color:var(--ink);font-family:system-ui,sans-serif}
*{box-sizing:border-box}
#atomic-lab{padding:18px;border:1px solid #334461;border-radius:24px;background:
radial-gradient(circle at 15% 0%,#32448a55,transparent 35%),
linear-gradient(145deg,#07101f,#101a31 58%,#091323);overflow:hidden}
.lab-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:15px}
.lab-toolbar>div:first-child{display:grid;gap:3px}.lab-toolbar strong{font-size:1rem;font-weight:550}
.eyebrow{color:#7fdcff;font-size:.7rem;letter-spacing:.14em;font-weight:700}
.actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;color:#cad6e9}
button{border:1px solid #89b1ff66;border-radius:999px;padding:9px 14px;background:#4768ff;color:white;
font:inherit;cursor:pointer}button.quiet{background:#ffffff12}button:hover{filter:brightness(1.1)}
button:focus-visible,input:focus-visible{outline:3px solid #7fdcff;outline-offset:2px}
#speed{width:105px;accent-color:#7fdcff}.actions label{font-size:.76rem}
.atom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.atom-card{--photon:#fff;--glow:#fff4;position:relative;min-width:0;border:1px solid #859dca40;
border-radius:20px;background:linear-gradient(#ffffff0e,#ffffff05);overflow:hidden}
.atom-card.is-on{border-color:var(--photon);box-shadow:0 0 30px var(--glow)}
.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:9px;padding:14px 15px 3px}
.identity{display:flex;align-items:center;gap:9px}.symbol{display:grid;place-items:center;width:40px;height:40px;
border-radius:12px;background:#d9e5f5;color:#07101f;font-weight:750}.identity h3{margin:0;font-size:1rem}
.identity p{margin:2px 0 0;color:#91a6c7;font-size:.7rem}.toggle{display:flex;align-items:center;gap:6px;
font-size:.72rem;cursor:pointer}.toggle input{width:34px;height:19px;accent-color:var(--photon)}
.material-row{display:flex;align-items:center;gap:8px;padding:4px 15px 0;color:#aebed4;font-size:.72rem}
.swatch{width:28px;height:16px;border-radius:5px;border:1px solid #ffffff66;box-shadow:inset 0 0 7px #fff4}
.scene{display:block;width:100%;height:auto}.orbit{fill:none;stroke:#8cb1e25c;stroke-width:1.15}
.shell-label{fill:#8299bb;font-size:9px}.nucleus{stroke:#ffffff99;stroke-width:1.2}
.nucleus-text{fill:white;font-size:14px;font-weight:650;text-anchor:middle;dominant-baseline:middle}
.electron{fill:#8ef4ff;stroke:#fff;stroke-width:.7;filter:drop-shadow(0 0 4px #59ddff)}
.active-electron{fill:#fff;stroke:var(--photon);stroke-width:2;filter:drop-shadow(0 0 7px var(--photon))}
.energy-arrow{stroke:#fff4;stroke-width:3;stroke-dasharray:5 6}.energy-packet{fill:#fff}
.wave{fill:none;stroke:var(--photon);stroke-width:4;stroke-linecap:round;filter:drop-shadow(0 0 7px var(--photon))}
.photon{fill:var(--photon);filter:drop-shadow(0 0 8px var(--photon))}
.status-box{fill:#07101fe8;stroke:#96b0dc52}.status{fill:#eef5ff;font-size:11px;text-anchor:middle}
.data{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 13px 12px}.datum{padding:8px 9px;
border-radius:10px;background:#ffffff0b;min-width:0}.datum.wide{grid-column:1/-1}.datum span{display:block;
color:#8299bb;font-size:.65rem;margin-bottom:2px}.datum strong{display:block;font-size:.78rem;font-weight:550;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.datum .live{color:var(--photon)}
.note{min-height:48px;margin:0;padding:0 14px 14px;color:#a0b2cd;font-size:.7rem;line-height:1.42}
.timeline{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;color:#aec0d9;font-size:.7rem}
.timeline span{display:flex;align-items:center;gap:5px;white-space:nowrap}.timeline b{display:grid;place-items:center;
width:20px;height:20px;border-radius:50%;background:#243556;color:#8eeeff}.timeline i{width:20px;height:1px;background:#8eeeff55}
@media(max-width:1080px){.atom-grid{grid-template-columns:1fr}.atom-card{max-width:760px;margin:auto;width:100%}}
@media(max-width:680px){#atomic-lab{padding:9px;border-radius:16px}.lab-toolbar{align-items:flex-start;flex-direction:column}
.actions{justify-content:flex-start}.data{grid-template-columns:1fr}.datum.wide{grid-column:auto}.timeline{flex-wrap:wrap;justify-content:flex-start}
.timeline i{display:none}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
"""


COMPONENT_JS = """
const sessions = new WeakMap()

function electronMarkup(atom){
  const radii=[37,59,81,103]
  return atom.shells.map((count,shell)=>{
    return Array.from({length:count},(_,i)=>{
      const a=(Math.PI*2*i/count)+(shell*.37)
      const x=230+Math.cos(a)*radii[shell]
      const y=151+Math.sin(a)*radii[shell]*.52
      const active=shell===atom.shells.length-1 && i===0
      return `<circle class="electron ${active?'active-electron':'static-electron'}"
        data-home-x="${x.toFixed(2)}" data-home-y="${y.toFixed(2)}"
        cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${active?5.5:3.1}"/>`
    }).join('')
  }).join('')
}

function svg(atom,index){
  const radii=[37,59,81,103].slice(0,atom.shells.length)
  return `<svg class="scene" viewBox="0 0 390 300" role="img"
    aria-label="${atom.name}: ${atom.atomic_number} electrons in shells ${atom.shells.join(', ')}">
    <defs><radialGradient id="n-${index}"><stop offset="0" stop-color="#fff"/>
      <stop offset=".3" stop-color="${atom.material_hex}"/><stop offset="1" stop-color="#263e76"/></radialGradient></defs>
    <g class="energy-source"><line class="energy-arrow" x1="28" y1="151" x2="111" y2="151"/>
      <circle class="energy-packet" cx="38" cy="151" r="5"/></g>
    ${radii.map((r,i)=>`<ellipse class="orbit" cx="230" cy="151" rx="${r}" ry="${(r*.52).toFixed(1)}"/>
      <text class="shell-label" x="${230+r-6}" y="${151-(r*.17)}">n=${i+1} Â· ${atom.shells[i]}eâ»</text>`).join('')}
    <circle class="nucleus" cx="230" cy="151" r="24" fill="url(#n-${index})"/>
    <text class="nucleus-text" x="230" y="151">${atom.symbol}</text>
    ${electronMarkup(atom)}
    <g class="emission"><path class="wave"/><circle class="photon" r="5"/></g>
    <rect class="status-box" x="84" y="270" width="292" height="23" rx="12"/>
    <text class="status" x="230" y="286">Ground configuration Â· waiting for excitation</text>
  </svg>`
}

function card(atom,index){
  const el=document.createElement('article')
  el.className='atom-card';el.style.setProperty('--photon',atom.photon_color);el.style.setProperty('--glow',atom.glow)
  el.innerHTML=`<div class="card-head"><div class="identity"><span class="symbol">${atom.symbol}</span>
    <div><h3>${atom.name} Â· Z=${atom.atomic_number}</h3><p>${atom.line}</p></div></div>
    <label class="toggle">Excite <input type="checkbox" aria-label="Excite ${atom.name} atom"></label></div>
    <div class="material-row"><span class="swatch" style="background:${atom.material_hex}"></span>
      Bulk solid in white light: <strong>${atom.material_color}</strong></div>
    ${svg(atom,index)}
    <div class="data">
      <div class="datum"><span>Ground-state shell population</span><strong>${atom.shells.join('â€“')}</strong></div>
      <div class="datum"><span>Electron configuration</span><strong>${atom.configuration}</strong></div>
      <div class="datum"><span>Emitted photon</span><strong class="live">${atom.wavelength.toFixed(3)} nm</strong></div>
      <div class="datum"><span>Photon energy</span><strong>${atom.energy.toFixed(2)} eV</strong></div>
      <div class="datum wide"><span>Current stage</span><strong class="stage">Waiting for excitation</strong></div>
    </div><p class="note">${atom.note}</p>`
  return el
}

function wavePath(x1,x2,y,lambda,phase){
  const p=[];for(let x=x1;x<=x2;x+=4){const yy=y+Math.sin((x-x1)/Math.max(13,lambda/28)*Math.PI*2+phase)*8
    p.push(`${p.length?'L':'M'} ${x.toFixed(1)} ${yy.toFixed(1)}`)}return p.join(' ')
}

function frame(state,now){
  if(state.paused)return
  state.cards.forEach((s,index)=>{
    if(!s.on)return
    const t=((now-state.started+index*390)%(6200/state.speed))/(6200/state.speed)
    const electron=s.el.querySelector('.active-electron'), packet=s.el.querySelector('.energy-packet')
    const wave=s.el.querySelector('.wave'), photon=s.el.querySelector('.photon')
    const status=s.el.querySelector('.status'),stage=s.el.querySelector('.stage')
    const hx=Number(electron.dataset.homeX),hy=Number(electron.dataset.homeY)
    let ex=hx,ey=hy,text='External energy approaches',end=0
    if(t<.28){packet.style.opacity='1';packet.setAttribute('cx',38+(t/.28)*132)}
    else if(t<.43){const p=(t-.28)/.15;packet.style.opacity=String(1-p);ex=hx+(hx-230)*.32*p;ey=hy+(hy-151)*.32*p;text='Energy absorbed Â· electron promoted'}
    else if(t<.60){packet.style.opacity='0';ex=hx+(hx-230)*.32;ey=hy+(hy-151)*.32;text='Atom in a short-lived excited state'}
    else if(t<.73){const p=(t-.60)/.13;packet.style.opacity='0';ex=hx+(hx-230)*.32*(1-p);ey=hy+(hy-151)*.32*(1-p);end=278+p*30;text='Electron relaxes Â· photon emitted'}
    else{packet.style.opacity='0';end=308+((t-.73)/.27)*78;text=`${s.atom.wavelength.toFixed(3)} nm photon leaves the atom`}
    electron.setAttribute('cx',ex);electron.setAttribute('cy',ey)
    if(end){wave.style.opacity='1';photon.style.opacity='1';wave.setAttribute('d',wavePath(278,end,151,s.atom.wavelength,now/180));photon.setAttribute('cx',end);photon.setAttribute('cy',151)}
    else{wave.style.opacity='0';photon.style.opacity='0'}
    status.textContent=text;stage.textContent=text
  })
  state.raf=requestAnimationFrame(n=>frame(state,n))
}

export default function(component){
  const {parentElement,data}=component,root=parentElement.querySelector('#atomic-lab')
  if(!root)return
  const old=sessions.get(parentElement);if(old){cancelAnimationFrame(old.raf);old.cleanup()}
  const grid=root.querySelector('#atom-grid')
  const cards=data.atoms.map((atom,index)=>{const el=card(atom,index);grid.appendChild(el);return{atom,el,on:false}})
  const state={cards,speed:1,paused:false,started:performance.now(),raf:0},handlers=[]
  cards.forEach(s=>{const input=s.el.querySelector('input');const fn=()=>{s.on=input.checked;s.el.classList.toggle('is-on',s.on)
    if(!s.on){s.el.querySelector('.status').textContent='Ground configuration Â· waiting for excitation';s.el.querySelector('.stage').textContent='Waiting for excitation';s.el.querySelector('.wave').style.opacity='0';s.el.querySelector('.photon').style.opacity='0'}}
    input.addEventListener('change',fn);handlers.push([input,'change',fn])})
  const all=root.querySelector('#all-atoms'),pause=root.querySelector('#pause'),speed=root.querySelector('#speed'),label=root.querySelector('#speed-label')
  const allFn=()=>{const on=cards.some(s=>!s.on);cards.forEach(s=>{const i=s.el.querySelector('input');i.checked=on;i.dispatchEvent(new Event('change'))});all.textContent=on?'Stop all atoms':'Excite all atoms'}
  const pauseFn=()=>{state.paused=!state.paused;pause.textContent=state.paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(state.paused));if(!state.paused){state.started=performance.now();state.raf=requestAnimationFrame(n=>frame(state,n))}}
  const speedFn=()=>{state.speed=Number(speed.value);label.textContent=`${state.speed.toFixed(2).replace(/0$/,'')}Ã—`}
  all.addEventListener('click',allFn);pause.addEventListener('click',pauseFn);speed.addEventListener('input',speedFn)
  handlers.push([all,'click',allFn],[pause,'click',pauseFn],[speed,'input',speedFn])
  state.cleanup=()=>handlers.forEach(([el,type,fn])=>el.removeEventListener(type,fn))
  sessions.set(parentElement,state);state.raf=requestAnimationFrame(n=>frame(state,n))
  return()=>{cancelAnimationFrame(state.raf);state.cleanup();sessions.delete(parentElement)}
}
"""


atomic_lab = st.components.v2.component(
    "atomic_color_lab",
    html=COMPONENT_HTML,
    css=COMPONENT_CSS,
    js=COMPONENT_JS,
)


st.title("Atomic color lab")
st.caption(
    "Copper, sulfur and silicon: the colour of the bulk solid under white light "
    "is compared with a representative photon emitted by an excited neutral atom."
)

atomic_lab(data={"atoms": ATOMS}, key="main_atomic_lab", height="content", width="stretch")

with st.expander("What is real â€” and what the diagram simplifies", icon=":material/science:"):
    st.markdown(
        r"""
        **Two different phenomena are shown.** The red-orange of copper, yellow of
        sulfur and blue-grey of crystalline silicon are colours of bulk materials
        under white illumination. They arise from wavelength-dependent absorption,
        reflection and scattering in the solid. They are **not** the colours of the
        individual photons drawn in the emission animation.

        **The ground-state electron counts are real.** Neutral Cu, S and Si have,
        respectively, shell populations 2â€“8â€“18â€“1, 2â€“8â€“6 and 2â€“8â€“4. Their compact
        configurations are [Ar] 3dÂ¹â° 4sÂ¹, [Ne] 3sÂ² 3pâ´ and [Ne] 3sÂ² 3pÂ².

        **The excitation cycle is physically meaningful.** An external energy source
        can promote an electron to an allowed excited state. When the atom relaxes,
        it emits a photon with energy equal to the energy-level difference:
        \(E = hf = hc/\\lambda\). The displayed wavelengths are representative
        observed lines of neutral atoms: Cu I 510.554 nm, S I 469.411 nm and
        Si I 390.552 nm.

        **The picture remains a teaching model.** Electrons do not travel on literal
        planetary rings. The rings show shell populations clearly; real many-electron
        atoms are described by quantum orbitals and term levels. An atom also has many
        possible spectral lines, whose intensities depend on how it is excited.
        White light alone does not necessarily populate the particular upper states
        used in this demonstration; a discharge, heat or collisions may be required.
        """
    )

st.caption("Â© Marco Ventoruzzo 2026 Â· made with support from Codex")

