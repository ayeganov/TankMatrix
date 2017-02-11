define(['jquery', 'underscore', './bot', './map', './obstacles', './consts', './brain', './graphics'], function($, _, bot, map, obstacles, consts, brain, graphics)
{
    class Game
    {
        constructor(canvas_id)
        {
            this.canvas = document.getElementById(canvas_id);
            this.ctx = this.canvas.getContext('2d');
            this.bots = this.initialize_bots();
            this.loop_handle = null;
            this.init_graphics();
            this.setup_events();
        }

        init_graphics()
        {
            this.canvas.style.position = "absolute";
            this.canvas.style.left = ($(window).width() / 2) - (this.canvas.width / 2) + "px";
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }

        draw_obstacles()
        {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'black';

            for(let points of obstacles.obstacles)
            {
                this._draw_obstacle(points);
            }
        }

        _draw_obstacle(obstacle_points)
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

        draw_bots()
        {
            if(this.bots.length < 1)
            {
                return;
            }

            var best_bot = _.max(this.bots, function(bot) { return bot.memory_map.get_num_cells_visited(); });
            graphics.draw_bot_map(this.ctx, best_bot.memory_map);

            for(let bot of this.bots)
            {
                graphics.draw_bot(this.ctx, bot);
            }
            graphics.draw_bot_sensors(this.ctx, best_bot);
        }

        setup_events()
        {
            document.addEventListener('keydown', this.handle_events.bind(this));
        }

        handle_events(event)
        {
            if(event.key === "Enter")
            {
                if(this.loop_handle === null)
                {
                    this.start();
                }
                else
                {
                    this.stop();
                }
            }
        }

        start()
        {
            this.loop_handle = setInterval(this.loop.bind(this), 17);
        }

        stop()
        {
            clearInterval(this.loop_handle);
            this.loop_handle = null;
        }

        loop()
        {
            this.clear_canvas();
            for(let bot of this.bots)
            {
                bot.update(this.ctx, this.canvas.width, this.canvas.height, obstacles.obstacles);
            }
            this.init_graphics();
            this.draw_bots();
            this.draw_obstacles();
        }

        post_fitnesses()
        {
            var self = this;
            $.post("fitness", JSON.stringify([ {id: 1, fitness: 1.0} ])).then(
                function(response, text_status, jqXHR) {
                    console.log("Status: " + text_status);
                    console.log("Got response: " + response);
                    self.test_brain = new brain.BotBrain(response);
                    console.log(self.test_brain.update([0.1, 0.2,0.3,0.4,0.5,0.6, 0.7,0.8,0.9,0.10,0.11]));
                    console.log("Got the brain");
                },
                function(response, text_status, jqXHR) {
                    console.log("Post failed: " + text_status);
                    console.log(response);
                }
            );
        }

        initialize_bots()
        {
            var bots = [];
            var self = this;
            $.get("init_brains").then(
                function(response, text_status, jqXHR)
                {
                    for(let r of response)
                    {
                        bots.push(new bot.Bot(1,
                                  [100, 100],
                                  new brain.BotBrain(r),
                                  new map.Map(self.canvas.width,
                                              self.canvas.height,
                                              consts.CELL_SIZE)));
                    }
                },
                function(response, text_status, jqXHR)
                {
                    throw "Bot initialization failed.";
                }
            );
            return bots;
        }

        clear_canvas()
        {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    return {
        Game: Game
    };
});
