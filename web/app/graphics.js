'use strict';
define(['./utils', './consts.js', './obstacles'], function(utils, consts, obstacles)
{
    function draw_bot(ctx, bot)
    {
        ctx.save();

        ctx.beginPath();
        var x = bot.position[0];
        var y = bot.position[1];

        var x_offset = bot.image.width / 2;
        var y_offset = bot.image.height / 2;
        ctx.translate(x, y);
        ctx.rotate(bot.rotation + consts.ANGLE_OFFSET);

        ctx.drawImage(bot.image, -x_offset, -y_offset, bot.image.width, bot.image.height);
        ctx.restore();

        ctx.fillStyle = 'red';
        utils.draw_circle(ctx, x, y, 2);
    }

    function draw_bot_sensors(ctx, bot)
    {
        ctx.fillStyle = 'blue';
        var x = bot.position[0];
        var y = bot.position[1];
        var radius = 2;

        var sensors = bot.get_trans_sensors();
        var collisions = bot.get_collissions(sensors, obstacles.obstacles);

        var dir_angle = Math.atan2(bot.direction[1], bot.direction[0]) + consts.ANGLE_OFFSET;
        for(var i = 0; i < sensors.length; ++i)
        {
            var sensor = sensors[i];
            var collision_depth = collisions[i];

            if(!_.isUndefined(collision_depth) && !_.isNull(collision_depth))
            {
                ctx.fillStyle = 'red';
                ctx.strokeStyle = 'red';
            }
            else
            {
                ctx.fillStyle = 'blue';
                ctx.strokeStyle = 'blue';
            }

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(sensor[0], sensor[1]);
            ctx.stroke();
            utils.draw_circle(ctx, sensor[0], sensor[1], radius);
        }
    }

    function draw_bot_map(ctx, map)
    {
        for(var x = 0; x < map.num_cells_x; ++x)
        {
            for(var y = 0; y < map.num_cells_y; ++y)
            {
                var cell = map.cells[x][y];
                if(cell.ticks > 0)
                {
                    var shading = utils.clamp(cell.ticks, 0, 255);
                    var color = 'rgb(255' + ',' + (255 - shading) + ',' + (255 - shading) + ')';
                    ctx.fillStyle = color;
                    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                }
            }
        }
    }

    return {
        draw_bot: draw_bot,
        draw_bot_sensors: draw_bot_sensors,
        draw_bot_map: draw_bot_map
    }
});
