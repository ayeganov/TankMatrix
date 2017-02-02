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

    /**
     * Given 2 lines in 2D space - AB and CD this function calculates the
     * distance along AB if intersection occurs between these lines. Otherwise returns null.
     */
    function line_intersection_2d(a, b, c, d)
    {
        function x(point) { return point[0]; }
        function y(point) { return point[1]; }

        // first check if lines intersect at all
        if(( y(a) > y(d) && y(b) > y(d) && y(a) > y(c) && y(b) > y(c) ) ||
           ( y(b) < y(c) && y(a) < y(c) && y(b) < y(d) && y(a) < y(d) ) ||
           ( x(a) > x(d) && x(b) > x(d) && x(a) > x(c) && x(b) > x(c) ) ||
           ( x(b) < x(c) && x(a) < x(c) && x(b) < x(d) && x(a) < x(d) ))
        {
            return null;
        }

        var r_top = (y(a) - y(c)) * (x(d) - x(c)) - (x(a) - x(c)) * (y(d) - y(c));
        var r_bot = (x(b) - x(a)) * (y(d) - y(c)) - (y(b) - y(a)) * (x(d) - x(c));

        var s_top = (y(a) - y(c)) * (x(b) - x(a)) - (x(a) - x(c)) * (y(b) - y(a));
        var s_bot = r_bot;

        var r_top_bot = r_top * r_bot;
        var s_top_bot = s_top * s_bot;

        if( (r_top_bot > 0) && (r_top_bot < (r_bot * r_bot)) && (s_top_bot > 0) && (s_top_bot < (s_bot * s_bot)) )
        {
            return r_top / r_bot;
        }
        else
        {
            return null;
        }
    }

    return {
        clamp: clamp,
        draw_circle: draw_circle,
        line_intersection_2d: line_intersection_2d
    }
});
