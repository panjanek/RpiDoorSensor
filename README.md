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

| free          | occupied      | reserved  |
| ------------- |:-------------:| -----:|
| ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-free.jpg)  | ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-occupied.jpg) | ![alt tag](https://raw.githubusercontent.com/panjanek/RpiDoorSensor/master/doc/toilet-reservation.jpg) |



