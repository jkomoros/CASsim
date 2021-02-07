# adjacent-possible-viz
Simple visualization library for creating schematic adjacent possible visualizations.

Still in a kind of messy state. If you use it, reach out to alex@komoroske.com and I'll invest in cleaning it up! Alternatively, file a new issue with a feature suggestion or question!

![Animated Example](/examples/accumulate.gif?raw=true)

# Installing

Install npm.

Check out this repo.

Run `npm install` to install dependencies.

# Running

If you want to do your own frames, create a `frame_data.json` in the root of the repo. If not provided, `frame_data.SAMPLE.json` will be used.

Run `polymer serve` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state.

Run `npm run generate` to generate screenshots, one for each state in your `frame_data.json`, blowing away whatever was in the screenshots/ directory.

If you only want to generate the screenshots, not the gifs, run `npm run generate:screenshot`. If you only want to generate the gifs based on already-generated screenshots, run `npm run generate:gif`.

# JSON format

The JSON file is an array of frames that build on each other, shadowing and overriding what was set in earlier frames.

Each frame is an object with commands that apply:

- `setSize`: `[rows, cols]` - Must be in the first state, and may be in later ones. Resets the map to that size.
- `setAdjacentPossibleSteps`: `<positive integer>` - Override how many steps of adjacent possible around captured cells to show. 0 disables adjacent possible highlighting. Defaults to 3.
- `setScale`: `<positive float>` - Override the scale of the rendered output. 1.0 is default scale.
- `setColors`: `<object>` - Set colors of the given names to the given values. See `colorsParameters` for information on the meaning of each color name. See `colorDefinition` for legal value of the keys of the object. Colors that are not named will not be modified from the state before. Setting a color to `null` will set the color back to the default value.
- `description`: `<string>` - A string describing what that frame. The description doesn't do anything, it's more to help orient you in your frame description.
- `name`: `<string` - A name for the state, to refer to later with resetTo.
- `resetTo`: `<string>` - Resets the state to the state at the named previous state. The named state must exist, and must be BEFORE this one.
- `repeat`: `<integer>` - If set, will repeat this block in place that many times to save you from having to type it a lot. Useful for lots of grow blocks.
- `disable`: `true` - If true, then it will be as though that frame wasn't in the JSON at all. Useful for temporarily disabling a frame when debugging your definitions.
- `gif`: `<object> or <string> or true` - If set, this frame will be marked to be rolled up into the gif. Each unique string will denote a different named gif. true defaults to 'default'. If an object, it should have the shape of gifParameters below. Only one gifParameters per gif needs to be set; the rest can just use a string of the same name. All frames for a given gif must be the same size (scale and setSize) or the gif won't be saved. Frames tagged to be included in a gif will not have a transparent background (otherwise the variable alpha looks weird).
- `grow`: `<non-falsey-value>` - Grows all of the active cells into a legal neighbor. See growParameters below for more values that can be passed in an object.
- `generate`: `<non-falsey-value>` - Generates a new map of values in the map. See generateParameters below for more values that can be passed in an object.

**colorDefinition**:
Color defintions in the `setColors` command block can be:
- A string like '#FFCC00', or '#FC0' or '#FFCC00FF' or '#FC0F'
- A string like 'rgb(255, 106, 0)' or 'rgba(255, 106, 0, 1.0)'
- A css named string like `aliceblue` or `transparent`
- A tuple of [r, g, b] or [r, g, b, a] values

**colorParameters**:
- `zero` - The color for cells with a value 0.0
- `positive` - The color for cells with a value of 1.0
- `negative` - The color for cells with a value of 0.0
- `empty` - The color for cells that are set to null
- `captured` - The color for the stroke for captured cells
- `highlighted` - The color for the stroke for highlighted cells
- `background` - The color of the background of the diagram. The background will not be in png screenshots by default (it will be transparent), but for GIF frames the background will be included (since GIFs don't handle variable transparency).

**gifParameters**:
- `name` - `string` If providing an object, name is required. This will be the name of the gif output, and also how other frames can denote they are part of the same gif by providing `gif: <string>`.
- `repeat` - `<integer>` Defaults to 0. How many repeats to have in the gif. -1 is no repeat, 0 is infinite, and any other positive integer is repeat count.
- `delay` - `<integer>` Defaults to 150. How many ms to wait between frames in the gif.

**growParameters**:
- `seed`: `string` - A string to use as seed. If you don't like the result you're getting at a step, provide a different seed. If the boolean true is provided, it will operate non deterministically.
- `randomness`: `[0.0 ... 1.0]` - A value for how random the neighbor pick should be. 1.0 is totally random pick of any nearby legal neighbor. 0.0 is deterministic of best valued thing
- `proportion`: `[0.0 ... 1.0]` - What percentage of active cells should be grown in a given step. 1.0 is all cells, 0.0 is none. This is the relative version of numCellsToGrow
- `numCellsToGrow`: `[integer]` - The highest number of cells to grow in a step, an absolute number. If more than 0, then this will put in place a cap. See also proportion, which is a proportion of active cells.
- `valuePly` `[integer]` - How many concentric rings away from a cell to consider when looking at which neighbor to grow into. Defaults to 8.
- `valueDropoff` `[0.0 - 1.0]` - How much of the value of neighbors to discount when adding to a cell's own value. Larger numbers put more emphasis on the cell itself, not its neighbors. Defaults to 0.75.
- `branchLikelihood` `[0.0 -1.0]` - How likely a given active cell when growing is to branch--to both grow and leave the old one active, too. Defaults to 0.0.

**generateParameters**:
- `seed`: `string` - A string to use as seed. If you don't like the result you're getting, provide a different seed. If the boolean true is provided, it will operate non deterministically.
- `keyCellProportion`: `[0.0 - 1.0]` A float of what percentage of all cells in the map should be explicitly set. Smaller numbers produce larger contiguous regions of color. Defaults to 0.6.s
- `proportions`: `<map of key to value>` A map of value to proportion, to override how often a given value shows up in genration. Values that are not provided will use their default. The key is things like `1.0`, `0.0`. The value should be between 0 and 100 saying how common it is. Special keys are 'max', 'min', 'zero', 'null', 'negative', and 'positive', which will be used for those special values if specific numeric keys that are more specific aren't provided. The default values are:
```
 {
	max: 100,
	min: 15,
	positive: 100,
	negative: 5,
	zero: 25,
	null: 15
};
```

The next groups are cell commands. They select a property to modify, a value to set, and then a range of cells to affect, like this:
`<property-name> : [[<value>, <cell-reference>], [<value>, <cell-reference>]]`.

Cell-reference can be any of:
- a `[row, col]` tuple to select a single cell
- a `[startRow, startCol, endRow, endCol]` tuple to define a rectangle, where the start and end are inclusive
- a `[]` empty tuple to select all cells in the map.

The cell properties that can be set are:
- `value` [-1.0 ... 1.0] or null: The value for the cell. 1.0 renders green, -1.0 renders red, and 0.0 renders white, with smooth gradations. A value of null will render a gray.
- `highlighted` (boolean): cells that are highlighted have an outline, and by default full opacity.
- `captured` (boolean): cells that are captured have a different colored outline, are full opacity, and also have adjacent possible partial opacity emanating from them.
- `active` (boolean): cells that are 'active' and growing. Automatically sets captured to true to if not already set.
- `activeOnly` (boolean): If you want to set a cell to active without also capturing it.
- `opacity` [0.0 ... 1.0] - Overrides the default opacity for a cell. Equivalent to setting fillOpacity and strokeOpacity at the same time.
- `fillOpacity` [0.0 ... 1.0] - Overrides the default opacity for a cell, affecting only the fill color.
- `strokeOpacity` [0.0 ... 1.0] - Overides the default opacity for a cell, affecting only the stroke color. 
- `scale` [0.0 ... 10.0] - Scale of individual cells (as opposed to all cells, like setScale)

## More Examples

![Static transparent](/examples/screenshot_13.png?raw=true)
![Converging example](/examples/converge.gif?raw=true)
![Slime animated](/examples/slime.gif?raw=true)