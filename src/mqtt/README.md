
`docker run -it -p 1883:1883 -p 9001:9001 -v mosquitto.conf:/mosquitto/config/mosquitto.conf eclipse-mosquitto`



container id: daa13dfcccd9


## login interactively into the mqtt container
`sudo docker exec -it daa13dfcccd9 sh`

## add user and it will prompt for password
mosquitto_passwd -c /mosquitto/config/pwfile user1

## delete user command format
mosquitto_passwd -D /mosquitto/config/pwfile <user-name-to-delete>

## type 'exit' to exit out of docker container prompt

## Restart docker container
sudo docker restart daa13dfcccd9

## Subscriper
mosquitto_sub -v -L mqtt://user1:backdoor@localhost/test/topic


## Puplisher
mosquitto_pub -L mqtt://user1:backdoor@localhost/test/topic -m 'hello MQTT'