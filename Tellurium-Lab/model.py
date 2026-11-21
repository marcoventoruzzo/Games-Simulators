"""Astronomy Engine computations shared by the native and browser runtimes."""
import json
from functools import lru_cache
from math import acos, degrees, hypot

import astronomy as ae

AU = 149597870.7
R_SUN, R_EARTH, R_MOON = 695700, 6378.137, 1737.4
ECLIPTIC = ae.Rotation_EQJ_ECL()
SUN, MOON, EARTH = ae.Body.Sun, ae.Body.Moon, ae.Body.Earth


def xyz(vector):
    return [vector.x, vector.y, vector.z]


def ecliptic(vector):
    return xyz(ae.RotateVector(ECLIPTIC, vector))


def minus(a, b):
    return [x-y for x, y in zip(a, b)]


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def times(a, scalar):
    return [x*scalar for x in a]


def cross(a, b):
    x, y, z = a
    u, v, w = b
    return [y*w-z*v, z*u-x*w, x*v-y*u]


def unit(a):
    return times(a, 1/hypot(*a))


def earth_at(t):
    return ecliptic(ae.HelioVector(EARTH, t))


def horizontal(body, t, observer):
    eq = ae.Equator(body, t, observer, True, True)
    h = ae.Horizon(t, observer, eq.ra, eq.dec, ae.Refraction.Normal)
    return [h.azimuth, h.altitude]


def iso(t):
    return str(t) if t is not None else None


@lru_cache(maxsize=16)
def sky_day(start, hours, lat, lon):
    t = ae.Time(start)
    observer = ae.Observer(lat, lon, 0)
    events = {}
    for name, body in [('sun', SUN), ('moon', MOON)]:
        for label, direction in [('rise', ae.Direction.Rise), ('set', ae.Direction.Set)]:
            hit = ae.SearchRiseSet(body, observer, direction, t, hours/24)
            events[name+label] = iso(hit)
    samples = [[i/4, horizontal(SUN, t.AddDays(i/96), observer),
                horizontal(MOON, t.AddDays(i/96), observer)] for i in range(hours*4+1)]
    return dict(events=events, samples=samples)


def umbra(occluder, source_distance, downstream):
    return occluder - downstream*(R_SUN-occluder)/source_distance


def shadow(earth, lunar):
    axis = unit(earth)
    distance = hypot(*earth)*AU
    depth = dot(lunar, axis)*AU
    offset = hypot(*minus(lunar, times(axis, depth/AU)))*AU
    umbral = umbra(R_EARTH, distance, depth)
    penumbral = R_EARTH + depth*(R_SUN+R_EARTH)/distance
    if depth > 0 and offset < umbral-R_MOON:
        return 'Inside Earth’s umbra'
    if depth > 0 and offset < umbral+R_MOON:
        return 'Crossing Earth’s umbra'
    if depth > 0 and offset < penumbral+R_MOON:
        return 'Crossing Earth’s penumbra'
    lunar_helio = [x+y for x, y in zip(earth, lunar)]
    lunar_axis = unit(lunar_helio)
    back = times(lunar, -1)
    depth = dot(back, lunar_axis)*AU
    offset = hypot(*minus(back, times(lunar_axis, depth/AU)))*AU
    penumbral = R_MOON + depth*(R_SUN+R_MOON)/(hypot(*lunar_helio)*AU)
    if depth > 0 and offset < penumbral+R_EARTH:
        return 'Moon’s shadow meets Earth'
    return 'Shadows miss'


def frame(date, lat, lon, with_sky):
    t = ae.Time(date)
    earth = earth_at(t)
    moon_state = ae.GeoMoonState(t)
    moon = ecliptic(ae.GeoMoon(t))
    speed = ecliptic(ae.Vector(moon_state.vx, moon_state.vy, moon_state.vz, t))
    normal = unit(cross(moon, speed))
    eqd = ae.Rotation_EQD_EQJ(t)

    def of_date(x, y, z):
        return ecliptic(ae.RotateVector(eqd, ae.Vector(x, y, z, t)))

    from math import cos, sin, radians
    gst = radians(15*ae.SiderealTime(t))
    result = dict(earth=earth, moon=moon, normal=normal, phase=ae.MoonPhase(t),
                  lit=ae.Illumination(MOON, t).phase_fraction,
                  distance=hypot(*moon)*AU, latitude=degrees(acos(moon[2]/hypot(*moon))),
                  spin=of_date(cos(gst), sin(gst), 0), pole=of_date(0, 0, 1),
                  tilt=degrees(acos(normal[2])), shadow=shadow(earth, moon),
                  speeds=[hypot(*minus(earth_at(t.AddDays(.005)), earth_at(t.AddDays(-.005))))*AU/864,
                          hypot(*speed)*AU/86400])
    result['latitude'] = 90-result['latitude']
    if with_sky:
        observer = ae.Observer(lat, lon, 0)
        result['sunSky'] = horizontal(SUN, t, observer)
        result['moonSky'] = horizontal(MOON, t, observer)
        # Equatorial-of-date zenith transformed into the same ecliptic frame.
        phi = radians(lat)
        lst = gst+radians(lon)
        zenith = of_date(cos(phi)*cos(lst), cos(phi)*sin(lst), sin(phi))
        observer_offset = times(zenith, R_EARTH/AU)
        result['skyLight'] = unit(minus(times(earth, -1), moon))
        result['skyView'] = unit(minus(observer_offset, moon))
        result['zenith'] = zenith
    return result


@lru_cache(maxsize=8)
def trajectory(anchor):
    t = ae.Time(anchor)
    earth = earth_at(t)
    ahead = unit(minus(earth_at(t.AddDays(.02)), earth_at(t.AddDays(-.02))))
    radial = unit(minus(earth, times(ahead, dot(earth, ahead))))
    north = unit(cross(radial, ahead))
    axes = [ahead, radial, north]
    points = []
    for i in range(-144, 145):
        dt = t.AddDays(i/4)
        e = minus(earth_at(dt), earth)
        m = ecliptic(ae.GeoMoon(dt))
        points.append([[dot(e, axis)*AU/1e6 for axis in axes],
                       [dot(m, axis)*AU/1e6 for axis in axes]])
    return dict(points=points, origin=earth, axes=axes)


def event(kind, date):
    t = ae.Time(date)
    if kind in ('solar', 'lunar'):
        finder = ae.SearchGlobalSolarEclipse if kind == 'solar' else ae.SearchLunarEclipse
        hit = finder(t)
        return dict(date=iso(hit.peak), kind=hit.kind.name, family=kind)
    return dict(date=iso(ae.SearchMoonPhase(float(kind), t, 33)))


OPERATIONS = dict(frame=frame, sky=sky_day, trajectory=trajectory, event=event)


def request_json(payload):
    """Return plain JSON across the JavaScript bridge."""
    name, args = json.loads(payload)
    return json.dumps(OPERATIONS[name](*args), allow_nan=False)
