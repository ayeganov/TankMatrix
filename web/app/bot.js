'use strict';
define(['gl-matrix'], function(glmatrix)
{
    class Bot
    {
        constructor(bot_id, init_position)
        {
            this.bot_id = bot_id;
            this.position = glmatrix.vec2.fromValues(init_position[0], init_position[1]);
            this.image = new Image();
            this.image.src = "./images/tank.png";
            this.image.onload = this.image_loaded.bind(this);
            this.ready = false;
        }

        move()
        {
            console.log("Moving bot " + this.bot_id);
        }

        image_loaded(img)
        {
            console.log("Image loaded");
            this.ready = true;
        }

        /**
         * Draw this bot at its current position.
         */
        draw_bot(ctx)
        {
            if(this.ready)
            {
                ctx.drawImage(this.image, this.position[0], this.position[1], this.image.width, this.image.height);
                ctx.fillStyle = 'red';
                ctx.arc(this.position[0], this.position[1], 2, 0, 2 * Math.PI, false);
                ctx.fill();
            }
            else
            {
                console.log("Not ready yet!");
            }
        }
    }

    return {
        Bot: Bot
    }
});
