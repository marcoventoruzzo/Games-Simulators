import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Inside You! — Human Body Explorer",
    page_icon="🫀",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
    .stApp { background: radial-gradient(circle at 15% 10%, #e8f8ff 0, #f8fbff 38%, #fff8ec 100%); }
    .block-container { max-width: 1180px; padding-top: 1.2rem; padding-bottom: 2rem; }
    h1 { color:#17324d; letter-spacing:-.035em; }
    [data-testid="stCaptionContainer"] { color:#53697d; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Inside You! 🫀 Human Body Explorer")
st.caption("Peel back the layers, switch body systems on and off, and tap an organ to discover its amazing job.")

EXPLORER = r'''
<div id="body-explorer">
  <style>
    #body-explorer{--ink:#17324d;--muted:#5e7184;--panel:#ffffff;--line:#dce8f1;--blue:#28a9e0;--pink:#f2678a;--gold:#ffc857;--green:#47b881;--red:#e54b4b;--purple:#7557c7;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);}
    #body-explorer *{box-sizing:border-box}
    .be-shell{display:grid;grid-template-columns:minmax(230px,300px) minmax(360px,1fr) minmax(230px,300px);gap:16px;align-items:start}
    .be-panel{background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:22px;padding:15px;box-shadow:0 12px 32px rgba(23,50,77,.09)}
    .be-title{font-size:14px;font-weight:800;margin:0 0 10px;letter-spacing:.02em}.be-help{font-size:12px;color:var(--muted);margin:5px 0 12px;line-height:1.45}
    .be-segment{display:grid;grid-template-columns:1fr 1fr;gap:7px}.be-btn,.sys-btn,.challenge-btn{font:inherit;border:1px solid var(--line);background:#f7fbfe;color:var(--ink);border-radius:13px;padding:9px 10px;cursor:pointer;font-weight:750;transition:.16s ease}.be-btn:hover,.sys-btn:hover,.challenge-btn:hover{transform:translateY(-1px);border-color:#8ecbe6}.be-btn[aria-pressed="true"]{background:var(--ink);color:white;border-color:var(--ink)}
    .layer-readout{display:flex;justify-content:space-between;align-items:end;margin-top:15px}.layer-name{font-weight:850;color:#0d789f}.layer-num{font-size:12px;color:var(--muted)}
    #layerRange{width:100%;accent-color:#20a6d7;margin:8px 0 3px}.ticks{display:grid;grid-template-columns:repeat(4,1fr);font-size:10px;color:var(--muted);text-align:center;gap:2px}.ticks span.active{color:#0d789f;font-weight:850}
    .sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sys-btn{font-size:11px;padding:9px 6px;display:flex;align-items:center;gap:6px;justify-content:flex-start}.sys-btn[aria-pressed="true"]{color:white;border-color:transparent}.sys-btn[data-system="nervous"][aria-pressed="true"]{background:#7557c7}.sys-btn[data-system="circulatory"][aria-pressed="true"]{background:#df3c4f}.sys-btn[data-system="respiratory"][aria-pressed="true"]{background:#269cc5}.sys-btn[data-system="digestive"][aria-pressed="true"]{background:#ee8a24}.sys-btn[data-system="urinary"][aria-pressed="true"]{background:#2c8b70}.sys-btn[data-system="skeletal"][aria-pressed="true"]{background:#7b8b99}.sys-btn[data-system="muscular"][aria-pressed="true"]{background:#b94040}.sys-btn[data-system="reproductive"][aria-pressed="true"]{background:#c64e91}.dot{width:9px;height:9px;border-radius:50%;background:currentColor;box-shadow:0 0 0 2px rgba(255,255,255,.35)}
    .clear-btn{width:100%;margin-top:8px;border:0;background:transparent;color:#557086;text-decoration:underline;cursor:pointer;font-weight:650}
    .stage{position:relative;min-height:704px;padding:0;overflow:hidden;background:radial-gradient(circle at 50% 35%,#ffffff 0,#f4fbff 65%,#e8f4f8 100%)}
    .stage:before{content:"";position:absolute;inset:auto 13% 18px;height:26px;border-radius:50%;background:rgba(23,50,77,.10);filter:blur(9px)}
    #bodySvg{width:100%;height:700px;display:block;position:relative;z-index:1}.anatomy{transition:opacity .35s ease,transform .35s ease;transform-origin:center}.hidden-layer{opacity:0;pointer-events:none;transform:scale(.985)}
    .organ{cursor:pointer;transition:filter .15s ease,transform .15s ease;transform-box:fill-box;transform-origin:center}.organ:hover,.organ:focus,.organ.highlight{filter:drop-shadow(0 0 8px #ffd43b);transform:scale(1.07);outline:none}.dimmed{opacity:.12!important;pointer-events:none}.sex-girl,.sex-boy{transition:opacity .25s}.sex-off{display:none}
    .callout{position:absolute;right:10px;top:10px;z-index:4;width:min(250px,45%);background:#fff;border:2px solid #55b8df;border-radius:18px;padding:12px;box-shadow:0 12px 30px rgba(23,50,77,.18);display:none}.callout.show{display:block}.callout-top{display:flex;align-items:center;gap:10px}.organ-pic{width:58px;height:58px;border-radius:15px;display:grid;place-items:center;background:#eaf8ff;font-size:35px}.callout h3{font-size:16px;margin:0}.callout p{font-size:12px;color:#4b6277;line-height:1.42;margin:8px 0 0}.callout .close{position:absolute;right:7px;top:6px;border:0;background:transparent;font-size:20px;color:#61788c;cursor:pointer}
    .status{position:absolute;left:12px;bottom:12px;z-index:3;background:rgba(23,50,77,.92);color:white;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:750;max-width:70%}
    .fact{min-height:138px;background:linear-gradient(145deg,#17324d,#265f86);color:white;border-radius:18px;padding:14px;margin-bottom:12px}.fact-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8ee2ff;font-weight:850}.fact p{font-size:13px;line-height:1.45;margin:8px 0 0}.challenge-btn{width:100%;background:#ffc857;border-color:#eaae25;color:#17324d;font-weight:850}.challenge-box{margin-top:10px;border:1px dashed #9eb8ca;border-radius:14px;padding:10px;font-size:12px;line-height:1.4;min-height:64px;background:#f7fbfe}.score{display:flex;justify-content:space-between;color:var(--muted);font-size:11px;margin-top:8px}.legend{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);line-height:1.45}.legend b{color:var(--ink)}
    .be-footer{text-align:center;color:#718394;font-size:10px;margin-top:9px}
    @media(max-width:860px){.be-shell{grid-template-columns:1fr 1.25fr}.right-panel{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px}.fact{margin:0}.stage{min-height:620px}#bodySvg{height:615px}}
    @media(max-width:590px){.be-shell{display:flex;flex-direction:column}.be-panel,.stage{width:100%}.stage{order:2;min-height:570px}#bodySvg{height:565px}.right-panel{order:3;display:block}.controls{order:1}.callout{width:58%;right:5px}.sys-grid{grid-template-columns:repeat(2,1fr)}}
  </style>

  <div class="be-shell">
    <section class="be-panel controls" aria-label="Explorer controls">
      <div class="be-title">1 · Choose a body</div>
      <div class="be-segment">
        <button class="be-btn gender" data-sex="girl" aria-pressed="true">👧 Girl</button>
        <button class="be-btn gender" data-sex="boy" aria-pressed="false">👦 Boy</button>
      </div>
      <div class="layer-readout"><span class="be-title" style="margin:0">2 · Peel back a layer</span><span class="layer-num" id="layerNum">Layer 1 of 4</span></div>
      <div class="layer-name" id="layerName">Skin & senses</div>
      <input id="layerRange" type="range" min="0" max="3" step="1" value="0" aria-label="Anatomical layer">
      <div class="ticks"><span class="active">Skin</span><span>Muscles</span><span>Organs</span><span>Skeleton</span></div>
      <div class="be-title" style="margin-top:18px">3 · Spotlight a body system</div>
      <p class="be-help">Turn on one or more systems. Tap again to hide it.</p>
      <div class="sys-grid">
        <button class="sys-btn" data-system="nervous" aria-pressed="false"><span class="dot"></span>Nervous</button>
        <button class="sys-btn" data-system="circulatory" aria-pressed="false"><span class="dot"></span>Circulatory</button>
        <button class="sys-btn" data-system="respiratory" aria-pressed="false"><span class="dot"></span>Respiratory</button>
        <button class="sys-btn" data-system="digestive" aria-pressed="false"><span class="dot"></span>Digestive</button>
        <button class="sys-btn" data-system="urinary" aria-pressed="false"><span class="dot"></span>Urinary</button>
        <button class="sys-btn" data-system="skeletal" aria-pressed="false"><span class="dot"></span>Skeletal</button>
        <button class="sys-btn" data-system="muscular" aria-pressed="false"><span class="dot"></span>Muscular</button>
        <button class="sys-btn" data-system="reproductive" aria-pressed="false"><span class="dot"></span>Reproductive</button>
      </div>
      <button class="clear-btn" id="clearSystems">Clear spotlights</button>
    </section>

    <section class="be-panel stage" aria-label="Interactive simplified human anatomy diagram">
      <div class="callout" id="callout" role="status" aria-live="polite"><button class="close" aria-label="Close organ card">×</button><div class="callout-top"><div class="organ-pic" id="organPic">🫀</div><div><div class="fact-kicker" id="organSystem">Circulatory system</div><h3 id="organTitle">Heart</h3></div></div><p id="organText"></p></div>
      <svg id="bodySvg" viewBox="0 0 480 760" role="img" aria-labelledby="svgTitle svgDesc">
        <title id="svgTitle">Interactive human body</title><desc id="svgDesc">A simplified child-friendly front view with skin, muscles, organs and skeleton layers.</desc>
        <defs>
          <linearGradient id="skinG" x1="0" x2="1"><stop stop-color="#f0b58f"/><stop offset=".55" stop-color="#ffd2ad"/><stop offset="1" stop-color="#df9475"/></linearGradient>
          <linearGradient id="muscleG" x1="0" x2="1"><stop stop-color="#a9343d"/><stop offset=".5" stop-color="#e66d68"/><stop offset="1" stop-color="#922b35"/></linearGradient>
          <filter id="soft"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".18"/></filter>
        </defs>
        <g id="skinLayer" class="anatomy">
          <circle cx="240" cy="78" r="51" fill="url(#skinG)" stroke="#bd755f" stroke-width="2"/>
          <path class="sex-girl" d="M198 67 Q208 13 240 18 Q281 17 289 70 Q279 42 260 39 Q226 30 198 67" fill="#6b412d"/>
          <path class="sex-boy sex-off" d="M195 65 Q203 22 242 22 Q281 22 287 61 Q269 38 239 39 Q212 37 195 65" fill="#5c3a2b"/>
          <path d="M217 124 Q240 137 263 124 L278 146 Q305 160 313 205 L326 360 Q318 432 302 489 L291 704 Q291 732 269 732 L255 730 L249 505 L231 505 L225 730 L210 732 Q189 731 190 704 L178 489 Q162 430 154 360 L167 205 Q174 161 202 146Z" fill="url(#skinG)" stroke="#bd755f" stroke-width="2"/>
          <path d="M168 178 Q141 190 130 236 L99 400 Q96 423 111 427 Q128 430 134 407 L174 269" fill="url(#skinG)" stroke="#bd755f" stroke-width="2"/>
          <path d="M312 178 Q339 190 350 236 L381 400 Q384 423 369 427 Q352 430 346 407 L306 269" fill="url(#skinG)" stroke="#bd755f" stroke-width="2"/>
          <circle class="organ" data-organ="eye" data-system="nervous" cx="222" cy="75" r="5" fill="#fff" stroke="#445"/><circle cx="223" cy="75" r="2" fill="#285e8e"/>
          <circle class="organ" data-organ="eye" data-system="nervous" cx="258" cy="75" r="5" fill="#fff" stroke="#445"/><circle cx="257" cy="75" r="2" fill="#285e8e"/>
          <path d="M230 100 Q240 107 250 100" fill="none" stroke="#a85e5e" stroke-width="2" stroke-linecap="round"/>
        </g>

        <g id="muscleLayer" class="anatomy hidden-layer" data-system-group="muscular">
          <circle cx="240" cy="78" r="49" fill="#b94b4e" opacity=".92"/>
          <path d="M204 143 Q240 127 276 143 L293 205 L284 360 Q265 397 240 401 Q214 398 196 360 L188 205Z" fill="url(#muscleG)" stroke="#7c2630" stroke-width="2"/>
          <path d="M204 157 Q218 148 233 154 L228 228 Q206 226 195 206Z M276 157 Q262 148 247 154 L252 228 Q274 226 285 206Z" fill="#ee8177" stroke="#8e3037"/>
          <path d="M231 238 Q213 240 203 281 L205 355 Q221 376 233 377Z M249 238 Q267 240 277 281 L275 355 Q259 376 247 377Z" fill="#c9474e" stroke="#842a31"/>
          <path d="M174 184 Q148 199 140 247 L108 400 Q105 415 117 417 L130 403 L171 260Z M306 184 Q332 199 340 247 L372 400 Q375 415 363 417 L350 403 L309 260Z" fill="url(#muscleG)" stroke="#842a31"/>
          <path d="M185 398 Q205 389 229 414 L221 708 Q209 722 198 706 L184 500Z M295 398 Q275 389 251 414 L259 708 Q271 722 282 706 L296 500Z" fill="url(#muscleG)" stroke="#842a31"/>
          <g stroke="#ffd1c5" stroke-width="2" opacity=".55"><path d="M240 150V390"/><path d="M204 277H276"/><path d="M201 316H279"/><path d="M199 352H281"/></g>
        </g>

        <g id="organLayer" class="anatomy hidden-layer">
          <path d="M216 126 Q240 137 264 126 L281 151 Q299 169 301 209 L294 377 Q270 409 240 411 Q210 409 186 377 L179 209 Q181 169 199 151Z" fill="#f7cbb0" stroke="#bb8069" stroke-width="2" opacity=".72"/>
          <g data-system-group="nervous">
            <path class="organ" tabindex="0" data-organ="brain" data-system="nervous" d="M208 70 Q203 45 222 37 Q237 25 249 37 Q269 32 275 51 Q286 65 275 82 Q269 101 249 102 Q231 109 217 96 Q202 91 208 70Z" fill="#e8a1c1" stroke="#a54f78" stroke-width="2"/>
            <path d="M240 104 V377" stroke="#7557c7" stroke-width="6" stroke-linecap="round" opacity=".8"/>
          </g>
          <g data-system-group="respiratory">
            <path d="M240 145V190" stroke="#269cc5" stroke-width="8" stroke-linecap="round"/>
            <path class="organ" tabindex="0" data-organ="lungs" data-system="respiratory" d="M231 181 Q207 169 196 192 Q186 225 195 270 Q205 292 230 277Z" fill="#7ed7e8" stroke="#2188ac" stroke-width="2"/>
            <path class="organ" tabindex="0" data-organ="lungs" data-system="respiratory" d="M249 181 Q273 169 284 192 Q294 225 285 270 Q275 292 250 277Z" fill="#7ed7e8" stroke="#2188ac" stroke-width="2"/>
          </g>
          <g data-system-group="circulatory">
            <path d="M240 206 V370 M240 232 L202 255 M240 232 L278 255 M240 360 L208 475 M240 360 L272 475" fill="none" stroke="#df3c4f" stroke-width="5" stroke-linecap="round" opacity=".78"/>
            <path class="organ" tabindex="0" data-organ="heart" data-system="circulatory" d="M238 223 C216 199 191 226 209 249 L239 282 L270 249 C288 226 262 199 238 223Z" fill="#e44152" stroke="#9b2434" stroke-width="2" filter="url(#soft)"/>
          </g>
          <g data-system-group="digestive">
            <path class="organ" tabindex="0" data-organ="liver" data-system="digestive" d="M202 283 Q238 267 277 287 Q281 311 258 322 L207 316 Q193 305 202 283Z" fill="#9d4c3f" stroke="#6d302a" stroke-width="2"/>
            <path class="organ" tabindex="0" data-organ="stomach" data-system="digestive" d="M252 312 Q280 309 276 341 Q272 372 242 363 Q226 350 244 335 Q251 329 252 312Z" fill="#ef9a7e" stroke="#b85d52" stroke-width="2"/>
            <path class="organ" tabindex="0" data-organ="intestines" data-system="digestive" d="M207 343 Q240 327 273 346 L277 391 Q241 413 204 391Z" fill="#f3b28e" stroke="#bb6b55" stroke-width="3"/>
            <path d="M213 354 Q266 346 266 362 Q210 366 216 380 Q266 373 267 389" fill="none" stroke="#c16f58" stroke-width="5" stroke-linecap="round"/>
          </g>
          <g data-system-group="urinary">
            <path class="organ" tabindex="0" data-organ="kidneys" data-system="urinary" d="M202 323 Q185 317 184 339 Q184 362 205 359 Q218 349 209 331Z" fill="#a94f63" stroke="#743543" stroke-width="2"/>
            <path class="organ" tabindex="0" data-organ="kidneys" data-system="urinary" d="M278 323 Q295 317 296 339 Q296 362 275 359 Q262 349 271 331Z" fill="#a94f63" stroke="#743543" stroke-width="2"/>
            <path d="M204 358 L224 396 M276 358 L256 396" stroke="#e4c257" stroke-width="3"/>
            <ellipse class="organ" tabindex="0" data-organ="bladder" data-system="urinary" cx="240" cy="400" rx="18" ry="14" fill="#f0d25e" stroke="#a78b24" stroke-width="2"/>
          </g>
          <g data-system-group="reproductive">
            <g class="sex-girl"><path class="organ" tabindex="0" data-organ="uterus" data-system="reproductive" d="M226 392 Q240 378 254 392 L251 416 Q240 429 229 416Z" fill="#e574a8" stroke="#9e3e70" stroke-width="2"/><path d="M228 394L211 385 M252 394L269 385" stroke="#e574a8" stroke-width="5" stroke-linecap="round"/></g>
            <g class="sex-boy sex-off"><ellipse class="organ" tabindex="0" data-organ="prostate" data-system="reproductive" cx="240" cy="405" rx="15" ry="10" fill="#d06ca2" stroke="#8f3b68" stroke-width="2"/></g>
          </g>
        </g>

        <g id="skeletonLayer" class="anatomy hidden-layer" data-system-group="skeletal" stroke="#72808b" stroke-width="5" fill="none" stroke-linecap="round">
          <circle class="organ" tabindex="0" data-organ="skull" data-system="skeletal" cx="240" cy="77" r="46" fill="#f1ead8" stroke-width="3"/>
          <path d="M220 89 Q240 107 260 89 M229 72h1 M250 72h1" stroke-width="3"/>
          <path class="organ" tabindex="0" data-organ="spine" data-system="skeletal" d="M240 125 Q232 170 240 210 Q248 250 240 295 Q232 340 240 395" stroke="#d7cbb4" stroke-width="10"/>
          <path d="M240 150 L188 172 M240 150 L292 172 M188 172 L136 401 M292 172 L344 401"/>
          <g stroke="#d7cbb4" stroke-width="5"><path d="M239 168 Q199 164 190 200 Q206 229 239 235"/><path d="M241 168 Q281 164 290 200 Q274 229 241 235"/><path d="M239 190 Q205 188 198 216 Q211 242 239 249"/><path d="M241 190 Q275 188 282 216 Q269 242 241 249"/></g>
          <path class="organ" tabindex="0" data-organ="pelvis" data-system="skeletal" d="M197 366 Q240 392 283 366 L274 408 Q240 426 206 408Z" fill="#f1ead8" stroke-width="3"/>
          <path d="M215 408 L202 705 M265 408 L278 705 M200 705h-22 M280 705h22"/>
        </g>
      </svg>
      <div class="status" id="statusText">Skin protects everything inside you. Try moving the layer slider!</div>
    </section>

    <aside class="be-panel right-panel">
      <div class="fact"><div class="fact-kicker">Did you know?</div><p id="factText">Your skin is your largest organ. It keeps germs out, helps control temperature, and lets you feel the world.</p></div>
      <div>
        <div class="be-title">🎯 Find the organ!</div>
        <p class="be-help">Read a clue, then tap the correct organ on the body.</p>
        <button class="challenge-btn" id="challengeBtn">Give me a mystery clue</button>
        <div class="challenge-box" id="challengeBox">Ready when you are, junior anatomist.</div>
        <div class="score"><span id="scoreText">Score: 0</span><span id="triesText">Discoveries: 0</span></div>
      </div>
      <div class="legend"><b>How to explore</b><br>On a computer, hover over an organ. On a phone or tablet, tap it. The model is simplified and not perfectly to scale.</div>
    </aside>
  </div>
  <div class="be-footer">Educational model only · © Marco Ventoruzzo, 2026 · Made with Codex and Python · Available on GitHub</div>

  <script>
  (()=>{
    const root=document.getElementById('body-explorer');
    const layers=['skinLayer','muscleLayer','organLayer','skeletonLayer'];
    const layerNames=['Skin & senses','Muscles','Organs','Skeleton'];
    const layerFacts=[
      'Your skin is your largest organ. It keeps germs out, helps control temperature, and lets you feel the world.',
      'More than 600 muscles help you move, breathe, blink and even smile. Muscles can pull, but they cannot push.',
      'Organs are teams of tissues with special jobs. Organ systems cooperate every second to keep you alive.',
      'A child is born with about 270 bones. As some join together, most adults end up with 206.'
    ];
    const statusLines=['Skin protects everything inside you. Try moving the layer slider!','Muscles pull on bones to create movement.','Organs work in teams called body systems.','Your skeleton supports you, protects organs and makes blood cells.'];
    const info={
      eye:{title:'Eye',system:'Nervous system',pic:'👁️',text:'Light enters through the pupil. The retina turns it into nerve signals, and your brain builds the picture you see.'},
      brain:{title:'Brain',system:'Nervous system',pic:'🧠',text:'Your brain controls thoughts, memory, movement and senses. Billions of nerve cells send messages through tiny electrical signals.'},
      heart:{title:'Heart',system:'Circulatory system',pic:'🫀',text:'This strong muscle pumps blood around your body. At rest, a child’s heart usually beats roughly 70–110 times each minute.'},
      lungs:{title:'Lungs',system:'Respiratory system',pic:'🫁',text:'Your lungs move oxygen from the air into your blood and remove carbon dioxide, a waste gas made by cells.'},
      liver:{title:'Liver',system:'Digestive system',pic:'🟤',text:'The liver processes nutrients, stores energy, makes bile for digestion and helps remove harmful substances from the blood.'},
      stomach:{title:'Stomach',system:'Digestive system',pic:'🥣',text:'The stomach is a muscular bag that churns food and mixes it with acid and enzymes before sending it to the small intestine.'},
      intestines:{title:'Intestines',system:'Digestive system',pic:'〰️',text:'The small intestine absorbs most nutrients. The large intestine absorbs water and helps form solid waste.'},
      kidneys:{title:'Kidneys',system:'Urinary system',pic:'🫘',text:'Your two kidneys filter your blood, balance water and salts, and make urine to carry waste out of the body.'},
      bladder:{title:'Bladder',system:'Urinary system',pic:'💧',text:'The bladder is a stretchy muscular pouch that stores urine until it is time to go to the toilet.'},
      uterus:{title:'Uterus',system:'Reproductive system',pic:'🌸',text:'The uterus is a strong, hollow organ in the female reproductive system. During pregnancy, it is where a baby can grow.'},
      prostate:{title:'Prostate',system:'Reproductive system',pic:'🔵',text:'The prostate is a small gland in the male reproductive system. It adds fluid that helps protect sperm cells.'},
      skull:{title:'Skull',system:'Skeletal system',pic:'💀',text:'The skull is made of several bones joined together. It protects the brain and supports the shape of the face.'},
      spine:{title:'Spine',system:'Skeletal system',pic:'🦴',text:'The spine is a flexible column of small bones called vertebrae. It supports the body and protects the spinal cord.'},
      pelvis:{title:'Pelvis',system:'Skeletal system',pic:'🦴',text:'The pelvis is a strong ring of bones. It carries body weight, connects to the legs and protects lower abdominal organs.'}
    };
    const clues=[
      ['heart','I am a muscle that pumps blood all day and night.'],['brain','I help you think, remember and control your body.'],['lungs','I come as a pair and trade oxygen for carbon dioxide.'],['stomach','I churn food and mix it with acid.'],['kidneys','We filter your blood and make urine.'],['intestines','I absorb nutrients and water from digested food.'],['skull','I am a bony helmet protecting your brain.'],['spine','I am a column of vertebrae protecting the spinal cord.']
    ];
    let sex='girl',layer=0,target=null,score=0,tries=0;
    const range=root.querySelector('#layerRange'),callout=root.querySelector('#callout');
    function setLayer(n){layer=Number(n);layers.forEach((id,i)=>root.querySelector('#'+id).classList.toggle('hidden-layer',i!==layer));root.querySelector('#layerName').textContent=layerNames[layer];root.querySelector('#layerNum').textContent=`Layer ${layer+1} of 4`;root.querySelectorAll('.ticks span').forEach((x,i)=>x.classList.toggle('active',i===layer));root.querySelector('#factText').textContent=layerFacts[layer];root.querySelector('#statusText').textContent=statusLines[layer];root.querySelectorAll('.sys-btn').forEach(b=>b.setAttribute('aria-pressed','false'));applySystems();}
    function setSex(next){sex=next;root.querySelectorAll('.gender').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sex===sex)));root.querySelectorAll('.sex-girl').forEach(x=>x.classList.toggle('sex-off',sex!=='girl'));root.querySelectorAll('.sex-boy').forEach(x=>x.classList.toggle('sex-off',sex!=='boy'));}
    function activeSystems(){return [...root.querySelectorAll('.sys-btn[aria-pressed="true"]')].map(b=>b.dataset.system)}
    function applySystems(){const active=activeSystems();root.querySelectorAll('[data-system-group]').forEach(g=>{if(!active.length){g.classList.remove('dimmed');return;}g.classList.toggle('dimmed',!active.includes(g.dataset.systemGroup));});if(active.length){root.querySelector('#organLayer').classList.remove('hidden-layer');root.querySelector('#muscleLayer').classList.remove('hidden-layer');root.querySelector('#skeletonLayer').classList.remove('hidden-layer');root.querySelector('#skinLayer').classList.add('hidden-layer');root.querySelector('#statusText').textContent='Spotlight: '+active.map(x=>x[0].toUpperCase()+x.slice(1)).join(' + ')+' system'+(active.length>1?'s':'');}else setLayerVisualOnly();}
    function setLayerVisualOnly(){layers.forEach((id,i)=>root.querySelector('#'+id).classList.toggle('hidden-layer',i!==layer));}
    function showOrgan(el){const key=el.dataset.organ,d=info[key];if(!d)return;root.querySelector('#organPic').textContent=d.pic;root.querySelector('#organSystem').textContent=d.system;root.querySelector('#organTitle').textContent=d.title;root.querySelector('#organText').textContent=d.text;callout.classList.add('show');if(target){tries++;if(key===target){score++;root.querySelector('#challengeBox').innerHTML='✅ <b>Correct!</b> You found the '+d.title+'.';target=null;root.querySelectorAll('.organ').forEach(o=>o.classList.remove('highlight'));}else root.querySelector('#challengeBox').innerHTML='Almost! That is the <b>'+d.title+'</b>. Try the clue again.';root.querySelector('#scoreText').textContent='Score: '+score;root.querySelector('#triesText').textContent='Discoveries: '+tries;}}
    range.addEventListener('input',e=>setLayer(e.target.value));root.querySelectorAll('.gender').forEach(b=>b.addEventListener('click',()=>setSex(b.dataset.sex)));
    root.querySelectorAll('.sys-btn').forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));applySystems();}));
    root.querySelector('#clearSystems').addEventListener('click',()=>{root.querySelectorAll('.sys-btn').forEach(b=>b.setAttribute('aria-pressed','false'));applySystems();});
    root.querySelectorAll('.organ').forEach(o=>{o.addEventListener('mouseenter',()=>showOrgan(o));o.addEventListener('click',()=>showOrgan(o));o.addEventListener('focus',()=>showOrgan(o));});
    root.querySelector('.close').addEventListener('click',()=>callout.classList.remove('show'));
    root.querySelector('#challengeBtn').addEventListener('click',()=>{const [key,clue]=clues[Math.floor(Math.random()*clues.length)];target=key;root.querySelector('#challengeBox').innerHTML='🔎 <b>Clue:</b> '+clue;root.querySelectorAll('.sys-btn').forEach(b=>b.setAttribute('aria-pressed','false'));const needed=info[key].system.toLowerCase().split(' ')[0];if(['nervous','circulatory','respiratory','digestive','urinary','skeletal'].includes(needed)){const b=root.querySelector('.sys-btn[data-system="'+needed+'"]');if(b)b.setAttribute('aria-pressed','true');applySystems();}else{range.value=2;setLayer(2);}callout.classList.remove('show');});
    setSex('girl');setLayer(0);
  })();
  </script>
</div>
'''

components.html(EXPLORER, height=875, scrolling=True)

st.info(
    "**For young explorers:** This is a simplified educational model. Bodies vary, organs overlap in three dimensions, "
    "and the drawings are not perfectly to scale. It is not medical advice.",
    icon="ℹ️",
)
