'use strict';
define(['underscore'], function(_)
{
    class PlayerBrain
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
                    this.left_track = 0.02;
                    this.right_track = -0.02;
                    break;
                }
                case 'ArrowLeft':
                {
                    this.left_track = -0.02;
                    this.right_track = 0.02;
                    break;
                }
                case 'ArrowUp':
                {
                    this.left_track = 1.0;
                    this.right_track = 1.0;
                    break;
                }
                case 'ArrowDown':
                {
                    this.left_track = -1.0;
                    this.right_track = -1.0;
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


    class BotBrain
    {
        constructor(json_net)
        {
            this.neurons = this._restore_links(json_net);
        }

        _restore_links(neurons)
        {
            var get_neuron_ptr = function(nid)
            {
                for(let neuron of neurons)
                {
                    if(neuron.ID === nid)
                    {
                        return neuron;
                    }
                }
                throw "Invalid network file: Referenced neuron ID " + nid + " doesn't have a neuron object.";
            };

            for(let neuron of neurons)
            {
                neuron.OutputSignal = 0.0;
                for(let link of neuron.InLinks)
                {
                    link.In = get_neuron_ptr(link.InputID);
                }

                for(let link of neuron.OutLinks)
                {
                    link.In = get_neuron_ptr(link.OutputID);
                }
            }
            return neurons;
        }

        _activation_function(value, activation_response)
        {
            return (1.0 / (1.0 + Math.exp(-4.9 * value)));
        }

        update(sensor_readings)
        {
            var outputs = [];
            var neuron_idx = 0;

            while(this.neurons[neuron_idx].Type === "INPUT")
            {
                this.neurons[neuron_idx].OutputSignal = sensor_readings[neuron_idx];
                ++neuron_idx;
            }

            // set the bias neuron output to 1
            this.neurons[neuron_idx++].OutputSignal = 1;

            while(neuron_idx < this.neurons.length)
            {
                var cur_neuron = this.neurons[neuron_idx];
                var pre_activations = _.map(cur_neuron.InLinks, function(link, idx)
                {
                    return link.Weight * link.In.OutputSignal;
                });

                var sum = _.reduce(pre_activations, function(memo, output) { return memo + output; }, 0);

                cur_neuron.OutputSignal = this._activation_function(sum, cur_neuron.ActivationResponse);

                if(cur_neuron.Type === "OUTPUT")
                {
                    outputs.push(cur_neuron.OutputSignal);
                }
                ++neuron_idx;
            }

            return outputs;
        }

    };

    return {
        PlayerBrain: PlayerBrain,
        BotBrain: BotBrain
    }
});
