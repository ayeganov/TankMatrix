'use strict';
define(['gl-matrix', './brain', './utils'], function(glmatrix, brain, utils)
{
    class Bot
    {
        constructor(bot_id, init_position)
        {
            this.bot_id = bot_id;
            this.position = glmatrix.vec2.fromValues(init_position[0], init_position[1]);
            this.rotation = 0;
            this.direction = glmatrix.vec2.fromValues(-Math.sin(this.rotation), Math.cos(this.rotation));
            this.left_track = 0;
            this.right_track = 0;
            this.brain = new brain.Brain();

            this.image = new Image();
            this.image.src = "./images/tank.png";

            this.MAX_ROTATION = 0.2;

            document.addEventListener('keydown', this.move.bind(this));
        }

        move(event)
        {
            if(event.key == "ArrowRight")
            {
                this.position[0] += 1;
            }
            else if(event.key == "ArrowLeft")
            {
                this.position[0] -= 1;
            }
            else if(event.key == "ArrowUp")
            {
                this.position[1] -= 1;
            }
            else if(event.key == "ArrowDown")
            {
                this.position[1] += 1;
            }
        }

        /**
         * Draw this bot at its current position.
         */
        draw_bot(ctx)
        {
            ctx.save();

            var x = this.position[0];
            var y = this.position[1];

            ctx.translate(x, y);
            ctx.rotate(this.rotation * Math.PI / 180);

            ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
            ctx.fillStyle = 'red';
            ctx.arc(0, 0, 2, 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.restore();
        }

        update_rotation(left_track, right_track)
        {
            var rotation_force = utils.clamp(left_track - right_track, -this.MAX_ROTATION, this.MAX_ROTATION);
            this.rotation += rotation_force;
        }

        update_direction()
        {
            this.direction[0] = -Math.sin(this.rotation);
            this.direction[1] = Math.cos(this.rotation);
        }

        update_position(left_track, right_track)
        {
            var speed = left_track + right_track;
            var tmp_dir = glmatrix.vec2.create();

            // glmatrix is strange about returning results, and accepting arguments
            glmatrix.vec2.copy(tmp_dir, this.direction);
            glmatrix.vec2.scale(tmp_dir, tmp_dir, speed);
            glmatrix.vec2.add(this.position, this.position, tmp_dir);
        }

        update(ctx)
        {
            // TODO: Add readings to the update method
            var track_speeds = this.brain.update();
            var left = track_speeds[0];
            var right = track_speeds[1];

            this.update_rotation(left, right);
            this.update_direction();
            this.update_position(left, right);
            this.draw_bot(ctx);
        }
    }

    return {
        Bot: Bot
    }
});
