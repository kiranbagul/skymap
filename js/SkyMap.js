var sky;

var planets;
var centerX, centerY;
var sun = new Bitmap('../img/sun1.png').on('load', function () {
    this.addTo(stage);
});
var moon = new Bitmap('../img/moon.png').on('load', function () {
    this.addTo(stage);
});
var mercury = initPlanet("Mercury");
var venus = initPlanet("Venus");
var mars = initPlanet("Mars");
var jupiter = initPlanet("Jupiter");
var saturn = initPlanet("Saturn");
var uranus = initPlanet("Uranus");
var neptune = initPlanet("Neptune");

moon.attr({
    width: 20,
    height: 20
});

var first = true;

stage.on('message', function (data) {
    size = data.size;
    planets = data.planets;
    init();
    drawsun(planets.Sun.alt, planets.Sun.az);
    drawmoon(planets.Moon.alt, planets.Moon.az);
    refreshPlanet(mercury, planets.Mercury.alt, planets.Mercury.az);
    refreshPlanet(venus, planets.Venus.alt, planets.Venus.az);
    refreshPlanet(mars, planets.Mars.alt, planets.Mars.az);
    refreshPlanet(jupiter, planets.Jupiter.alt, planets.Jupiter.az);
    refreshPlanet(saturn, planets.Saturn.alt, planets.Saturn.az);
    refreshPlanet(uranus, planets.Uranus.alt, planets.Uranus.az);
    refreshPlanet(neptune, planets.Neptune.alt, planets.Neptune.az);
});

function init() {
    if (first) {
        centerX = size / 2;
        centerY = centerX;
        stage.height = size;
        stage.width = size;
        addLabels();
        first = false;
        addLine();
    }
}

function addLabels() {
    var n = new Text("N");
    var pos = getXY(0, 0);
    addTextToPosition(n, pos.x - 5, pos.y);
    var s = new Text("S");
    pos = getXY(0, 180);
    addTextToPosition(s, pos.x -5, pos.y - 13);
    var e = new Text("W");
    pos = getXY(0, 270);
    addTextToPosition(e, pos.x, pos.y -5);
    var w = new Text("E");
    pos = getXY(0, 90);
    addTextToPosition(w, pos.x - 13, pos.y -5);
    add(5, "yellow", 0, 45);
    add(5, "yellow", 0, 135);
    add(5, "yellow", 0, 225);
    add(5, "yellow", 0, 315);
}

function addText(text, r, t) {
    var n = new Text(text);
    var pos = getXY(r, t);
    addTextToPosition(n, pos.x, pos.y);
}

function addTextToPosition(label, x, y) {
    var f = new filter.DropShadow(1, 1, 0, "#333");
    label.attr({
        x: x,
        y: y,
        textFillColor: 'white',
        fontFamily: 'Arial',
        fontSize: '14'
    });
    label.attr('filters', f);
    stage.addChild(label);
}

function add(radius, color, r, t) {
    var pos = getXY(r, t);
    var circle = bonsai.Path.
        circle(pos.x, pos.y, radius).
        attr({
            fillColor: color
        });
    stage.addChild(circle);
}

function initPlanet(name) {
    var container = new Group();
    var circle = bonsai.Path.
        circle(0, 0, 3).
        attr({
            fillColor: "white"
        });
    circle.addTo(container);
    var label = new Text(name);
    label.attr({
        x: 5,
        y: 5,
        textFillColor: 'white',
        fontFamily: 'Arial',
        fontSize: '14'
    });
    var f = new filter.DropShadow(1, 1, 2, "#333");
    label.addTo(container);
    label.attr('filters', f);
    container.addTo(stage);
    return container;
}

function refreshPlanet(container, r, t) {
    var pos = getXY(r, t);
    if(r < 0 && container.rad < 0){
        container.attr( {
            x: pos.x,
            y: pos.y
        });
    }else {
        var aAnim = new Animation('1s', {
            x: pos.x,
            y: pos.y
        });
        container.animate(aAnim);
    }
    container.rad = r;
}

function drawsun(r, t) {
    var pos = getXY(r, t);
    if(r < 0 && sun.rad < 0){
        sun.attr( {
            x: pos.x,
            y: pos.y
        });
    }else {
        var aAnim = new Animation('1s', {
            x: pos.x - 107,
            y: pos.y - 107
        });
        sun.animate(aAnim);
    }
    sun.rad = r;
}

function drawmoon(r, t) {
    var pos = getXY(r, t);
    if(r < 0 && moon.rad < 0){
        moon.attr( {
            x: pos.x,
            y: pos.y
        });
    }else {
        var aAnim = new Animation('1s', {
            x: pos.x,
            y: pos.y,
            width: 20,
            height: 20
        });
        moon.animate(aAnim);
    }
    moon.rad = r;
}

function getXY(r, t) {
    var r1 = r <= 90 ? 90 - r : 180 - r;
    var t1 = convert(t);
    t1 = t1 * (3.14 / 180);
    var xd = r1 * Math.cos(t1);
    var yd = r1 * Math.sin(t1);
    yd = (yd * size / 2) / 90;
    xd = (xd * size / 2) / 90;
    var x = centerX + xd,
        y = centerY - yd;
    return {
        "x": x,
        "y": y
    };
}

function convert(x) {
    if (0 <= x && x <= 90) {
        return 90 - x;
    } else if (91 <= x && x <= 180) {
        return 270 + (180 - x);
    } else if (181 <= x && x <= 270) {
        return 180 + (270 - x);
    } else {
        return 90 + (360 - x);
    }
}

function addGrid() {

}

function addLine() {
    var center = getXY(90, 0);

    var v = getXY(0, 0);
    var h = getXY(0, 270);
    var wn = getXY(0, 135);

    var circle1 = bonsai.Path.
        circle(center.x, center.y, size / 4)
        .addTo(stage)
        .stroke('lightgray', 1);
    var circle2 = bonsai.Path.
        circle(center.x, center.y, size / 8)
        .addTo(stage)
        .stroke('lightgray', 1);
    var circle3 = bonsai.Path.
        circle(center.x, center.y, size / 4 + size / 8)
        .addTo(stage)
        .stroke('lightgray', 1);
    var rect1 = new Rect(v.x, v.y, 0, size).addTo(stage)
        .stroke('lightgray', 1);
    var rect2 = new Rect(h.x, h.y, size, 0).addTo(stage)
        .stroke('lightgray', 1);
}