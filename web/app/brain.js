'use strict';
define([], function()
{
    class Brain
    {
        constructor()
        {
            this.left_track = 0.0;
            this.right_track = 0.0;
            this.selected_track = 0;
            document.addEventListener('keydown', this.adjust_output.bind(this));
            document.addEventListener('keyup', this.level_output.bind(this));
        }

        level_output(event)
        {
            this.left_track = 0;
            this.right_track = 0;
        }

        adjust_output(event)
        {
            switch(event.key)
            {
                case 'ArrowRight':
                {
                    this.left_track = 0.2;
                    this.right_track = -0.2;
                    break;
                }
                case 'ArrowLeft':
                {
                    this.left_track = -0.2;
                    this.right_track = 0.2;
                    break;
                }
                case 'ArrowUp':
                {
                    this.left_track = 0.2;
                    this.right_track = 0.2;
                    break;
                }
                case 'ArrowDown':
                {
                    this.left_track = -0.2;
                    this.right_track = -0.2;
                    break;
                }
            }
        }

        update_track_speed(adjustment)
        {
            if(this.selected_track === 0)
            {
                this.left_track += adjustment;
                console.log("Left track speed: " + this.left_track);
            }
            else
            {
                this.right_track += adjustment;
                console.log("Right track speed: " + this.right_track);
            }
        }

        update(sensor_readings)
        {
            return [this.left_track, this.right_track];
        }
    };

    return {
        Brain: Brain
    }
});
