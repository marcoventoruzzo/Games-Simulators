# Tellurium Lab

[Open the public simulator](https://tellurium-lab.mventoruzzo.chatgpt.site/)

Explore the changing geometry of the Sun, Earth, and Moon from 1900 through 2100. Pick a UTC date, play time forward, or scrub forward from the selected date. Drag the diagram to rotate it, choose a camera preset, or use the keyboard arrow keys and +/−.

- **Lunar phases** shows the sunlight on the textured Earth and Moon. Playback pauses at all four principal phases with an explanation and a resume button. Jump to any principal phase. Open **Earth view** to compare actual Sun and Moon altitude and compass direction, see their local rise and set times, and scrub a 36-hour observing window. Milan is the default observer. Other presets and custom coordinates are available.
- **Eclipses** compares five static diagrams, including a missed alignment, total and partial solar eclipses, and total and partial lunar eclipses.
- **Around the Sun** loops a model year without a calendar. View the tracks from above or follow Earth from the Sun. The circular model uses mean periods and distances. The lunar cycle continues across year boundaries.
- **Seasons** shows the Earth's orbit and axis, with actual equinox, solstice, perihelion, and aphelion times. Playback pauses at each solstice and compares midday ray footprints and geometric daylight at 45° north and south.

- **Analemma** plots the Sun at local mean solar noon using the ephemeris, with year and location controls.
- **Light and colors** compares Rayleigh scattering across wavelengths, the direct sunset spectrum, diffraction, and the white Sun seen from space.
- **Star lives** uses a static Hertzsprung–Russell diagram with familiar stars and a guide to their evolution.
- **Doppler shift**, **Dark night sky**, and **Distance & spectra** cover radial velocity, Olbers’ paradox, parallax, and stellar spectroscopy.

- **Speed of light** compares photons and massive particles using the energy–momentum relation and calculates light travel times. [NIST vacuum value](https://physics.nist.gov/cgi-bin/cuu/Value?c).

Further reading: [NASA’s analemma example](https://science.nasa.gov/image-article/apod-2002-july-9-analemma/), [NASA on light scattering](https://science.nasa.gov/earth/earth-observatory/crepuscular-rays-and-light-scattering-150090/), [NASA on Olbers’ paradox](https://science.nasa.gov/solar-system/skywatching/night-sky-network/looking-beyond-the-stars-septembers-night-sky-notes/), and [ESA’s Gaia instruments](https://www.esa.int/nb/articles/about-us/directorates/science/gaia/science-instruments).

## Run with Python

With Python 3.10 or later, run these commands from the module folder.

```sh
python -m pip install -r requirements.txt
python run.py
```

The app opens on `http://127.0.0.1:8765/`. Add `--no-browser` to open the address yourself. The local version works offline after installing dependencies.

The same frontend can be served by any static HTTPS host. It then runs the same `model.py` in the browser via Pyodide. The browser downloads the pinned Python runtime from jsDelivr on first load. The astronomy wheel is included here.

## Methods and credits

- [Astronomy Engine](https://github.com/cosinekitty/astronomy), by Don Cross and contributors (MIT), supplies ephemerides, lunar illumination and phase angle, topocentric positions, rise/set and eclipse searches. All displayed times use UTC. Horizon predictions assume a level horizon, standard atmospheric refraction, and an observer at sea level.
- The Earth-centered diagram enlarges the bodies and compresses the distance to the Sun. Its lunar-plane ring represents the plane perpendicular to the Moon’s instantaneous geocentric angular momentum. Ecliptic north and the Earth rotation axis are in the J2000 ecliptic frame. The Earth map is a fixed Atlantic-facing reference. The Moon map uses approximate synchronous orientation; libration is omitted.
- Eclipse cones, body sizes, offsets, and the lunar orbital tilt are schematic.
- The heliocentric comparison uses mean circular orbits. In the top view only the optional Moon offset is exaggerated. The camera on the Sun tracks Earth and magnifies the Moon’s sideways displacement.

- [NASA Science, Moon Phases](https://science.nasa.gov/moon/moon-phases/) describes the phase and rise/set relationships. Lunar imagery is from the [NASA Scientific Visualization Studio CGI Moon Kit](https://svs.gsfc.nasa.gov/4720), based on the Lunar Reconnaissance Orbiter Camera. The Earth map is from the [Three.js planet texture collection](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets). Both maps are resized. The solar surface and star field are illustrative.

Created for Marco Ventoruzzo.
