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

    return {
        clamp: clamp
    }
});
