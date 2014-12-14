var map, size;
var currentDateTime;
var speedLabel;

$(document).ready(function () {
    $.material.init();
    initCanvasSize();
    speedlabel = $("#speedlabel");
    var player = document.getElementById('sky');
    map = bonsai.run(player, {
        url: "js/SkyMap.js"
    });
    var datePicker = $('.datepicker');
    datePicker.datetimepicker({
        timeFormat: 'hh:mm tt z',
        onSelect: function (selectedDateTime) {
            selectedDateTime = new Date(selectedDateTime);
            init(selectedDateTime);
        }
    });
    map.on('load', function () {
        init(new Date());
        initTimeMachine();
    });
});

function initCanvasSize() {
    size = $("#parentContainer").width();
    size = size * 0.8;
    $('#content').height(size);
    $('#content').width(size);
    $('#content').rotatable();
    $("#sky").height(size);
    $("#sky").width(size);
    $("#sky").css({'borderRadius': size / 2});
}

function init(date) {
    currentDateTime = date;
    $("#timeDisplay").text(date);
    var stellerData = Planets.getPositions(date, "18.52", "73.85");
    var className = "daySky";
    if (stellerData.Sun.alt < 0) {
        className = "nightSky"
    }
    var prevClass = $('#sky').attr('class');
    if (prevClass != className) {
        $("#sky").switchClass(prevClass, className, 1000);
    }
    map.sendMessage({
        "planets": stellerData,
        'size': size
    });
}
//http://localhost:63342/stellerious/index.html
var Clock = {
    currentInterval: 1,
    currentSecPerInterval: 1,
    defaultInterval: 1,
    defaultSecPerInterval: 1,
    _isFwd: true,
    _isPaused: false,

    start: function (interval, seconds) {
        if (!interval) {
            interval = this.defaultInterval;
        }
        if (!seconds) {
            seconds = this.defaultSecPerInterval;
        }
        console.log(" processing " + seconds + " seconds per interval of " + interval + " sec.");
        var self = this;
        this.interval = setInterval(function () {
            var date = new Date(currentDateTime.getTime());
            date.setSeconds(date.getSeconds() + seconds);
            init(date);
        }, interval * 1000);
    },

    play: function () {
        this._isPaused = false;
        this._isFwd = true;
        this.currentInterval = this.defaultInterval;
        this.currentSecPerInterval = this.defaultSecPerInterval;
        clearInterval(this.interval);
        delete this.interval;
        this.start(this.defaultInterval, this.defaultSecPerInterval);
    },

    pause: function () {
        this._isPaused = true;
        clearInterval(this.interval);
        delete this.interval;
    },

    forward: function () {
        clearInterval(this.interval);
        delete this.interval;
        if (!this._isFwd) {
            this.currentSecPerInterval = this.defaultSecPerInterval;
        }
        this._isFwd = true;
        this.currentInterval = 1;
        this.currentSecPerInterval = 3 * this.currentSecPerInterval;
        this.start(this.currentInterval, this.currentSecPerInterval);
        this._isPaused = false;
    },

    backward: function () {
        clearInterval(this.interval);
        delete this.interval;
        this.currentInterval = 1;
        if (this._isFwd) {
            this.currentSecPerInterval = this.defaultSecPerInterval;
            this._isFwd = false;
        }
        this.currentSecPerInterval = 3 * this.currentSecPerInterval;
        this.start(this.currentInterval, -1 * this.currentSecPerInterval);
        this._isPaused = false;
    },

    isPaused: function () {
        return this._isPaused;
    },

    getSpeedLabel : function(){
        if(this._isPaused){
            return "0x";
        }
        if(this._isFwd) {
            return this.currentSecPerInterval + "x";
        }else{
            return "-"+this.currentSecPerInterval + "x";
        }
    }
};


function initTimeMachine() {
    Clock.start();
    speedlabel.text(Clock.getSpeedLabel());
    $('#time_play').click(function () {
        if (Clock.isPaused()) {
            $('#time_play').switchClass("timePlayBtn", "timePauseBtn", 10);
            Clock.play();
        } else {
            $('#time_play').switchClass("timePauseBtn", "timePlayBtn", 10);
            Clock.pause();
        }
        speedlabel.text(Clock.getSpeedLabel());
    });
    $('#time_fwd').click(function () {
        Clock.forward();
        speedlabel.text(Clock.getSpeedLabel());
    });
    $('#time_back').click(function () {
        Clock.backward();
        speedlabel.text(Clock.getSpeedLabel());
    });
}
