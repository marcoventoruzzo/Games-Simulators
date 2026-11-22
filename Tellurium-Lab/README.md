# Tellurium Lab

[Open the public simulator](https://tellurium-lab.mventoruzzo.chatgpt.site/)

Explore the changing geometry of the Sun, Earth, and Moon from 1900 through 2100. Pick a UTC date, play time forward, or scrub forward from the selected date. Drag the diagram to rotate it, choose a camera preset, or use the keyboard arrow keys and +/−.

- **Lunar phases** shows the sunlight on the textured Earth and Moon. Playback pauses at all four principal phases with an explanation and a resume button. Jump to any principal phase. Open **Earth view** to compare actual Sun and Moon altitude and compass direction, see their local rise and set times, and scrub a 36-hour observing window. Milan is the default observer. Other presets and custom coordinates are available.
- **Eclipses** explains solar and lunar shadows and the nodes. Play through the August 12, 2026 partial eclipse as seen in Sestri Levante, or find the next global solar or lunar eclipse.
- **Around the Sun** compares 72-day paths in the Sun’s frame. Switch between true scale, 10×, and 20× magnification of the Moon’s displacement relative to Earth. The speed readouts always use the unscaled values.

- **Seasons** shows the Earth’s orbit and the orientation of its axis, with real equinox, solstice, perihelion, and aphelion times. The paired daylight bars use the geometric horizon at 45° north and south.

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
- The Earth-centered diagram enlarges the bodies and compresses the distance to the Sun. Its lunar-plane ring represents the plane perpendicular to the Moon’s instantaneous geocentric angular momentum. Ecliptic north and the Earth rotation axis are in the J2000 ecliptic frame. The Moon map uses approximate synchronous orientation; libration is omitted.
- The eclipse cones are schematic. The current shadow readout checks spherical bodies against a geometric shadow, using nominal radii and omitting atmospheric enlargement of Earth’s shadow. The event jump uses Astronomy Engine’s separate eclipse search. The solar event is global and visibility depends on the observer’s location.
- The heliocentric arc uses Earth’s heliocentric vector plus the Moon’s geocentric vector. Both are rotated into a fixed local basis centered on the arc midpoint. The north component remains available when rotating the view. Only the illustrated displacement is magnified. At true scale, the orbit traces nearly overlap.
- [NASA Science, Moon Phases](https://science.nasa.gov/moon/moon-phases/) describes the phase and rise/set relationships. Lunar imagery is from the [NASA Scientific Visualization Studio CGI Moon Kit](https://svs.gsfc.nasa.gov/4720), based on the Lunar Reconnaissance Orbiter Camera. The Earth map is from the [Three.js planet texture collection](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets). Both maps are resized. The solar surface and star field are illustrative.

Created for Marco Ventoruzzo.
