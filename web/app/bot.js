'use strict';
define(['gl-matrix', './utils', './consts.js'], function(glmatrix, utils, consts)
{
    class Bot
    {
        constructor(bot_id, init_position, brain, memory_map)
        {
            this.bot_id = bot_id;
            this.position = glmatrix.vec2.fromValues(init_position[0], init_position[1]);
            this.rotation = 0;
            this.direction = glmatrix.vec2.fromValues(-Math.sin(this.rotation), Math.cos(this.rotation));
            this.left_track = 0;
            this.right_track = 0;
            this.brain = brain;
            this.sensors = this.create_sensors(consts.NUM_SENSORS, consts.SENSOR_RANGE);
            this.memory_map = memory_map;

            this.image = new Image();
            this.image.src = "./images/tank.png";
        }

        create_sensors(num_sensors, range)
        {
            var sensors = [];
            var segment = Math.PI / (num_sensors - 1);
            for(var i = 0; i < num_sensors; ++i)
            {
                var point = glmatrix.vec3.create();
                point[0] = -Math.sin(i * segment + consts.ANGLE_OFFSET) * range;
                point[1] = Math.cos(i * segment + consts.ANGLE_OFFSET) * range;
                point[2] = 0;
                sensors.push(point);
            }
            return sensors;
        }

        get_trans_sensors()
        {
            var dir_angle = Math.atan2(this.direction[1], this.direction[0]) + consts.ANGLE_OFFSET;
            var trans_sensors = [];
            for(let sensor of this.sensors)
            {
                var trans_sensor = glmatrix.vec3.clone(sensor);
                var origin = glmatrix.vec3.create();
                glmatrix.vec3.rotateZ(trans_sensor, trans_sensor, origin, dir_angle);
                glmatrix.vec3.add(trans_sensor, trans_sensor, this.position);
                trans_sensors.push(trans_sensor);
            }
            return trans_sensors;
        }

        update_rotation(left_track, right_track)
        {
            var rotation_force = utils.clamp(left_track - right_track, -consts.MAX_ROTATION, consts.MAX_ROTATION);
            this.rotation += rotation_force;
        }

        update_direction()
        {
            // unit circle - cos -> X, sin -> Y
            this.direction[0] = Math.cos(this.rotation);
            this.direction[1] = Math.sin(this.rotation);
        }

        update_position(left_track, right_track, x_limit, y_limit, collided)
        {
            this.memory_map.update(this.position[0], this.position[1]);

            if(!collided)
            {
                var speed = left_track + right_track;
                var tmp_dir = glmatrix.vec2.create();

                // glmatrix has asinine API
                glmatrix.vec2.copy(tmp_dir, this.direction);

                glmatrix.vec2.scale(tmp_dir, tmp_dir, speed);

                glmatrix.vec2.add(this.position, this.position, tmp_dir);

                this.position[0] = Math.min(x_limit, this.position[0]);
                this.position[0] = Math.max(0, this.position[0]);

                this.position[1] = Math.min(y_limit, this.position[1]);
                this.position[1] = Math.max(0, this.position[1]);
            }
        }

        get_line_collissions(sensors, line)
        {
            var collisions = {};
            var self = this;
            sensors.forEach(function(sensor, idx)
            {
                var depth = utils.line_intersection_2d(self.position, sensor, line[0], line[1]);
                if(!_.isNull(depth))
                {
                    collisions[idx] = depth;
                }
            });
            return collisions;
        }

        get_obstacle_collissions(sensors, obstacle)
        {
            var total_collisions = {};
            for(var i = 0; i < (obstacle.length - 1); ++i)
            {
                var collisions = this.get_line_collissions(sensors, [obstacle[i], obstacle[i+1]]);
                _.extend(total_collisions, collisions);
                if(Object.keys(total_collisions).length >= consts.NUM_SENSORS)
                {
                    return total_collisions;
                }
            }
            return total_collisions;
        }

        get_collissions(sensors, obstacles)
        {
            var result = {};
            for(var i = 0; i < obstacles.length; ++i)
            {
                var obstacle = obstacles[i];
                var collisions = this.get_obstacle_collissions(sensors, obstacle);
                _.extend(result, collisions);
                if(Object.keys(result).length >= consts.NUM_SENSORS)
                {
                    return result;
                }
            };
            return result;
        }

        get_feeler_senses(sensors, collisions)
        {
            var feelers = {};
            var self = this;
            _.each(sensors, function(sensor, idx, list)
            {
                var x = sensor[0];
                var y = sensor[1];
                var ticks = self.memory_map.ticks_lingered(x, y);
                feelers[idx] = ticks > 0 ? (ticks / consts.MAX_TICK) : -1;
            });
            return feelers;
        }

        _is_too_close_to_obstacle_to_move(collisions)
        {
            for(let value of _.values(collisions))
            {
                // arbitrarily chosen value - bots don't look terrible
                if(value <= 0.4)
                {
                    return true;
                }
            }
            return false;
        }

        _create_brain_input(collisions, feelers, collided)
        {
            var input = [];
            input.push(collided);

            _.map(_.range(consts.NUM_SENSORS), function(idx)
            {
                var collision_depth = collisions[idx];
                input.push(_.isUndefined(collision_depth) ? -1 : collision_depth);
            });

            _.map(_.range(consts.NUM_SENSORS), function(idx)
            {
                input.push(feelers[idx]);
            });
            return input;
        }

        update(ctx, world_width, world_height, obstacles)
        {
            var trans_sensors = this.get_trans_sensors();
            var collisions = this.get_collissions(trans_sensors, obstacles);
            var feelers = this.get_feeler_senses(trans_sensors, collisions);

            var collided = this._is_too_close_to_obstacle_to_move(collisions);

            var input = this._create_brain_input(collisions, feelers, collided);

            var track_speeds = this.brain.update(input);
            var left = track_speeds[0];
            var right = track_speeds[1];

            this.update_rotation(left, right);
            this.update_direction();
            this.update_position(left, right, world_width, world_height, collided);
        }
    }

    return {
        Bot: Bot
    }
});
