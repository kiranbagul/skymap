var TimeUtils = function () {
};
TimeUtils.dayMs = 1000 * 60 * 60 * 24;
TimeUtils.J1970 = 2440588;
TimeUtils.J2000 = 2451545;

TimeUtils.toJulian = function (date) {
    return date.getTime() / TimeUtils.dayMs - 0.5 + TimeUtils.J1970;
};

TimeUtils.fromJulian = function (j) {
    return new Date((j + 0.5 - TimeUtils.J1970) * TimeUtils.dayMs);
};

TimeUtils.toDays = function (date) {
    var hour = date.getUTCHours();
    var mins = date.getUTCMinutes();
    var y = date.getUTCFullYear();
    var m = date.getUTCMonth() + 1;
    var d = date.getUTCDate();
    var h = hour + mins / 60;
    var rv = 367 * y
        - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
        + Math.floor(275 * m / 9) + d - 730531.5 + h / 24;
    return rv;
};

TimeUtils.julianCenturies = function (date) {
    var jd = TimeUtils.toDays(date);
    return jd / 36525.0;
};

var Geometry = function () {
};

Geometry.DEGREES_TO_RADIANS = Math.PI / 180;
Geometry.RADIANS_TO_DEGREES = 180 / Math.PI;
Geometry.EARTH_OBLIQUITY = Geometry.DEGREES_TO_RADIANS * 23.4397;

Geometry.abs_floor = function (x) {
    var r;
    if (x >= 0.0) r = Math.floor(x);
    else          r = Math.ceil(x);
    return r;
};
Geometry.mod2pi = function (x) {
    var b = x / (2 * Math.PI);
    var a = (2 * Math.PI) * (b - Geometry.abs_floor(b));
    if (a < 0) a = (2 * Math.PI) + a;
    return a;
};

Geometry.trueAnomaly = function (M, e) {
    var V, E1;
    var EPS = 1.0e-12;
    // initial approximation of eccentric anomaly
    var E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));
    do {
        E1 = E;
        E = E1 - (E1 - e * Math.sin(E1) - M) / (1 - e * Math.cos(E1));
    } while (Math.abs(E - E1) > EPS);

    // convert eccentric anomaly to true anomaly
    V = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(0.5 * E));
    if (V < 0) {
        V = V + (2 * Math.PI);      // modulo 2pi
    }
    return V;
};
Geometry.coord_to_horizon = function (utc, ra, dec, lat, lon, h) {
    var lmst, ha, sin_alt, cos_az, alt, az;

    // compute hour angle in degrees
    ha = Geometry.mean_sidereal_time(utc, lon) - ra;
    if (ha < 0) ha = ha + 360;

    // convert degrees to radians
    ha = ha * Geometry.DEGREES_TO_RADIANS;
    dec = dec * Geometry.DEGREES_TO_RADIANS;
    lat = lat * Geometry.DEGREES_TO_RADIANS;

    // compute altitude in radians
    sin_alt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    alt = Math.asin(sin_alt);

    // compute azimuth in radians
    // divide by zero error at poles or if alt = 90 deg
    cos_az = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
    az = Math.acos(cos_az);

    // convert radians to degrees
    h.alt = alt * Geometry.RADIANS_TO_DEGREES;
    h.az = az * Geometry.RADIANS_TO_DEGREES;

    // choose hemisphere
    if (Math.sin(ha) > 0) h.az = 360 - h.az;
}

//
// "mean_sidereal_time" returns the Mean Sidereal Time in units of degrees.
// Use lon = 0 to get the Greenwich MST.
// East longitudes are positive; West longitudes are negative
//
// returns: time in degrees
//
Geometry.mean_sidereal_time = function (d, lon) {
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    var hour = d.getUTCHours();
    var minute = d.getUTCMinutes();
    var second = d.getUTCSeconds();

    if ((month == 1) || (month == 2)) {
        year = year - 1;
        month = month + 12;
    }

    var a = Math.floor(year / 100);
    var b = 2 - a + Math.floor(a / 4);
    var c = Math.floor(365.25 * year);
    var d = Math.floor(30.6001 * (month + 1));

    // days since J2000.0
    var jd = b + c + d - 730550.5 + day
        + (hour + minute / 60.0 + second / 3600.0) / 24.0;

    // julian centuries since J2000.0
    var jt = jd / 36525.0;

    // mean sidereal time
    var mst = 280.46061837 + 360.98564736629 * jd
        + 0.000387933 * jt * jt - jt * jt * jt / 38710000 + lon;

    if (mst > 0.0) {
        while (mst > 360.0)
            mst = mst - 360.0;
    }
    else {
        while (mst < 0.0)
            mst = mst + 360.0;
    }

    return mst;
};
Geometry.dms2real = function (dgr) {
    var deg = 0, min = 0, sec = 0;
    var str = dgr.split(".");
    deg = parseFloat(str[0]);
    if (str[1]) {
        min = parseFloat(str[1]);
    }
    if (str[2]) {
        sec = parseFloat(str[2]);
    }
    var rv;
    if (deg < 0) rv = deg - min / 60 - sec / 3600;
    else         rv = deg + min / 60 + sec / 3600;
    return rv;
};

var orbitalElements = {
    "Mercury": {
        "a0": 0.38709927, "a1": 0.00000037,
        "e0": 0.20563593, "e1": 0.00001906,
        "i0": 7.00497902, "i1": 0.00594749,
        "l0": 252.25166724, "l1": 149472.67486623,
        "w0": 77.45779628, "w1": 0.16047689,
        "o0": 48.33076593, "o1": 0.12534081
    },
    "Venus": {
        "a0": 0.72332102, "a1": 0.00000026,
        "e0": 0.00676399, "e1": 0.00005107,
        "i0": 3.39777545, "i1": 0.00043494,
        "l0": 181.97970850, "l1": 58517.81560260,
        "w0": 131.76755713, "w1": 0.05679648,
        "o0": 76.67261496, "o1": 0.27274174
    },
    "Earth": {
        "a0": 1.00000261, "a1": 0.00000562,
        "e0": 0.01671123, "e1": 0.00004392,
        "i0": -0.00001531, "i1": 0.01294668,
        "l0": 100.46457166, "l1": 35999.37244981,
        "w0": 102.93768193, "w1": 0.32327364,
        "o0": 0, "o1": 0
    },
    "Mars": {
        "a0": 1.52371034, "a1": 0.00001847,
        "e0": 0.09339410, "e1": 0.00007882,
        "i0": 1.84969142, "i1": 0.00813131,
        "l0": -4.55343205, "l1": 19140.30268499,
        "w0": -23.94362959, "w1": 0.44441088,
        "o0": 49.55953891, "o1": 0.29257343
    },
    "Jupiter": {
        "a0": 5.20288700, "a1": 0.00011607,
        "e0": 0.04838624, "e1": 0.00013253,
        "i0": 1.30439695, "i1": 0.00183714,
        "l0": 34.39644051, "l1": 3034.74612775,
        "w0": 14.72847983, "w1": 0.21252668,
        "o0": 100.47390909, "o1": 0.20469106
    },
    "Saturn": {
        "a0": 9.53667594, "a1": 0.00125060,
        "e0": 0.05386179, "e1": 0.00050991,
        "i0": 2.48599187, "i1": 0.00193609,
        "l0": 49.95424423, "l1": 1222.49362201,
        "w0": 92.59887831, "w1": 0.41897216,
        "o0": 100.47390909, "o1": 0.28867794
    },
    "Uranus": {
        "a0": 19.18916464, "a1": 0.00196176,
        "e0": 0.04725744, "e1": 0.00004397,
        "i0": 0.77263783, "i1": 0.00242939,
        "l0": 313.23810451, "l1": 428.48202785,
        "w0": 170.95427630, "w1": 0.40805281,
        "o0": 74.01692503, "o1": 0.04240589
    },
    "Neptune": {
        "a0": 30.06992276, "a1": 0.00026291,
        "e0": 0.00859048, "e1": 0.00005105,
        "i0": 1.77004347, "i1": 0.00035372,
        "l0": -55.12002969, "l1": 218.45945325,
        "w0": 44.96476227, "w1": 0.32241464,
        "o0": 131.78422574, "o1": 0.00508664
    }
}


var Planets = function () {
};

Planets.getMoonPosition = function (date, lat, lng) {
    var jd = TimeUtils.toDays(date);
    var L = (218.316 + 13.176396 * jd) * Geometry.DEGREES_TO_RADIANS,
        M = (134.963 + 13.064993 * jd) * Geometry.DEGREES_TO_RADIANS,
        F = (93.272 + 13.229350 * jd) * Geometry.DEGREES_TO_RADIANS,
        l = L + 6.289 * Math.sin(M) * Geometry.DEGREES_TO_RADIANS,
        b = 5.128 * Math.sin(F) * Geometry.DEGREES_TO_RADIANS,
        dt = 385001 - 20905 * Math.cos(M);
    var ra = Planets.rightAscension(l, b),
        dec = Planets.declination(l, b);
    var ha = Planets.sideRealTime(jd, Geometry.DEGREES_TO_RADIANS * -lng) - ra;
    var phi = Geometry.DEGREES_TO_RADIANS * lat;
    var h = Planets.altitude(ha, phi, dec);
    h = h + Geometry.DEGREES_TO_RADIANS * 0.017 / Math.tan(h + Geometry.DEGREES_TO_RADIANS * 10.26 / (h + Geometry.DEGREES_TO_RADIANS * 5.10));
    h = h * Geometry.RADIANS_TO_DEGREES;
    console.log(h);
    return {
        "az": (Planets.azimuth(ha, phi, dec) * Geometry.RADIANS_TO_DEGREES) + 180,
        "alt": h
    };
};

Planets.altitude = function (H, phi, dec) {
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

Planets.azimuth = function (H, phi, dec) {
    return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}

Planets.rightAscension = function (l, b) {
    var e = Geometry.EARTH_OBLIQUITY;
    return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
};

Planets.declination = function (l, b) {
    var e = Geometry.EARTH_OBLIQUITY;
    return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}

Planets.sideRealTime = function (d, lw) {
    return Geometry.DEGREES_TO_RADIANS * (280.16 + 360.9856235 * d) - lw;
};

Planets._calculatePlanetPosition = function (jc, orbitalElements) {
    var a = orbitalElements.a0 - orbitalElements.a1 * jc;
    var e = orbitalElements.e0 - orbitalElements.e1 * jc;
    var i = (orbitalElements.i0 - orbitalElements.i1 * jc) * Geometry.DEGREES_TO_RADIANS;
    var l = Geometry.mod2pi((orbitalElements.l0 + orbitalElements.l1 * jc) * Geometry.DEGREES_TO_RADIANS);
    var w = (orbitalElements.w0 + orbitalElements.w1 * jc) * Geometry.DEGREES_TO_RADIANS;
    var o = (orbitalElements.o0 - (orbitalElements.o1 * jc)) * Geometry.DEGREES_TO_RADIANS;

    var m = Geometry.mod2pi(l - w);
    var v = Geometry.trueAnomaly(m, e);
    var r = a * (1 - e * e) / (1 + e * Math.cos(v));

    var xh = r * (Math.cos(o) * Math.cos(v + w - o) - Math.sin(o) * Math.sin(v + w - o) * Math.cos(i));
    var yh = r * (Math.sin(o) * Math.cos(v + w - o) + Math.cos(o) * Math.sin(v + w - o) * Math.cos(i));
    var zh = r * (Math.sin(v + w - o) * Math.sin(i));

    return {'x': xh, 'y': yh, 'z': zh};
};

Planets.getPositions = function (date, lat, long) {
    var jc = TimeUtils.julianCenturies(date);
    var mercury = Planets._calculatePlanetPosition(jc, orbitalElements.Mercury);
    var venus = Planets._calculatePlanetPosition(jc, orbitalElements.Venus);
    var mars = Planets._calculatePlanetPosition(jc, orbitalElements.Mars);
    var jupiter = Planets._calculatePlanetPosition(jc, orbitalElements.Jupiter);
    var saturn = Planets._calculatePlanetPosition(jc, orbitalElements.Saturn);
    var uranus = Planets._calculatePlanetPosition(jc, orbitalElements.Uranus);
    var neptune = Planets._calculatePlanetPosition(jc, orbitalElements.Neptune);
    var earth = Planets._calculatePlanetPosition(jc, orbitalElements.Earth);

    return {
        "Sun": Planets.calculateRelativePositions({'x': 0, 'y': 0, 'z': 0}, earth, lat, long, date),
        "Mercury": Planets.calculateRelativePositions(mercury, earth, lat, long, date),
        "Venus": Planets.calculateRelativePositions(venus, earth, lat, long, date),
        "Mars": Planets.calculateRelativePositions(mars, earth, lat, long, date),
        "Jupiter": Planets.calculateRelativePositions(jupiter, earth, lat, long, date),
        "Saturn": Planets.calculateRelativePositions(saturn, earth, lat, long, date),
        "Uranus": Planets.calculateRelativePositions(uranus, earth, lat, long, date),
        "Neptune": Planets.calculateRelativePositions(neptune, earth, lat, long, date),
        "Moon": Planets.getMoonPosition(date, lat, long)
    };
};

Planets.calculateRelativePositions = function (planet, earth, lat, long, date) {
    var xg = planet.x - earth.x;
    var yg = planet.y - earth.y;
    var zg = planet.z - earth.z;
    var cEq = Planets.convertToEquatorialCoordinates(xg, yg, zg);
    var c = Planets.convertToRaDec(cEq.xeq, cEq.yeq, cEq.zeq);
    return Planets.getGroundPosition(date, c.ra, c.dec, lat, long);
};

Planets.convertToEquatorialCoordinates = function (x, y, z) {
    var ecl = 23.439281 * Geometry.DEGREES_TO_RADIANS;
    var xeq = x;
    var yeq = y * Math.cos(ecl) - z * Math.sin(ecl);
    var zeq = y * Math.sin(ecl) + z * Math.cos(ecl);
    return {
        "xeq": xeq,
        "yeq": yeq,
        "zeq": zeq
    }
};

Planets.convertToRaDec = function (xeq, yeq, zeq) {
    var ra = Geometry.mod2pi(Math.atan2(yeq, xeq)) * Geometry.RADIANS_TO_DEGREES;
    var dec = Math.atan(zeq / Math.sqrt(xeq * xeq + yeq * yeq)) * Geometry.RADIANS_TO_DEGREES;
    var rvec = Math.sqrt(xeq * xeq + yeq * yeq + zeq * zeq);
    return {
        "ra": ra,
        "dec": dec,
        "rvec": rvec
    }
};

Planets.getGroundPosition = function (date, ra, dec, lat, lon) {
    var h = {};
    var lt = Geometry.dms2real(lat);
    var ln = Geometry.dms2real(lon);
    Geometry.coord_to_horizon(date, ra, dec, lt, ln, h);
    return h;
};

