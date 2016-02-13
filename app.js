// config
var reservationDurationSeconds = 30;
var gpio_R = 28;
var gpio_G = 25;
var gpio_B = 27;
var gpio_door = 21;
var doorClosedState = 1;
var poolingInterval = 5000;
var blinkingInterval = 350;
var httpPort = 80;
var dbFile = "/home/pi/wc.txt";

// globals
var reservationHandler = -1;
var previousGpioDoor = null;
var blinkingState = false;
var sensorState = { 
    doorClosed:false, 
	error:false, 
	reservation: false,
	reservationSince: null,
	closedSince: null,
	reservationSeconds: null,
	closedSeconds: null
};

log("starting");
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
preInit();
express = require('express');               //web server
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);   //web socket server
server.listen(httpPort, function() {
	log("listening for HTTP on port "+httpPort);
}); 
readSensor();
startWaiting();
setInterval(reservationBlinking, blinkingInterval);
setInterval(readSensor, poolingInterval);


process.stdin.resume();
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('uncaughtException', exitHandler);

function exitHandler(e) {
  if (e instanceof Error) {
	  log(e.stack);
  }
  log('Exit\n');
  offLED();
  process.exit(1);
}

app.get('/api/status', function(req, res) {
    log("API request: status");
    res.contentType('application/json');
	computeSeconds();
    res.end(JSON.stringify(sensorState));
});

app.post('/api/reserve', function(req, res) {
    log("API request: reserve");
	res.contentType('application/json');
	if (!sensorState.doorClosed && !sensorState.reservation) {
		sensorState.reservation = true;
		sensorState.reservationSince = new Date();
        reservationHandler = setTimeout(function() {
			expireReservation();
		    broadcastState();			
		}, reservationDurationSeconds * 1000);		
		broadcastState();
		res.end( JSON.stringify({ code: 0 }));
	}
    else {
        res.end( JSON.stringify({ code: 101, message: "cannor_reserve_in_this_state" }));
	}
});

app.get('/api/test/:state', function(req, res) {
    log("API debug request");
    updateSensorState(parseInt(req.params.state) == 1);
    res.contentType('application/json');
    res.end( JSON.stringify({ code: 0 }));
});

app.use(express.static('/home/pi/wcsensor/public'));

io.sockets.on('connection', function (socket) {
    log("websocket connected");
	computeSeconds();
	socket.emit('change', sensorState); 
});

function preInit() {
	gpioMode(gpio_R, "out");
	gpioMode(gpio_G, "out");
	gpioMode(gpio_B, "out");
	offLED();
	gpioWrite(gpio_B, 1);
}

function updateSensorState(doorClosed) {
    var previousState = sensorState.doorClosed;
    sensorState.doorClosed = doorClosed;
	if (previousState != doorClosed) {
	    saveState();
	}
	
    if (previousState != doorClosed || sensorState.reservation) {
        expireReservation();
        log("sensor state changed to: "+doorClosed);
		if (!previousState && sensorState.doorClosed) {
			sensorState.closedSince = new Date();
		}
        broadcastState();
    }
	
	updateLED();
}

function expireReservation() {
	sensorState.reservation = false;
    if (reservationHandler != -1) {
		log("disabling reservation");
		clearTimeout(reservationHandler);
		reservationHandler = -1;
	}
	
	previousGpioDoor = null;
	setTimeout(readSensor, blinkingInterval);
}

function broadcastState() {
	computeSeconds();
	io.sockets.emit('change', sensorState); 
}

function updateLED() {
    gpioWrite(gpio_B, 0);
	if (sensorState.doorClosed) {
		gpioWrite(gpio_R, 1);
		gpioWrite(gpio_G, 0);
	} else {
		gpioWrite(gpio_R, 0);
		gpioWrite(gpio_G, 1);
	}
}

function computeSeconds() {
	var now = new Date();
	if ( sensorState.reservation)
	{	
        if (typeof sensorState.reservationSince !== 'undefined' && sensorState.reservationSince ) {
		    sensorState.reservationSeconds = reservationDurationSeconds - Math.ceil((now.getTime() - sensorState.reservationSince.getTime()) / 1000);
		}
	} else {
	    sensorState.reservationSince = null;
        sensorState.reservationSeconds = null;		
	}		
	
	if (sensorState.doorClosed) {
		if (typeof sensorState.closedSince !== 'undefined' && sensorState.closedSince ) {
		    sensorState.closedSeconds = Math.ceil((now.getTime() - sensorState.closedSince.getTime()) / 1000);
		}
	} else {
  	    sensorState.closedSince = null;
		sensorState.closedSeconds = null;		
	}			
}

function reservationBlinking(){
	if (sensorState.reservation) {
		blinkingState = !blinkingState;
		if (blinkingState) {
			gpioWrite(gpio_R, 1);
			gpioWrite(gpio_G, 0);
		} else {
			gpioWrite(gpio_R, 0);
			gpioWrite(gpio_G, 1);			
		}
	}
}

function readSensor() {
	gpioRead(gpio_door, function(value) {
		if (value != previousGpioDoor) {
			previousGpioDoor = value;
		    updateSensorState(value == doorClosedState);
		}
	});	
}

function gpioMode(pin, mode){
	exec("gpio mode "+pin+" "+mode, function (error, stdout, stderr) {});
}

function gpioWrite(pin, value) {
	exec("gpio write "+pin+" "+value, function (error, stdout, stderr) {});
}

function gpioRead(pin, callback) {
	exec("gpio read "+pin, function (error, stdout, stderr) { callback(parseInt(stdout)); });
}

function startWaiting() {
    gpioWait(gpio_door, readSensor, startWaiting);
}

function gpioWait(pin, callback1, callback2) {
    exec("gpio wfi "+pin+" both", function (error, stdout, stderr) { 
	    log("door sensor change detected"); 
        callback1();
		callback2(); 
	});
}

function offLED() {
  gpioWrite(gpio_R, 0);
  gpioWrite(gpio_G, 0);
  gpioWrite(gpio_B, 0); 
}

function log(str) {
	var timestamp = getLocalTime().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	console.log("[" + timestamp + "] " + str);
}

function saveState() {
	var timestamp = getLocalTime().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	fs.appendFile(dbFile, timestamp + "\t" + (sensorState.doorClosed ? 1 : 0) + "\n", function (err) { });
}

function getLocalTime() {
  var offset = new Date().getTimezoneOffset() * 60 * 1000;
  return new Date(new Date().getTime() - offset);
};