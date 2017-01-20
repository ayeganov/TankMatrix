define(function(require) {
    var game = require('./game');

    var bot_game = new game.Game(100, 100, "sim_canvas");
    bot_game.start();
});
