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
            this.ANGLE_OFFSET = -Math.PI / 2;
        }

        /**
         * Draw this bot at its current position.
         */
        draw_bot(ctx)
        {
            ctx.save();

            var x = this.position[0];
            var y = this.position[1];

            var x_offset = this.image.width / 2;
            var y_offset = this.image.height / 2;
            ctx.translate(x, y);
            ctx.rotate(this.rotation + this.ANGLE_OFFSET);

            ctx.drawImage(this.image, -x_offset, -y_offset, this.image.width, this.image.height);
            ctx.restore();

            ctx.fillStyle = 'red';
            var start_angle = 0;
            var end_angle = 2 * Math.PI;

            // fill arc from start to end - all 360 == circle
            ctx.arc(x, y, 2, start_angle, end_angle, false);
            ctx.fill();
        }

        update_rotation(left_track, right_track)
        {
            var rotation_force = utils.clamp(left_track - right_track, -this.MAX_ROTATION, this.MAX_ROTATION);
            this.rotation += rotation_force;
        }

        update_direction()
        {
            // unit circle - cos -> X, sin -> Y
            this.direction[0] = Math.cos(this.rotation);
            this.direction[1] = Math.sin(this.rotation);
        }

        update_position(left_track, right_track)
        {
            var speed = left_track + right_track;
            var tmp_dir = glmatrix.vec2.create();

            // glmatrix has asinine API
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
