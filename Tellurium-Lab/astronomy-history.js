const slides=[
  ['Prehistory','An Orion older than writing?','A carved mammoth-ivory plaque from Geißenklösterle, Germany, depicts a human-like figure. One interpretation connects it to Orion. The carving is real; the star-map reading remains a hypothesis.','ivory'],
  ['Second and first millennia BCE','Keeping time in Mesopotamia','Babylonian scholars recorded eclipses and planetary positions. Long records let them recognize cycles and forecast some events.','babylon'],
  ['Bronze Age · buried around 1600 BCE','The Nebra Sky Disc','This bronze disc from present-day Germany carries gold stars, a crescent, and a circle that may be the Sun or the full Moon. A tight cluster is usually read as the Pleiades. An arc along the edge is thought to mark the span between the solstice sunrise or sunset positions.','nebra'],
  ['Ancient world','Different skies, different traditions','Observers in China recorded comets and guest stars. Elsewhere, sky knowledge helped people keep calendars, travel, navigate and mark the seasons.','ancient'],
  ['Second century CE','Ptolemy’s moving circles','In the Almagest, Earth was near the center. Planets moved along small circles called epicycles, carried along larger circles. This reproduced apparent retrograde motion well enough to be useful for prediction.','ptolemy'],
  ['Medieval period','Astronomy crosses languages','Astronomers working in Arabic preserved and criticized Greek models, refined tables and built instruments. Works such as al-Sufi’s Book of Fixed Stars helped carry this knowledge across regions.','ancient'],
  ['1543','Copernicus moves Earth','Copernicus put Earth among the planets orbiting the Sun. His book reached specialists, but the model gained support slowly. It still used circles, and no one had yet measured annual stellar parallax.','copernicus'],
  ['1572 and 1577','Tycho’s new star and comet','Tycho Brahe found no measurable parallax for the new star of 1572. His measurements of the 1577 comet also placed it beyond the Moon. Both challenged the old idea of an unchanging sky.','tycho'],
  ['1604','Kepler’s supernova','A brilliant new star appeared in Ophiuchus. Kepler studied it, as did astronomers elsewhere. Today we know Tycho’s and Kepler’s new stars were explosions, now called supernovae.','kepler'],
  ['1609 and 1619','Kepler lets go of circles','Using Tycho’s measurements, especially those of Mars, Kepler found that planets follow ellipses, sweep equal areas in equal times, and take longer to orbit when they are farther from the Sun.','kepler'],
  ['1609–1610','Galileo turns a telescope skyward','Galileo saw mountains on the Moon, stars in the Milky Way and moons moving around Jupiter. The phases of Venus contradicted the standard Ptolemaic arrangement, although they also fit Tycho’s alternative.','galileo-comic'],
  ['1687','Newton connects falling and orbiting','Newton’s laws of motion and universal gravitation put a falling object and an orbiting Moon under the same physics. Kepler’s patterns had a physical explanation.','newton'],
  ['1771–1781','Messier’s list of things that weren’t comets','Charles Messier and Pierre Méchain cataloged fuzzy objects that could be mistaken for comets. Today M numbers identify galaxies, clusters and nebulae, including M31, Andromeda.','messier'],
  ['1781–1800','The Herschels survey the sky','William Herschel discovered Uranus and later infrared radiation. Caroline Herschel discovered comets and helped assemble catalogs. Their surveys made the deep sky a subject of systematic study.','herschel'],
  ['1814–1860s','Starlight becomes a laboratory','Fraunhofer mapped dark lines in the solar spectrum. Kirchhoff and Bunsen connected such lines with chemical elements. Astronomers could infer what a star was made of from its light.','newton'],
  ['1912','Leavitt finds a distance tool','Henrietta Swan Leavitt found that longer-period Cepheid variable stars are intrinsically brighter. Once calibrated, comparing their true and apparent brightness gives distance.','modern'],
  ['1915–1919','Einstein changes gravity','General relativity describes gravity through curved spacetime. Observations during the 1919 solar eclipse supported its prediction that the Sun bends passing starlight.','einstein'],
  ['1920s','Other galaxies and an expanding universe','Cepheids helped establish that Andromeda lies outside the Milky Way. Lemaître linked an expanding universe with galaxy velocities in 1927; Hubble published a distance–redshift relation in 1929 using velocities largely measured by Slipher.','modern'],
  ['1930s–1940s','The hot Big Bang takes shape','Lemaître proposed a denser early universe. Gamow, Alpher and Herman developed the idea of a hot early phase that could form light nuclei and leave a faint radiation background.','modern'],
  ['1965','A relic glow in every direction','Arno Penzias and Robert Wilson detected the cosmic microwave background. Its almost uniform glow, later mapped in detail, comes from when the young universe became transparent.','cmb'],
  ['1960s–1970s','Black holes become observable candidates','General relativity allows a region from which light cannot escape. X-rays and the orbit of a companion star made Cygnus X-1 a compelling stellar-mass black-hole candidate.','hole'],
  ['1998','Expansion is speeding up','Two teams used distant Type Ia supernovae to infer accelerated expansion. Dark energy is the name given to whatever drives that acceleration.','modern'],
  ['2015', 'Spacetime ripples arrive on Earth','LIGO detected gravitational waves from two merging black holes. Astronomers gained a new way to study the universe, using ripples in spacetime alongside light.','hole'],
  ['2019 and 2022','Images of black-hole shadows','The Event Horizon Telescope imaged a bright ring around a central shadow in M87*, then in Sagittarius A*, our galaxy’s central black hole.','hole'],
  ['2022 onward','Webb looks back toward cosmic dawn','Infrared observations from Webb reveal extremely distant galaxies as they were in the young universe. Their spectra offer clues to early stars, gas and chemical enrichment.','modern']
];

export function mountAstronomyHistory(root){
  root.innerHTML=`<article class="lab-card astronomy-history"><h2>Brief history of astronomy and astrophysics</h2>
    <div class="history-pages"><button type="button" data-prev>Previous</button><output></output><button type="button" data-next>Next</button></div>
    <div class="history-panel" aria-live="polite"><img width="480" height="360" alt=""><div><small></small><h3></h3><p></p></div></div>
    <p class="fine">Read more at <a href="https://www.landesmuseum-vorgeschichte.de/en/nebra-sky-disc/the-phases-of-the-sky-disc">the State Museum of Prehistory’s guide to the Nebra Sky Disc</a>, <a href="https://whc.unesco.org/document/104639">UNESCO’s archaeoastronomy study</a>, <a href="https://pwg.gsfc.nasa.gov/stargaze/Stimelinold.htm">NASA’s early astronomy chronology</a>, and <a href="https://science.nasa.gov/universe/black-holes/">NASA’s black-hole guide</a>.</p></article>`;
  let index=0;
  const q=s=>root.querySelector(s);
  function show(){
    const [era,title,copy,art]=slides[index];
    q('small').textContent=era;q('h3').textContent=title;q('.history-panel p').textContent=copy;
    const image=q('img');
    image.src='assets/history/'+art+'.webp';
    image.alt=art==='nebra'?'Bronze Nebra Sky Disc with gold stars, crescent, circle, and arcs':'';
    image.classList.toggle('history-artifact',art==='nebra');
    q('output').textContent=(index+1)+' / '+slides.length;
    q('[data-prev]').disabled=index===0;q('[data-next]').disabled=index===slides.length-1;
  }
  q('[data-prev]').onclick=()=>{if(index>0){index--;show()}};
  q('[data-next]').onclick=()=>{if(index<slides.length-1){index++;show()}};
  show();
  return ()=>{};
}

export function mountBigBang(root){
  root.innerHTML=`<div class="lab-stack"><article class="lab-card"><h2>Big Bang &amp; Theories on the End Game</h2>
    <p><strong>The Big Bang describes how the universe evolved from a hot, dense early state about 13.8 billion years ago.</strong> Space itself expanded everywhere. The theory does not tell us what, if anything, came before. In some inflation models, a vacuum-like field carried energy even without ordinary particles. That is a physical state, not absolute nothingness.</p>
    <ol class="cosmic-eras">
      <li><strong>A tiny fraction of a second · Inflation.</strong> In the leading picture, an extraordinarily rapid early expansion stretched tiny fluctuations. The mechanism remains uncertain. As inflation ended, its energy is thought to have fed a hot mixture of particles and radiation.</li>
      <li><strong>First few minutes · Light nuclei.</strong> Protons and neutrons combined to make mostly hydrogen and helium nuclei, with traces of deuterium and lithium. The gas was still too hot for nuclei to hold on to electrons.</li>
      <li><strong>About 380,000 years · The fog clears.</strong> Electrons joined nuclei to make neutral atoms. Photons could travel much farther without scattering. We still detect this old light, stretched into microwaves, as the cosmic microwave background.</li>
      <li><strong>Hundreds of millions of years · First stars and galaxies.</strong> Gravity gathered gas into clumps. The first stars formed from almost entirely hydrogen and helium, with practically none of the heavier elements found in later stars.</li>
      <li><strong>Later generations · New ingredients.</strong> Stars and stellar explosions enriched space. Later stars and planets formed from gas containing carbon, oxygen, iron and other elements.</li>
    </ol><p><a href="https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-big-bang/">NASA · Evidence for the Big Bang</a></p>
  </article><article class="lab-card"><h2>How might it end?</h2>
    <div class="end-game"><section><h3>Big Freeze · the standard forecast</h3><p>If dark energy behaves like a cosmological constant, expansion keeps accelerating. Distant galaxies slip out of view, star formation dwindles, and usable energy becomes ever harder to find. This gradual fade is also called heat death.</p></section>
    <section><h3>Big Rip</h3><p>Some speculative models let dark energy grow strong enough to pull apart galaxies, planetary systems and eventually smaller structures. This requires a specific kind of dark energy.</p></section>
    <section><h3>Big Crunch</h3><p>If the expansion reversed, the universe could contract into a hotter, denser state. That would require cosmic conditions to change substantially from the accelerating expansion we observe.</p></section></div>
    <p>The Big Freeze is the forecast of the standard model. Some combinations of DESI measurements with other observations hint that dark energy might evolve. The evidence remains inconclusive, and the long-term fate depends on how dark energy behaves.</p>
    <p><a href="https://news.fnal.gov/2026/04/desi-completes-planned-3d-map-of-the-universe-and-continues-exploring/">Fermilab · what DESI measures</a></p>
  </article></div>`;
  return ()=>{};
}
