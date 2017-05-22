'use strict';
define(['underscore', './utils', './consts.js', './obstacles'], function(_, utils, consts, obstacles)
{
    function draw_bot(ctx, bot)
    {
        ctx.save();  /// SAVE

        ctx.beginPath();
        var x = bot.position[0];
        var y = bot.position[1];

        var x_offset = bot.image.width / 2;
        var y_offset = bot.image.height / 2;
        ctx.translate(x, y);
        ctx.rotate(bot.rotation + consts.ANGLE_OFFSET);
        ctx.drawImage(bot.image, -x_offset, -y_offset, bot.image.width, bot.image.height);

        ctx.restore();  /// RESTORE

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
                    var ticks = cell.ticks + consts.MAX_TICK;
                    var shading = utils.clamp(ticks, 0, 255);
                    var color = 'rgb(255' + ',' + (255 - shading) + ',' + (255 - shading) + ')';
                    ctx.fillStyle = color;
                    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                }
            }
        }
    }

    class Renderer
    {
        constructor(canvas)
        {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
            this.best_nn_image_1 = new Image();
            this.best_nn_image_2 = new Image();
            this.best_nn_image_3 = new Image();
            this.best_nn_image_4 = new Image();
        }

        init_graphics()
        {
            this.canvas.style.position = "absolute";
        }

        draw_border()
        {
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }

        draw_info_menu()
        {
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            var menu_points = [
                                [1200, 45],
                                [1880, 45],
                                [1880, 755],
                                [1200, 755],
                                [1200, 45]
                              ];
            this._draw_lines(menu_points);
            this.draw_best_networks();
        }

        draw_species_stats(response, bots)
        {
            var best_bot = _.max(bots, function(bot) { return bot.memory_map.get_num_cells_visited(); });
            this.ctx.font = "18px Arial";
            var x = 1205;
            var y = 610;
            var line_step = 20;
            this.ctx.fillStyle = "black";

            this.ctx.fillText("Cells visited: " + best_bot.memory_map.get_num_cells_visited(), x, y);
            y += line_step;
            this.ctx.fillText("Best so far: " + response.best_so_far, x, y);
            y += line_step;
            this.ctx.fillText("Generation: " + response.generation, x, y);
            y += line_step;
            this.ctx.fillText("Best Species ID: " + response.best_specie_id, x, y);
            y += line_step;

            this.ctx.fillText("Species Distribution Bar", x, y);
        }

        draw_species_distribution(species)
        {
            var bar_width = 665;
            var bar_height = 50;
            var colors = ["#FA8072",
                          "#87CEEB",
                          "#228B22",
                          "#8B008B",
                          "#00FFFF",
                          "#FFD700",
                          "#7CFC00",
                          "#ADD8E6",
                          "#FFA500"];

            var num_colors = _.size(colors);
            var num_species = _.size(species);

            var color_id = 0;

            var total_genomes = _.values(species).reduce(function(sum, num) { return sum + num; }, 0);

            var rect_start = [1205, 700];

            for(let id of _.keys(species))
            {
                var specie_size = species[id];
                if(specie_size <= 0) continue;
                var specie_width = bar_width * specie_size / total_genomes;

                this.ctx.beginPath();
                this.ctx.rect(rect_start[0], rect_start[1], specie_width, bar_height);
                this.ctx.fillStyle = colors[color_id];
                this.ctx.fill();
                this.ctx.closePath();

                rect_start[0] += specie_width;
                color_id = (color_id + 1) % num_colors;
            }
        }

        draw_obstacles(obstacles)
        {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'black';

            for(let points of obstacles)
            {
                this._draw_lines(points);
            }
        }

        _draw_lines(obstacle_points)
        {
            var start = obstacle_points[0];

            this.ctx.beginPath();
            this.ctx.moveTo(start[0], start[1]);
            for(let point of _.rest(obstacle_points))
            {
                this.ctx.lineTo(point[0], point[1]);
                this.ctx.stroke();
            }
        }

        draw_bots(bots)
        {
            if(bots.length < 1)
            {
                return;
            }

            var best_bot = _.max(bots, function(bot) { return bot.memory_map.get_num_cells_visited(); });
            draw_bot_map(this.ctx, best_bot.memory_map);

            for(let bot of bots)
            {
                draw_bot(this.ctx, bot);
            }
            draw_bot_sensors(this.ctx, best_bot);
        }

        draw_best_networks()
        {
            this.ctx.beginPath();
            this.ctx.drawImage(this.best_nn_image_1, 1205, 50, this.best_nn_image_1.width, this.best_nn_image_1.height);
            this.ctx.drawImage(this.best_nn_image_2, 1540, 50, this.best_nn_image_2.width, this.best_nn_image_2.height);
            this.ctx.drawImage(this.best_nn_image_3, 1205, 310, this.best_nn_image_3.width, this.best_nn_image_3.height);
            this.ctx.drawImage(this.best_nn_image_4, 1540, 310, this.best_nn_image_4.width, this.best_nn_image_4.height);
        }

        clear_canvas()
        {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        render(bots, obstacles, response)
        {
            this.clear_canvas();
            this.draw_bots(bots);
            this.draw_obstacles(obstacles);
            this.draw_border();
            this.draw_info_menu();

            if(!_.isNull(response) && !_.isUndefined(response))
            {
                this.draw_species_stats(response, bots);
                this.draw_species_distribution(response.species);
            }
        }

        update_resources()
        {
            this.best_nn_image_1.src = "./images/best_nn_1.png";
            this.best_nn_image_2.src = "./images/best_nn_2.png";
            this.best_nn_image_3.src = "./images/best_nn_3.png";
            this.best_nn_image_4.src = "./images/best_nn_4.png";
        }
    };

    class BestBotRenderer extends Renderer
    {
        draw_bots(bots)
        {
            if(bots.length < 1)
            {
                return;
            }
            var sorted_bots = _.sortBy(bots, function(bot){ return -bot.memory_map.get_num_cells_visited(); });

            var best_bot = sorted_bots[0];
            draw_bot_map(this.ctx, best_bot.memory_map);
            draw_bot_sensors(this.ctx, best_bot);

            var trans_sensors = best_bot.get_trans_sensors();
            var collisions = best_bot.get_collissions(trans_sensors, obstacles.obstacles);
            var feelers = best_bot.get_feeler_senses(trans_sensors, collisions);

            var collided = best_bot._is_collided_with_obstacle(collisions);
            var brain_input = best_bot._create_brain_input(collisions, feelers, collided);

            console.log("Collisions: " + JSON.stringify(collisions));
            console.log("Feelers: " + JSON.stringify(feelers));
            console.log("Brain input: " + JSON.stringify(brain_input));

            var best_bots = [];
            for(var i = 0; i < 4; ++i)
            {
                draw_bot(this.ctx, sorted_bots[i]);
            }
        }
    };

    class NoOpRenderer extends Renderer
    {
        render(bots, obstacles)
        {
        }
    }

    return {
        draw_bot: draw_bot,
        draw_bot_sensors: draw_bot_sensors,
        draw_bot_map: draw_bot_map,
        Renderer: Renderer,
        BestBotRenderer: BestBotRenderer,
        NoOpRenderer: NoOpRenderer
    }
});
