from __future__ import annotations

import streamlit as st


st.set_page_config(
    page_title="Atomic color lab",
    page_icon=":material/flare:",
    layout="wide",
)


ATOMS = [
    {
        "id": "hydrogen",
        "name": "Hydrogen",
        "symbol": "H",
        "line": "H-alpha line",
        "transition": "n = 3 → n = 2",
        "absorption": "n = 2 → n = 3",
        "wavelength": 656.3,
        "energy": 1.89,
        "color": "#ff453a",
        "glow": "rgba(255,69,58,.55)",
        "level": 3,
        "note": "A famous red line in hydrogen's visible spectrum.",
    },
    {
        "id": "sodium",
        "name": "Sodium",
        "symbol": "Na",
        "line": "Sodium D₂ line",
        "transition": "3p ²P°₃/₂ → 3s ²S₁/₂",
        "absorption": "3s ²S₁/₂ → 3p ²P°₃/₂",
        "wavelength": 589.0,
        "energy": 2.10,
        "color": "#ffd60a",
        "glow": "rgba(255,214,10,.55)",
        "level": 2,
        "note": "The yellow-orange glow of many sodium street lamps.",
    },
    {
        "id": "mercury",
        "name": "Mercury",
        "symbol": "Hg",
        "line": "Blue mercury line",
        "transition": "6s7s ³S₁ → 6s6p ³P₁",
        "absorption": "6s6p ³P₁ → 6s7s ³S₁",
        "wavelength": 435.8,
        "energy": 2.85,
        "color": "#32a8ff",
        "glow": "rgba(50,168,255,.60)",
        "level": 3,
        "note": "One strong blue line in mercury's richer spectrum.",
    },
]


COMPONENT_HTML = """
<section id="atomic-lab" aria-label="Interactive atomic emission laboratory">
  <div class="lab-toolbar">
    <div class="toolbar-copy">
      <span class="eyebrow">LIVE ATOMIC VIEW</span>
      <strong>Switch on a lamp and follow one energy packet</strong>
    </div>
    <div class="toolbar-actions">
      <button id="all-lamps" type="button">Switch all lamps on</button>
      <button id="pause-motion" class="quiet" type="button" aria-pressed="false">Pause</button>
      <label for="speed">Animation speed <output id="speed-label">1.0×</output></label>
      <input id="speed" type="range" min="0.55" max="1.55" value="1" step="0.05" />
    </div>
  </div>
  <div id="atom-grid" class="atom-grid"></div>
  <div class="timeline" aria-label="Animation sequence">
    <span><b>1</b> Matching light arrives</span>
    <i></i><span><b>2</b> Electron absorbs energy</span>
    <i></i><span><b>3</b> Electron jumps up</span>
    <i></i><span><b>4</b> Electron falls and emits color</span>
  </div>
</section>
"""


COMPONENT_CSS = """
:host {
  --ink: var(--st-text-color, #eaf2ff);
  --muted: color-mix(in srgb, var(--st-text-color, #eaf2ff) 64%, transparent);
  --panel: color-mix(in srgb, var(--st-secondary-background-color, #17233c) 82%, transparent);
  --line: color-mix(in srgb, var(--st-border-color, #6c7d99) 58%, transparent);
  display: block;
  color: var(--ink);
  font-family: var(--st-font, system-ui, sans-serif);
}
* { box-sizing: border-box; }
#atomic-lab {
  min-height: 720px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background:
    radial-gradient(circle at 15% 0%, rgba(92,102,255,.18), transparent 34%),
    radial-gradient(circle at 90% 20%, rgba(0,216,255,.12), transparent 28%),
    linear-gradient(145deg, #07101f, #101a31 58%, #091323);
  box-shadow: 0 22px 60px rgba(0,0,0,.25);
  overflow: hidden;
}
.lab-toolbar { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:16px; }
.toolbar-copy { display:grid; gap:3px; }
.toolbar-copy strong { color:#f4f8ff; font-size:1.02rem; font-weight:500; }
.eyebrow { color:#7fdcff; font-size:.72rem; letter-spacing:.14em; font-weight:500; }
.toolbar-actions { display:flex; flex-wrap:wrap; align-items:center; justify-content:flex-end; gap:9px; color:#cbd7ea; }
button {
  appearance:none; border:1px solid rgba(137,177,255,.38); border-radius:999px;
  padding:9px 14px; background:#4768ff; color:white; font:inherit; font-weight:500; cursor:pointer;
}
button:hover { filter:brightness(1.1); }
button:focus-visible, input:focus-visible { outline:3px solid #7fdcff; outline-offset:2px; }
button.quiet { background:rgba(255,255,255,.06); }
.toolbar-actions label { font-size:.78rem; }
#speed { width:112px; accent-color:#7fdcff; }
#speed-label { display:inline-block; min-width:34px; color:#7fdcff; }
.atom-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.atom-card {
  position:relative; min-width:0; border:1px solid rgba(133,157,202,.25); border-radius:20px;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018)); overflow:hidden;
}
.atom-card.is-on { border-color:color-mix(in srgb,var(--atom-color) 58%, transparent); box-shadow:0 0 32px var(--atom-glow); }
.card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:15px 16px 3px; }
.atom-name { display:flex; align-items:center; gap:9px; }
.symbol {
  display:grid; place-items:center; width:38px; height:38px; border-radius:12px; color:#07101f;
  background:var(--atom-color); box-shadow:0 0 18px var(--atom-glow); font-weight:500;
}
.atom-name h3 { margin:0; color:#f4f8ff; font-size:1rem; font-weight:500; }
.atom-name p { margin:2px 0 0; color:#91a6c7; font-size:.72rem; }
.lamp-switch { display:flex; align-items:center; gap:7px; color:#dce8fa; font-size:.75rem; cursor:pointer; }
.lamp-switch input { width:34px; height:19px; accent-color:var(--atom-color); cursor:pointer; }
.scene { width:100%; height:auto; display:block; }
.orbit { fill:none; stroke:rgba(140,177,226,.36); stroke-width:1.4; }
.level-label { fill:#8499b9; font-size:11px; }
.nucleus { fill:url(#nucleusGlow); stroke:rgba(255,255,255,.55); stroke-width:1.2; }
.nucleus-text { fill:white; font-size:15px; font-weight:500; text-anchor:middle; dominant-baseline:middle; }
.electron { fill:#8ef4ff; stroke:white; stroke-width:1; filter:drop-shadow(0 0 6px #59ddff); }
.beam { stroke:rgba(255,255,255,.16); stroke-width:18; stroke-linecap:round; }
.beam-core { stroke:rgba(255,255,255,.68); stroke-width:2; stroke-dasharray:4 7; }
.lamp-body { fill:#273756; stroke:#7992bc; stroke-width:1.2; }
.lamp-light { fill:#fff7c2; filter:drop-shadow(0 0 8px #fff1a0); }
.incoming { fill:white; filter:drop-shadow(0 0 6px white); }
.match-ring { fill:none; stroke:var(--atom-color); stroke-width:2; opacity:.85; }
.photon-wave { fill:none; stroke:var(--atom-color); stroke-width:4; stroke-linecap:round; filter:drop-shadow(0 0 7px var(--atom-color)); }
.photon-dot { fill:var(--atom-color); filter:drop-shadow(0 0 8px var(--atom-color)); }
.status-pill { fill:rgba(7,16,31,.88); stroke:rgba(150,176,220,.32); }
.status-text { fill:#eef5ff; font-size:12px; text-anchor:middle; }
.data-panel { display:grid; grid-template-columns:1fr 1fr; gap:7px; padding:0 14px 13px; }
.datum { min-width:0; padding:8px 9px; border-radius:11px; background:rgba(255,255,255,.045); }
.datum.wide { grid-column:1/-1; }
.datum span { display:block; color:#8299bb; font-size:.67rem; margin-bottom:2px; }
.datum strong { display:block; color:#eef5ff; font-size:.82rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.datum .live-value { color:var(--atom-color); }
.atom-note { min-height:38px; margin:0; padding:0 15px 15px; color:#9fb2ce; font-size:.71rem; line-height:1.4; }
.timeline { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:15px; color:#aec0d9; font-size:.72rem; }
.timeline span { display:flex; align-items:center; gap:5px; white-space:nowrap; }
.timeline b { display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#243556; color:#8eeeff; font-weight:500; }
.timeline i { width:22px; height:1px; background:rgba(142,238,255,.35); }
@media (max-width:1050px) {
  .atom-grid { grid-template-columns:1fr; }
  .atom-card { display:grid; grid-template-columns:minmax(300px,.95fr) minmax(240px,.7fr); }
  .card-head { grid-column:1/-1; }
  .data-panel { align-content:center; padding-right:16px; }
  .atom-note { grid-column:2; }
  .timeline { flex-wrap:wrap; }
}
@media (max-width:680px) {
  #atomic-lab { min-height:0; padding:9px; border-radius:16px; }
  .lab-toolbar { align-items:flex-start; flex-direction:column; }
  .toolbar-actions { width:100%; justify-content:flex-start; }
  .toolbar-actions button { flex:1 1 135px; }
  .toolbar-actions label { width:100%; }
  #speed { width:min(100%,280px); }
  .atom-card { display:block; }
  .card-head { padding:12px 12px 2px; }
  .scene { max-height:285px; }
  .data-panel { grid-template-columns:1fr; padding:0 10px 10px; }
  .datum.wide { grid-column:auto; }
  .datum strong { white-space:normal; }
  .atom-note { min-height:0; }
  .timeline { justify-content:flex-start; }
  .timeline i { display:none; }
}
@media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto !important; } }
"""


COMPONENT_JS = """
const instances = new WeakMap()

function svgMarkup(atom, index) {
  const rings = [46, 69, 92]
  return `
    <svg class="scene" viewBox="0 0 390 300" role="img" aria-label="Animated ${atom.name} atom emitting ${atom.wavelength} nanometre light">
      <defs>
        <radialGradient id="nucleus-${index}"><stop offset="0" stop-color="#fff"/><stop offset=".28" stop-color="${atom.color}"/><stop offset="1" stop-color="#263e76"/></radialGradient>
      </defs>
      <g class="lamp" transform="translate(24 122)">
        <path class="lamp-body" d="M0 18h30l20-16v68L30 54H0z"/><rect class="lamp-body" x="-5" y="25" width="12" height="22" rx="3"/>
        <circle class="lamp-light" cx="48" cy="36" r="7"/>
      </g>
      <line class="beam" x1="76" y1="158" x2="196" y2="158"/><line class="beam-core" x1="76" y1="158" x2="196" y2="158"/>
      <g class="white-photons"></g>
      <g transform="translate(230 158)">
        ${rings.map((r,i)=>`<circle class="orbit" r="${r}"/><text class="level-label" x="${r-9}" y="${-Math.sqrt(Math.max(0,r*r-(r-9)*(r-9)))-5}">L${i+1}</text>`).join('')}
        <circle class="nucleus" r="25" fill="url(#nucleus-${index})"/><text class="nucleus-text">${atom.symbol}</text>
        <circle class="electron" r="7" cx="46" cy="0"/>
        <circle class="match-ring" r="11" cx="46" cy="0"/>
      </g>
      <g class="emission"><path class="photon-wave"/><circle class="photon-dot" r="5"/></g>
      <rect class="status-pill" x="112" y="270" width="236" height="24" rx="12"/><text class="status-text" x="230" y="286">Lamp off · electron on lower level</text>
    </svg>`
}

function makeCard(atom, index) {
  const card = document.createElement('article')
  card.className = 'atom-card'
  card.style.setProperty('--atom-color', atom.color)
  card.style.setProperty('--atom-glow', atom.glow)
  card.innerHTML = `
    <div class="card-head">
      <div class="atom-name"><span class="symbol">${atom.symbol}</span><div><h3>${atom.name}</h3><p>${atom.line}</p></div></div>
      <label class="lamp-switch"><span>White lamp</span><input class="lamp-toggle" type="checkbox" aria-label="Switch ${atom.name} lamp on" /></label>
    </div>
    ${svgMarkup(atom,index)}
    <div class="data-panel">
      <div class="datum"><span>Emitted wavelength</span><strong class="live-value">${atom.wavelength.toFixed(1)} nm</strong></div>
      <div class="datum"><span>Photon energy</span><strong>${atom.energy.toFixed(2)} eV</strong></div>
      <div class="datum"><span>Downward transition</span><strong>${atom.transition}</strong></div>
      <div class="datum"><span>Frequency</span><strong>${(299792.458/atom.wavelength).toFixed(0)} THz</strong></div>
      <div class="datum wide"><span>What is happening now?</span><strong class="stage-value">Waiting for light</strong></div>
    </div>
    <p class="atom-note">${atom.note}</p>`
  return card
}

function wavePath(startX, endX, y, wavelength, phase) {
  if (endX <= startX) return `M ${startX} ${y}`
  const pts=[]
  for(let x=startX;x<=endX;x+=4){
    const yy=y + Math.sin((x-startX)/wavelength*Math.PI*2 + phase)*8
    pts.push(`${pts.length?'L':'M'} ${x.toFixed(1)} ${yy.toFixed(1)}`)
  }
  return pts.join(' ')
}

function renderFrame(state, now) {
  if (state.paused) return
  const speed = state.speed
  state.cards.forEach((s, idx) => {
    if (!s.on) return
    const cycle = 6200 / speed
    const t = ((now - state.started + idx*410) % cycle) / cycle
    const svg=s.card.querySelector('svg'), electron=svg.querySelector('.electron'), ring=svg.querySelector('.match-ring')
    const wave=svg.querySelector('.photon-wave'), dot=svg.querySelector('.photon-dot'), status=svg.querySelector('.status-text')
    const stage=s.card.querySelector('.stage-value')
    let radius=46, text='Selecting a matching photon', waveEnd=0, waveStart=270
    if(t < .29){
      const p=t/.29, x=82+p*133
      s.target.setAttribute('cx',x); s.target.setAttribute('cy',158); s.target.style.opacity='1'
      text='A matching photon approaches'
    } else if(t < .43){
      const p=(t-.29)/.14; radius=46+(s.atom.level===3?46:23)*p; s.target.style.opacity=String(1-p)
      text='Photon absorbed · electron jumping up'
    } else if(t < .59){
      radius=s.atom.level===3?92:69; s.target.style.opacity='0'; text='Electron briefly excited'
    } else if(t < .72){
      const p=(t-.59)/.13; const high=s.atom.level===3?92:69; radius=high-(high-46)*p; s.target.style.opacity='0'
      waveEnd=waveStart+p*34; text='Electron falling · photon created'
    } else {
      const p=(t-.72)/.28; s.target.style.opacity='0'; waveEnd=304+p*82; text=`${s.atom.wavelength.toFixed(1)} nm photon escaping`
    }
    const angle=now/1600 + idx*.8
    electron.setAttribute('cx',(Math.cos(angle)*radius).toFixed(1)); electron.setAttribute('cy',(Math.sin(angle)*radius*.46).toFixed(1))
    ring.setAttribute('cx',electron.getAttribute('cx')); ring.setAttribute('cy',electron.getAttribute('cy'))
    if(waveEnd>0){
      wave.style.opacity='1'; dot.style.opacity='1'; wave.setAttribute('d',wavePath(waveStart,waveEnd,158,Math.max(13,s.atom.wavelength/27),now/180))
      dot.setAttribute('cx',waveEnd); dot.setAttribute('cy',158)
    } else { wave.style.opacity='0'; dot.style.opacity='0' }
    status.textContent=text; stage.textContent=text
  })
  state.raf=requestAnimationFrame(n=>renderFrame(state,n))
}

export default function(component) {
  const { parentElement, data } = component
  const root=parentElement.querySelector('#atomic-lab')
  if(!root) return
  const previous=instances.get(parentElement)
  if(previous){ cancelAnimationFrame(previous.raf); previous.cleanup() }
  const grid=root.querySelector('#atom-grid')
  const cards=data.atoms.map((atom,index)=>{
    const card=makeCard(atom,index); grid.appendChild(card)
    const photonGroup=card.querySelector('.white-photons')
    const colors=['#ff4b4b','#ffd84b','#59e391','#4bc7ff','#9d73ff']
    colors.forEach((c,i)=>{ const n=document.createElementNS('http://www.w3.org/2000/svg','circle'); n.setAttribute('r','3.4'); n.setAttribute('cx',95+i*22); n.setAttribute('cy',148+(i%2)*20); n.setAttribute('fill',c); n.style.opacity='.5'; photonGroup.appendChild(n) })
    const target=document.createElementNS('http://www.w3.org/2000/svg','circle'); target.setAttribute('r','6'); target.setAttribute('fill',atom.color); target.style.filter=`drop-shadow(0 0 7px ${atom.color})`; target.style.opacity='0'; photonGroup.appendChild(target)
    return {atom,card,target,on:false}
  })
  const state={cards, speed:1, paused:false, started:performance.now(), raf:0}
  const handlers=[]
  cards.forEach(s=>{
    const toggle=s.card.querySelector('.lamp-toggle')
    const fn=()=>{ s.on=toggle.checked; s.card.classList.toggle('is-on',s.on); if(!s.on){
      s.card.querySelector('.status-text').textContent='Lamp off · electron on lower level'; s.card.querySelector('.stage-value').textContent='Waiting for light'
      s.card.querySelector('.photon-wave').style.opacity='0'; s.card.querySelector('.photon-dot').style.opacity='0'; s.target.style.opacity='0'
    }}
    toggle.addEventListener('change',fn); handlers.push([toggle,'change',fn])
  })
  const all=root.querySelector('#all-lamps'), pause=root.querySelector('#pause-motion'), speed=root.querySelector('#speed'), speedLabel=root.querySelector('#speed-label')
  const allFn=()=>{ const turnOn=cards.some(s=>!s.on); cards.forEach(s=>{s.card.querySelector('.lamp-toggle').checked=turnOn; s.card.querySelector('.lamp-toggle').dispatchEvent(new Event('change'))}); all.textContent=turnOn?'Switch all lamps off':'Switch all lamps on' }
  const pauseFn=()=>{ state.paused=!state.paused; pause.textContent=state.paused?'Resume':'Pause'; pause.setAttribute('aria-pressed',String(state.paused)); if(!state.paused){state.started=performance.now(); state.raf=requestAnimationFrame(n=>renderFrame(state,n))} }
  const speedFn=()=>{state.speed=Number(speed.value); speedLabel.value=`${state.speed.toFixed(2).replace(/0$/,'')}×`; speedLabel.textContent=speedLabel.value}
  all.addEventListener('click',allFn); pause.addEventListener('click',pauseFn); speed.addEventListener('input',speedFn)
  handlers.push([all,'click',allFn],[pause,'click',pauseFn],[speed,'input',speedFn])
  const cleanup=()=>handlers.forEach(([el,type,fn])=>el.removeEventListener(type,fn))
  state.cleanup=cleanup; instances.set(parentElement,state); state.raf=requestAnimationFrame(n=>renderFrame(state,n))
  return ()=>{cancelAnimationFrame(state.raf); cleanup(); instances.delete(parentElement)}
}
"""


atomic_lab = st.components.v2.component(
    "atomic_color_lab",
    html=COMPONENT_HTML,
    css=COMPONENT_CSS,
    js=COMPONENT_JS,
)


st.title("Atomic color lab")
st.caption("Three real spectral lines, one simplified model, and a photon-by-photon view of pre-excited gas atoms interacting with light.")

atomic_lab(data={"atoms": ATOMS}, key="main_atomic_lab", height="content", width="stretch")

with st.expander("What the model gets right — and what it simplifies", icon=":material/science:"):
    st.markdown(
        """
        **What is physically real:** electrons in isolated atoms can occupy only certain energies. An atom absorbs a photon only when its energy matches an allowed upward transition. When the electron later drops, the atom emits a photon whose energy is the level difference:  
        $E = h f = hc/\\lambda$. Shorter wavelengths therefore carry more energy.

        **A necessary preparation step:** hydrogen's red H-alpha line and mercury's blue line do not start from the true ground state. In a real glowing gas, collisions or an electrical discharge first populate excited states. This lab starts each atom on the lower level of the chosen visible transition, then follows one matching photon. White light by itself would not make every cold, ground-state atom perform these exact jumps.

        **What is simplified:** the orbit rings are a teaching picture, not literal planetary paths. Real electrons are described by quantum orbitals. Sodium also has a second, extremely close yellow D line, and mercury has many spectral lines; this lab follows one representative visible transition for each atom.

        **One important distinction:** this animation shows selective atomic absorption and re-emission. The color of paint, leaves, clothes, or a motorcycle is usually produced mainly by the collective absorption, scattering and reflection of light in molecules and solids — not by three isolated atoms behaving exactly like these.
        """
    )

st.caption("© Marco Ventoruzzo 2026 · made with support from Codex")
