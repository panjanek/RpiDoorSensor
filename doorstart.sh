#! /bin/bash
(
   while : ; do
       nodejs /home/pi/RpiDoorSensor/app.js >> /var/log/door.log 2>&1
       sleep 2
   done
) &
