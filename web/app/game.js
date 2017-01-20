define(['jquery', './bot'], function($, bot)
{
    class Game
    {
        constructor(height, width, canvas_id)
        {
            this.height = height;
            this.width = width;
            this.canvas = document.getElementById(canvas_id);
            this.ctx = this.canvas.getContext('2d');
            this.init_graphics();
        }

        init_graphics()
        {
            console.log("Window width: " + $(window).width());
            this.canvas.style.position = "absolute";
            this.canvas.style.left = ($(window).width() / 2) - (this.canvas.width / 2) + "px";
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }

        start()
        {
            var self = this;
            var first_bot = new bot.Bot(1, [100, 100]);
//            first_bot.move();
            setTimeout(function() { first_bot.draw_bot(self.ctx); }, 1000);
        }
    }

    return {
        Game: Game
    };
});
