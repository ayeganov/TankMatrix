'use strict';
define(['./utils'], function(utils)
{
    class MapCell
    {
        constructor(x, y, width, height)
        {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.ticks = 0;
        }

        update()
        {
            ++this.ticks;
        }

        reset()
        {
            this.ticks = 0;
        }
    }

    class Map
    {
        constructor(width, height, cell_size)
        {
            this.width = width;
            this.height = height;
            this.cell_size = cell_size;

            this.num_cells_x = Math.floor(width / cell_size) + 1;
            this.num_cells_y = Math.floor(height / cell_size) + 1;
            this.cells = this._create_cells();
        }

        _create_cells()
        {
            var cells = [];
            for(var x = 0; x < this.num_cells_x; ++x)
            {
                var row = [];
                for(var y = 0; y < this.num_cells_y; ++y)
                {
                    var x_coord = x * this.cell_size;
                    var y_coord = y * this.cell_size;
                    row.push(new MapCell(x_coord,
                                         y_coord,
                                         this.cell_size,
                                         this.cell_size));
                }
                cells.push(row);
            }
            return cells;
        }

        update(x_pos, y_pos)
        {
            this._get_cell_absolute_coord(x_pos, y_pos).update();
        }

        ticks_lingered(x_pos, y_pos)
        {
            return this._get_cell_absolute_coord(x_pos, y_pos).ticks;
        }

        _get_cell_absolute_coord(x_pos, y_pos)
        {
            if(x_pos > this.width || x_pos < 0 || y_pos > this.height || y_pos < 0)
            {
                throw "Invalid cell location: " + x_pos + ", " + y_pos;
            }

            var cellx = Math.floor(x_pos / this.cell_size);
            var celly = Math.floor(y_pos / this.cell_size);
            return this.cells[cellx][celly];
        }

        get_num_cells_visited()
        {
            var total = 0;
            for(var x = 0; x < this.num_cells_x; ++x)
            {
                for(var y = 0; y < this.num_cells_y; ++y)
                {
                    total += this.cells[x][y].ticks > 0;
                }
            }
            return total;
        }

        draw_map(ctx)
        {
            for(var x = 0; x < this.num_cells_x; ++x)
            {
                for(var y = 0; y < this.num_cells_y; ++y)
                {
                    var cell = this.cells[x][y];
                    if(cell.ticks > 0)
                    {
                        var shading = utils.clamp(cell.ticks, 0, 255);
                        var color = 'rgb(255' + ',' + (255 - shading) + ',' + (255 - shading) + ')';
                        ctx.fillStyle = color;
                        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    }
                }
            }
        }

        reset()
        {
            for(var x = 0; x < this.num_cells_x; ++x)
            {
                for(var y = 0; y < this.num_cells_y; ++y)
                {
                    this.cells[x][y].reset();
                }
            }
        }
    }

    return {
        Map: Map,
        MapCell: MapCell
    }
});
