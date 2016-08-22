CREATE TABLE Temperature (
    id int NOT NULL PRIMARY KEY auto_increment,
    temperature DECIMAL(3, 1) NOT NULL,
    humidity DECIMAL(3,1) NOT NULL,
    time_recorded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);