# RpiDoorSensor
Door sensor web application for Raspberry Pi

# Typical setup
Raspberry Pi runs nodejs web application serving a web page with information if the door is open (for example busy office toilet door).
Toilet door state is sensed with reed switch or simple switch mounted to the door connected to GPIO.
Optionally, RGB LED drived with three GPIO pins shows the current sensor state.

# Wiring

![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/doorsensor_schem.png) 

# How it works

Node application monitors state of S1 switch connected to GPIO using shell command 'gpio'. Each change of switch state is broadcasted using websockets to client browsers.
"Reserve" button allows to broadcast intention of visiting toilet.

# How it looks

After starting nodejs web application this is how the web interface looks like:

| free          | occupied      | reserved  |
| ------------- |:-------------:| -----:|
| ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-free.jpg)  | ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-occupied.jpg) | ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-reservation.jpg) |

# Installation

1. Setup [Raspberry Pi with Raspian](https://www.raspberrypi.org/downloads/raspbian/)
2. Upgrade [nodejs to 4.0.0 or later](http://blog.wia.io/installing-node-js-v4-0-0-on-a-raspberry-pi/)
3. Perform following commands in raspberry pi home folder (/home/pi/):
   
```
git clone https://github.com/panjanek/RpiDoorSensor.git
cd RpiDoorSensor
npm install
```
4. Run the application
   
```
sudo nodejs app.js
```
5. In order to start the application at boot add the following line in ```contab -e```
   
```
@reboot /home/pi/doorstart.sh &
```


