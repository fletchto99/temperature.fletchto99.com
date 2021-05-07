CREATE TABLE temperature (
    id int NOT NULL PRIMARY KEY auto_increment,
    temperature DECIMAL(3, 1) NOT NULL,
    humidity DECIMAL(3,1) NOT NULL,
    time_recorded TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_temperature ON temperature(temperature);
CREATE INDEX idx_humidity ON temperature(humidity);
