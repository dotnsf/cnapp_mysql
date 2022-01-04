# cnapp_mysql

## Overview

Sample Cloud Native application with MySQL.


## docker commands

### Run MySQL on docker

`$ docker run -d --name mysql -p 3306:3306 -e MYSQL_USER=user1 -e MYSQL_PASSWORD=pass1 -e MYSQL_DATABASE=mydb -e MYSQL_ROOT_PASSWORD=P@ssw0rd mysql:5.7` 

### Exec bash shell on running MySQL docker container

`$ docker container exec -it mysql bash`


### Exec SQL from text file

`mysql> source items.ddl`


## Environment values

- MYSQL_USERNAME : 

- MYSQL_USERNAME : 


## Licensing

This code is licensed under MIT.


## Copyright

2022 K.Kimura @ Juge.Me all rights reserved.

