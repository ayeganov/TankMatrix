'use strict';
define([], function()
{
    function clamp(value, min_value, max_value)
    {
        return Math.max(Math.min(value, max_value), min_value);
    }

    function random_in_range(min, max)
    {
        return Math.random() * (max - min) + min;
    }

    function draw_circle(ctx, x, y, radius)
    {
        var start_angle = 0;
        var end_angle = 2 * Math.PI;

        // fill arc from start to end - all 360 == circle
        ctx.arc(x, y, radius, start_angle, end_angle, false);
        ctx.fill();
        ctx.beginPath();
    }

    return {
        clamp: clamp,
        draw_circle: draw_circle
    }
});
