define(['jquery', 'underscore', './bot', './map', './obstacles', './consts', './brain', './graphics'], function($, _, bot, map, obstacles, consts, brain, graphics)
{
    class Game
    {
        constructor(canvas_id)
        {
            this.canvas = document.getElementById(canvas_id);
            this.bots = this.initialize_bots();
            this.loop_handle = null;
            this.epoch_handle = null;
            this.current_loop = this.loop;

            this.loop_interval_time = 1000 / consts.FPS;
            this.epoch_interval_time = consts.EPOCH_INTERVAL * 1000;

            console.log("Loop interval: " + this.loop_interval_time);
            console.log("Epoch interval: " + this.epoch_interval_time);

            this.render_graphics = true;
            this.renderer = new graphics.Renderer(this.canvas);

            this.renderer.init_graphics();
            this.renderer.draw_border();
            this.setup_events();
            this.response = null;
        }

        epoch()
        {
            console.log("Epoch");
            this.stop();
            var fitnesses = _.map(this.bots, function(bot, idx)
                                             {
                                                return bot.memory_map.get_num_cells_visited();
                                             });
            this.post_fitnesses(fitnesses, this.epoch_completed.bind(this));
        }

        epoch_completed(response)
        {
            console.log("Epoch completed");
            for(let bb of _.zip(this.bots, response.brains))
            {
                var bot = bb[0];
                var bot_brain = bb[1];
                bot.reset();
                bot.set_brain(new brain.BotBrain(bot_brain));
            }
            this.renderer.update_resources();

            this.response = response;
            this.start();
        }

        setup_events()
        {
            document.addEventListener('keydown', this.handle_events.bind(this));
        }

        handle_events(event)
        {
            if(event.key === "Enter")
            {
                console.log("Starting regular loop");
                this.stop();
                this.renderer = new graphics.Renderer(this.canvas);
                this.current_loop = this.loop;
                this.start();
            }
            else if(event.key === " ")
            {
                console.log("Starting fast loop");
                this.stop();
                this.renderer = new graphics.NoOpRenderer(this.canvas);
                this.current_loop = this.fast_loop;
                this.start();
            }
            else if(event.key === "b")
            {
                this.renderer = new graphics.BestBotRenderer(this.canvas);
            }
            else if(event.key === "a")
            {
                this.renderer = new graphics.Renderer(this.canvas);
            }
            else if(event.key === "s")
            {
                this.current_loop = null;
                this.stop();
            }
            else if(event.key === "m")
            {
                this.update_game_state();
            }
        }

        start()
        {
            console.log("Starting...");
            this._schedule_frame();

            // schedule epoch callback if regular loop
            if(this.current_loop === this.loop)
            {
                this.epoch_handle = setTimeout(this.epoch.bind(this), this.epoch_interval_time);
            }
        }

        _schedule_frame()
        {
            if(this.current_loop !== null)
            {
                this.loop_handle = setTimeout(this.current_loop.bind(this), this.loop_interval_time);
            }
        }

        stop()
        {
            console.log("Stopping the loop");
            clearTimeout(this.loop_handle);
            clearTimeout(this.epoch_handle);
            this.loop_handle = null;
            this.epoch_handle = null;
        }

        update_game_state()
        {
            for(let bot of this.bots)
            {
                bot.update(this.canvas.width, this.canvas.height, obstacles.obstacles);
            }

            if(this.render_graphics)
            {
                this.renderer.render(this.bots, obstacles.obstacles, this.response);
            }
        }

        fast_loop()
        {
            for(var i = 0; i < consts.FAST_MODE_FRAMES_PER_EPOCH; ++i)
            {
                this.update_game_state();
            }

            var fitnesses = _.map(this.bots, function(bot, idx)
                                             {
                                                return bot.memory_map.get_num_cells_visited();
                                             });
            this.post_fitnesses(fitnesses, this.epoch_completed.bind(this));
        }

        loop()
        {
            this.update_game_state();
            this._schedule_frame();
        }

        post_fitnesses(fitnesses, completion_cb)
        {
            console.log(fitnesses);
            var self = this;
            $.post("fitness", JSON.stringify(fitnesses)).then(
                function(response, text_status, jqXHR) {
                    completion_cb(response);
                },
                function(response, text_status, jqXHR) {
                    console.log("Fetching bot brains failed: " + text_status);
                }
            );
        }

        initialize_bots()
        {
            var self = this;
//            var bots = [new bot.Bot(1,
//                        consts.BOT_START_POSITION,
//                        new brain.PlayerBrain(),
//                        new map.Map(self.canvas.width,
//                                    self.canvas.height,
//                                    consts.CELL_SIZE))];
            var bots = [];
            $.get("init_brains").then(
                function(response, text_status, jqXHR)
                {
                    for(let r of response)
                    {
                        bots.push(new bot.Bot(1,
                                  consts.BOT_START_POSITION,
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
    }

    return {
        Game: Game
    };
});
