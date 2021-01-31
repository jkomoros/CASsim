# adjacent-possible-viz
Simple visualization library for creating schematic adjacent possible visualizations.

# Running

Modify map_data.json. 

Run `polymer serve` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state.

Run `npm run screenshot` to generate screenshots, one for each state in your map_data.json, blowing away whatever was in the screenshots/ directory.

# JSON format

The JSON file is an array of states that build on each other, shadowing and overriding what was set in earlier states.

Each state is an object with commands that apply.

*setSize*: `[rows, cols]` - Must be in the first state, and may be in later ones. Resets the map to that size.
*setAdjacentPossibleSteps*: `<positive integer>` - Override how many steps of adjacent possible around captured cells to show. 0 disables adjacent possible highlighting. Defaults to 3.
*setScale*: `<positive float>` - Override the scale of the rendered output. 1.0 is default scale.
*name*: `<string` - A name for the state, to refer to later with resetTo.
*resetTo*: `<string>` - Resets the state to the state at the named previous state. The named state must exist, and must be BEFORE this one.
*repeat*: `<integer>` - If set, will repeat this block in place that many times to save you from having to type it a lot. Useful for lots of grow blocks.
*grow*: `<non-falsey-value>` - Grows all of the active cells into a legal neighbor. If passed an object, its values can be:

Configuration for grow command
*seed*: `string` - A string to use as seed. If you don't like the result you're getting at a step, provide a different seed. If the boolean true is provided, it will operate non deterministically.
*randomness*: `[0.0 ... 1.0]` - A value for how random the neighbor pick should be. 1.0 is totally random pick of any nearby legal neighbor. 0.0 is deterministic of best valued thing
*proportion*: `[0.0 ... 1.0]` - What percentage of active cells should be grown in a given step. 1.0 is all cells, 0.0 is none.

The next groups are cell commands. They select a property to modify, a value to set, and then a range of cells to affect, like this:
`<property-name> : [[<value>, <cell-reference>], [<value>, <cell-reference>]]`.

Cell-reference can be any of:
* a `[row, col]` tuple to select a single cell
* a `[startRow, startCol, endRow, endCol]` tuple to define a rectangle, where the start and end are inclusive
* a `[]` empty tuple to select all cells in the map.

The cell properties that can be set are:
* `value` [-1.0 ... 1.0] or null: The value for the cell. 1.0 renders green, -1.0 renders red, and 0.0 renders white, with smooth gradations. A value of null will render a gray.
* `highlighted` (boolean): cells that are highlighted have an outline, and by default full opacity.
* `captured` (boolean): cells that are captured have a different colored outline, are full opacity, and also have adjacent possible partial opacity emanating from them.
* `active` (boolean): cells that are 'active' and growing. 
* `opacity` [0.0 ... 1.0] - Overrides the default opacity for a cell. Equivalent to setting fillOpacity and strokeOpacity at the same time.
* `fillOpacity` [0.0 ... 1.0] - Overrides the default opacity for a cell, affecting only the fill color.
* `strokeOpacity` [0.0 ... 1.0] - Overides the default opacity for a cell, affecting only the stroke color. 
* `scale` [0.0 ... 10.0] - Scale of individual cells (as opposed to all cells, like setScale)