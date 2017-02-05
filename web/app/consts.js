'use strict';
define([], function()
{
    var MAX_ROTATION = 0.2;
    var ANGLE_OFFSET = -Math.PI / 2;
    var NUM_SENSORS = 5;
    var SENSOR_RANGE = 40;
    var CELL_SIZE = 30;
    var MAX_TICK = 255;

    return {
        MAX_ROTATION: MAX_ROTATION,
        ANGLE_OFFSET: ANGLE_OFFSET,
        NUM_SENSORS: NUM_SENSORS,
        SENSOR_RANGE: SENSOR_RANGE,
        CELL_SIZE: CELL_SIZE,
        MAX_TICK: MAX_TICK
    }
});
