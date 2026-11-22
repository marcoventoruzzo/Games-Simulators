"""Astronomy Engine computations shared by the native and browser runtimes."""
import json
from functools import lru_cache
from math import acos, asin, cos, degrees, hypot, pi, radians, sin

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

    gst = radians(15*ae.SiderealTime(t))
    result = dict(earth=earth, moon=moon, normal=normal, phase=ae.MoonPhase(t),
                  lit=ae.Illumination(MOON, t).phase_fraction,
                  distance=hypot(*moon)*AU, latitude=degrees(acos(moon[2]/hypot(*moon))),
                  spin=of_date(cos(gst), sin(gst), 0), pole=of_date(0, 0, 1),
                  tilt=degrees(acos(normal[2])), shadow=shadow(earth, moon),
                  speeds=[hypot(*minus(earth_at(t.AddDays(.005)), earth_at(t.AddDays(-.005))))*AU/864,
                          hypot(*speed)*AU/86400])
    result['latitude'] = 90-result['latitude']
    declination = asin(dot(result['pole'], unit(times(earth, -1))))
    result.update(declination=degrees(declination), obliquity=degrees(acos(result['pole'][2])),
                  daylight=[daylight(45, declination), daylight(-45, declination)],
                  solar_distance=hypot(*earth)*AU)
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


def next_quarter(date):
    start = ae.Time(date)
    result = ae.SearchMoonQuarter(start)
    if result.time.ut <= start.ut:
        result = ae.NextMoonQuarter(result)
    return dict(date=iso(result.time), quarter=result.quarter)


def daylight(latitude, declination):
    from math import tan
    cos_hour_angle = -tan(radians(latitude))*tan(declination)
    return 24*acos(max(-1, min(1, cos_hour_angle)))/pi


@lru_cache(maxsize=8)
def season_year(year):
    seasons = ae.Seasons(year)
    markers = {}
    for key in ('mar_equinox', 'jun_solstice', 'sep_equinox', 'dec_solstice'):
        t = getattr(seasons, key)
        markers[key] = dict(date=iso(t), earth=earth_at(t))
    start = ae.Time(f'{year}-01-01T00:00:00Z')
    end = ae.Time(f'{year+1}-01-01T00:00:00Z')
    apsis = ae.SearchPlanetApsis(EARTH, start)
    while apsis.time.ut < end.ut:
        key = 'perihelion' if apsis.kind == ae.ApsisKind.Pericenter else 'aphelion'
        markers[key] = dict(date=iso(apsis.time), earth=earth_at(apsis.time), distance=apsis.dist_km)
        apsis = ae.NextPlanetApsis(EARTH, apsis)
    orbit = [earth_at(start.AddDays(i*(end.ut-start.ut)/120)) for i in range(121)]
    return dict(markers=markers, orbit=orbit)


@lru_cache(maxsize=1)
def sestri_event():
    observer = ae.Observer(44.272, 9.394, 0)
    start = ae.Time('2026-08-12T00:00:00Z')
    eclipse = ae.SearchLocalSolarEclipse(start, observer)
    sunset = ae.SearchRiseSet(SUN, observer, ae.Direction.Set, start, 1)
    return dict(begin=iso(eclipse.partial_begin.time), peak=iso(eclipse.peak.time),
                end=iso(eclipse.partial_end.time), sunset=iso(sunset), coverage=eclipse.obscuration,
                altitude=eclipse.peak.altitude)


def sestri_sky(date):
    t = ae.Time(date)
    observer = ae.Observer(44.272, 9.394, 0)
    eq_s = ae.Equator(SUN, t, observer, True, True)
    eq_m = ae.Equator(MOON, t, observer, True, True)
    sun = ae.Horizon(t, observer, eq_s.ra, eq_s.dec, ae.Refraction.Airless)
    moon = ae.Horizon(t, observer, eq_m.ra, eq_m.dec, ae.Refraction.Airless)
    az = radians((moon.azimuth-sun.azimuth+180)%360-180)
    h, m = radians(sun.altitude), radians(moon.altitude)
    forward = sin(h)*sin(m)+cos(h)*cos(m)*cos(az)
    sun_radius = asin(R_SUN/(eq_s.dist*AU))
    moon_radius = asin(R_MOON/(eq_m.dist*AU))
    def disk_coord(numerator):
        from math import atan2
        return atan2(numerator, forward)/sun_radius
    return dict(x=disk_coord(cos(m)*sin(az)), y=disk_coord(cos(h)*sin(m)-sin(h)*cos(m)*cos(az)),
                ratio=moon_radius/sun_radius, altitude=horizontal(SUN,t,observer)[1])


@lru_cache(maxsize=12)
def analemma(year, latitude, longitude):
    """Sun at fixed local mean solar noon, on every calendar day."""
    t = ae.Time(f'{year}-01-01T00:00:00Z')
    end = ae.Time(f'{year+1}-01-01T00:00:00Z')
    observer = ae.Observer(latitude, longitude, 0)
    result = []
    for day in range(round(end.ut-t.ut)):
        sample = t.AddDays(day+(12-longitude/15)/24)
        eq = ae.Equator(SUN, sample, observer, True, True)
        h = ae.Horizon(sample, observer, eq.ra, eq.dec, ae.Refraction.Airless)
        result.append([iso(sample)[:10], h.azimuth, h.altitude])
    return result


OPERATIONS = dict(frame=frame, sky=sky_day, trajectory=trajectory, event=event, quarter=next_quarter, season=season_year,
                  sestri_event=sestri_event, sestri_sky=sestri_sky, analemma=analemma)


def request_json(payload):
    """Return plain JSON across the JavaScript bridge."""
    name, args = json.loads(payload)
    return json.dumps(OPERATIONS[name](*args), allow_nan=False)


ZODIAC_STARS = {
    'Taurus': [(4.5987, 16.5093), (5.4382, 28.6075), (5.6274, 21.1425), (3.7914, 24.1051)],
    'Gemini': [(7.7553, 28.0262), (7.5767, 31.8883), (6.6285, 16.3993), (6.3827, 22.5136)],
    'Leo': [(10.1395, 11.9672), (10.3329, 19.8415), (11.8177, 14.5721)],
    'Virgo': [(13.4199, -11.1613), (12.6943, -1.4495), (13.0363, 10.9591)],
    'Libra': [(14.8479, -16.0418), (15.2834, -9.3830), (15.5921, -14.7895)],
    'Scorpius': [(16.4901, -26.4320), (16.0056, -22.6217), (17.5601, -37.1038)],
    'Sagittarius': [(18.4029, -34.3846), (18.9211, -26.2967), (19.0435, -29.8801)],
    'Capricornus': [(20.3502, -14.7814), (21.7840, -16.1273)],
    'Aquarius': [(22.0964, -.3199), (21.5260, -5.5712)],
    'Pisces': [(2.0341, 2.7638), (23.2861, 3.2823)],
    'Aries': [(2.1196, 23.4624), (1.9107, 20.8080)],
    'Cancer': [(8.9748, 11.8577), (8.7448, 18.1543)],
    'Ophiuchus': [(17.5822, 12.5600), (17.1730, -15.7249)]
}


def zodiac_chart(date, latitude, longitude):
    """Geocentric apparent zodiac positions and the geometric eastern horizon."""
    from math import atan2
    t = ae.Time(date)
    observer = ae.Observer(latitude, longitude, 0)
    sidereal = radians(15 * ae.SiderealTime(t) + longitude)
    lat = radians(latitude)
    rotation = ae.Rotation_EQD_ECT(t)
    zenith = xyz(ae.RotateVector(rotation, ae.Vector(
        cos(lat)*cos(sidereal), cos(lat)*sin(sidereal), sin(lat), t)))
    east = xyz(ae.RotateVector(rotation, ae.Vector(-sin(sidereal), cos(sidereal), 0, t)))
    crossing = [-zenith[1], zenith[0], 0]
    if dot(crossing, east) < 0:
        crossing = times(crossing, -1)
    ascendant = degrees(atan2(crossing[1], crossing[0])) % 360
    sky = {}
    def horizon(eq):
        h = ae.Horizon(t, observer, eq.ra, eq.dec, ae.Refraction.Airless)
        return [h.azimuth, h.altitude]

    ecliptic_to_equator = ae.Rotation_ECT_EQD(t)
    def ecliptic_vector(angle):
        a = radians(angle)
        vec = ae.Vector(cos(a), sin(a), 0, t)
        return ae.RotateVector(ecliptic_to_equator, vec)

    def ecliptic_point(angle):
        return horizon(ae.EquatorFromVector(ecliptic_vector(angle)))

    points = []
    for name in ('Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'):
        v = ae.GeoVector(getattr(ae.Body, name), t, True)
        eq = ae.EquatorFromVector(v)
        points.append([name, ae.Ecliptic(v).elon, ae.Constellation(eq.ra, eq.dec).name])
        sky[name] = horizontal(getattr(ae.Body, name), t, observer)
    sky['ASC'] = ecliptic_point(ascendant)
    sky['DSC'] = ecliptic_point(ascendant + 180)
    angles = []
    to_j2000 = ae.Rotation_EQD_EQJ(t)
    for name, lon in (('Ascendant', ascendant), ('Descendant', (ascendant + 180) % 360)):
        eq = ae.EquatorFromVector(ae.RotateVector(to_j2000, ecliptic_vector(lon)))
        angles.append([name, lon, ae.Constellation(eq.ra, eq.dec).name])
    # Approximate mean lunar perigee, referred to the equinox of date.
    centuries = t.tt / 36525
    perigee = (83.3532465 + 4069.0137287*centuries - .01032*centuries**2
               - centuries**3/80053 + centuries**4/18999000)
    lilith = (perigee + 180) % 360
    date_rotation = ae.Rotation_EQJ_EQD(t)
    def star_point(ra, dec):
        v = ae.VectorFromSphere(ae.Spherical(dec, ra*15, 1), t)
        return horizon(ae.EquatorFromVector(ae.RotateVector(date_rotation, v)))
    constellations = {name: [star_point(ra, dec) for ra, dec in group]
                      for name, group in ZODIAC_STARS.items()}
    return dict(ascendant=ascendant, angles=angles, points=points, sky=sky, lilith=lilith,
                constellations=constellations, ecliptic=[ecliptic_point(a) for a in range(0,361,4)])


OPERATIONS['zodiac'] = zodiac_chart


@lru_cache(maxsize=8)
def precession_sky(date):
    """Compare the Sun at the same seasonal longitude in a fixed stellar frame."""
    today = ae.Time(date)
    _, month, day, *_ = today.Calendar()
    babylonian_zodiac_year = -399  # Astronomical year numbering for 400 BCE.
    earlier = ae.SearchSunLongitude(ae.SunPosition(today).elon,
                                   ae.Time.Make(babylonian_zodiac_year, month, day, 0, 0, 0).AddDays(-25), 50)
    if earlier is None:
        raise ValueError("Could not match the seasonal longitude")

    def sun_position(time):
        vector = ae.GeoVector(SUN, time, True)
        eq = ae.EquatorFromVector(vector)
        ecl = ae.SphereFromVector(ae.RotateVector(ECLIPTIC, vector))
        return dict(lon=ecl.lon, lat=ecl.lat, region=ae.Constellation(eq.ra, eq.dec).name,
                    year=time.Calendar()[0])

    modern, ancient = sun_position(today), sun_position(earlier)
    center = modern['lon']

    def relative(lon):
        return (lon - center + 180) % 360 - 180

    bands = []
    rotation = ae.Rotation_ECL_EQJ()
    for offset in range(-60, 60):
        direction = ae.VectorFromSphere(ae.Spherical(0, (center+offset+.5) % 360, 1), today)
        eq = ae.EquatorFromVector(ae.RotateVector(rotation, direction))
        name = ae.Constellation(eq.ra, eq.dec).name
        if bands and bands[-1][0] == name:
            bands[-1][2] = offset+1
        else:
            bands.append([name, offset, offset+1])

    stars = {}
    for name, group in ZODIAC_STARS.items():
        stars[name] = []
        for ra, dec in group:
            vector = ae.VectorFromSphere(ae.Spherical(dec, ra*15, 1), today)
            ecl = ae.SphereFromVector(ae.RotateVector(ECLIPTIC, vector))
            stars[name].append([relative(ecl.lon), ecl.lat])
    ancient['offset'] = relative(ancient['lon'])
    modern['offset'] = 0
    return dict(modern=modern, ancient=ancient, bands=bands, stars=stars)


OPERATIONS['precession'] = precession_sky


@lru_cache(maxsize=1)
def jupiter_retrograde():
    """Nightly apparent positions in a fixed equatorial frame."""
    start = ae.Time('2025-10-24T22:00:00Z')
    observer = ae.Observer(45.4642, 9.19, 0)
    jupiter = ae.Body.Jupiter
    samples = []
    for day in range(372):
        t = start.AddDays(day)
        eq = ae.EquatorFromVector(ae.GeoVector(jupiter, t, True))
        samples.append([iso(t), eq.ra*15, eq.dec, earth_at(t),
                        ecliptic(ae.HelioVector(jupiter, t)), horizontal(jupiter, t, observer)[1],
                        ae.AngleFromSun(jupiter, t)])
    opposition = ae.SearchRelativeLongitude(jupiter, 0, start)
    stars = [[name, [[ra*15, dec] for ra, dec in ZODIAC_STARS[name]]]
             for name in ('Taurus', 'Gemini', 'Cancer', 'Leo')]
    stars.append(['Gemini field', [[102.458, 20.57], [103.197, 33.961], [105.603, 24.215],
                                    [107.784, 30.245], [109.523, 16.54], [113.981, 26.896]]])
    return dict(samples=samples, opposition=iso(opposition), stars=stars)


OPERATIONS['jupiter_retrograde'] = jupiter_retrograde


def monthly_transits(start, end):
    """Geocentric tropical longitudes at daily intervals, with an exclusive end."""
    t, stop = ae.Time(start), ae.Time(end)
    bodies = (ae.Body.Sun, ae.Body.Mercury, ae.Body.Venus, ae.Body.Mars,
              ae.Body.Jupiter, ae.Body.Saturn, ae.Body.Uranus, ae.Body.Neptune)
    return [[iso(sample), [[body.name, ae.Ecliptic(ae.GeoVector(body, sample, True)).elon]
                           for body in bodies]]
            for day in range(32) if (sample := t.AddDays(day)).ut < stop.ut - 1e-8]


OPERATIONS['monthly_transits'] = monthly_transits


# Selected J2000 positions (right ascension in hours, declination in degrees).
SKY_FIGURES = {
    'Orion': [('Betelgeuse',5.9195,7.407),('Bellatrix',5.4189,6.350),('Mintaka',5.5334,-.299),('Alnilam',5.6036,-1.202),('Alnitak',5.6793,-1.943),('Saiph',5.7959,-9.670),('Rigel',5.2423,-8.202),('Mintaka',5.5334,-.299)],
    'Ursa Major': [('Dubhe',11.062,61.75),('Merak',11.031,56.38),('Phecda',11.897,53.69),('Megrez',12.257,57.03),('Alioth',12.900,55.96),('Mizar',13.399,54.93),('Alkaid',13.792,49.31)],
    'Cassiopeia': [('Caph',.153,59.15),('Schedar',.675,56.54),('Gamma Cas',.945,60.72),('Ruchbah',1.430,60.24),('Segin',1.907,63.67)],
    'Leo': [('Regulus',10.1395,11.967),('Algieba',10.3329,19.842),('Adhafera',10.278,23.42),('Rasalas',9.879,26.01),('Denebola',11.8177,14.572)],
    'Scorpius': [('Dschubba',16.006,-22.62),('Antares',16.490,-26.432),('Tau Sco',16.598,-28.21),('Epsilon Sco',16.836,-34.29),('Shaula',17.560,-37.104),('Lesath',17.512,-37.30)],
    'Crux': [('Acrux',12.443,-63.099),('Gacrux',12.519,-57.113),('Mimosa',12.795,-59.689),('Delta Cru',12.252,-58.749)],
    'Cygnus': [('Deneb',20.6905,45.28),('Sadr',20.3705,40.257),('Albireo',19.512,27.96),('Gienah',20.770,33.97),('Sadr',20.3705,40.257),('Delta Cyg',19.750,45.13)],
    'Pegasus': [('Markab',23.079,15.21),('Scheat',23.063,28.08),('Alpheratz',.140,29.09),('Algenib',.220,15.18),('Markab',23.079,15.21)],
    'Gemini': [('Pollux',7.755,28.026),('Castor',7.577,31.889),('Mebsuta',6.732,25.13),('Tejat',6.383,22.514),('Alhena',6.629,16.399),('Pollux',7.755,28.026)],
    'Taurus': [('Elnath',5.438,28.61),('Ain',4.477,19.18),('Aldebaran',4.599,16.509),('Zeta Tau',5.627,21.14)],
    'Carina': [('Canopus',6.399,-52.696),('Miaplacidus',9.220,-69.717),('Avior',8.375,-59.51),('Aspidiske',9.285,-59.275)],
}
SKY_STARS = [('Sirius',6.7525,-16.716),('Polaris',2.5303,89.264),('Arcturus',14.261,19.182),
             ('Vega',18.6156,38.784),('Altair',19.8464,8.868),('Spica',13.420,-11.161),
             ('Fomalhaut',22.961,-29.622),('Achernar',1.6286,-57.237),
             ('Alpha Centauri',14.660,-60.834),('Procyon',7.655,5.225)]
DEEP_SKY = [
    ('Andromeda Galaxy · M31','Galaxy',.7123,41.269),('Orion Nebula · M42','Nebula',5.588,-5.391),
    ('Pleiades · M45','Open cluster',3.79,24.117),('Carina Nebula','Nebula',10.75,-59.87),
    ('Omega Centauri','Globular cluster',13.447,-47.479),('Large Magellanic Cloud','Galaxy',5.39,-69.76),
    ('Small Magellanic Cloud','Galaxy',.88,-72.8),('Lagoon Nebula · M8','Nebula',18.061,-24.386),
    ('Hercules Cluster · M13','Globular cluster',16.695,36.461),('Double Cluster','Open cluster',2.35,57.13),
    ('Triangulum Galaxy · M33','Galaxy',1.564,30.66),('Southern Pleiades','Open cluster',10.72,-64.4),
]


@lru_cache(maxsize=32)
def mini_stellarium(date, lat, lon):
    t = ae.Time(date)
    observer = ae.Observer(lat, lon, 0)
    rotation = ae.Rotation_EQJ_EQD(t)
    def star(ra, dec):
        v = ae.VectorFromSphere(ae.Spherical(dec, ra*15, 1), t)
        eq = ae.EquatorFromVector(ae.RotateVector(rotation, v))
        h = ae.Horizon(t, observer, eq.ra, eq.dec, ae.Refraction.Airless)
        return [h.azimuth, h.altitude]
    tilt = ae.Rotation_ECT_EQD(t)
    ecliptic_points = []
    for angle in range(0, 361, 2):
        a = radians(angle)
        eq = ae.EquatorFromVector(ae.RotateVector(tilt, ae.Vector(cos(a), sin(a), 0, t)))
        h = ae.Horizon(t, observer, eq.ra, eq.dec, ae.Refraction.Airless)
        ecliptic_points.append([h.azimuth, h.altitude])
    planets = (ae.Body.Mercury, ae.Body.Venus, ae.Body.Mars, ae.Body.Jupiter,
               ae.Body.Saturn, ae.Body.Uranus, ae.Body.Neptune)
    return dict(figures=[[name, [[n, *star(ra, dec)] for n, ra, dec in group]]
                         for name, group in SKY_FIGURES.items()],
                stars=[[name, *star(ra, dec)] for name, ra, dec in SKY_STARS],
                deep=[[name, kind, *star(ra, dec)] for name, kind, ra, dec in DEEP_SKY],
                planets=[[body.name, *horizontal(body, t, observer)] for body in planets],
                ecliptic=ecliptic_points, sun=horizontal(SUN, t, observer)[1],
                moon=horizontal(MOON, t, observer))


OPERATIONS['mini_stellarium'] = mini_stellarium


@lru_cache(maxsize=4)
def florence_dial(year):
    lat, lon = 43.769, 11.256
    observer = ae.Observer(lat, lon, 0)
    start = ae.Time(f'{year}-01-01T00:00:00Z')
    end = ae.Time(f'{year+1}-01-01T00:00:00Z')
    result = []
    for day in range(round(end.ut - start.ut)):
        mean = start.AddDays(day + (12 - lon/15) / 24)
        transit = ae.SearchHourAngle(SUN, observer, 0, mean.AddDays(-.04)).time
        eq = ae.Equator(SUN, mean, observer, True, True)
        h = ae.Horizon(mean, observer, eq.ra, eq.dec, ae.Refraction.Airless)
        az, alt = radians(h.azimuth), radians(h.altitude)
        result.append([iso(mean)[:10], sin(az)/cos(az), -sin(alt)/(cos(alt)*cos(az)),
                       (mean.ut - transit.ut)*1440, ae.SunPosition(mean).elon])
    return result


OPERATIONS['florence_dial'] = florence_dial
