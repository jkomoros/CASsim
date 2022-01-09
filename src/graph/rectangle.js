import {
	PositionedGraph
} from './positioned.js';

export class RectangleGraph extends PositionedGraph {

	static identifier(row, col) {
		return [row, col];
	}

	static rowColFromIdentifier(identifier) {
		return identifier;
	}

	/*

		By default creates a graph with the given number of rows and cols,
		where each cell is connected to the cells directly above, below, and
		to the left and right of it (but not diagonal).

		options is a dict that may have the following keys
		starterValue - the values to clone and set for each cell
		nodeMargin - the margin to have between nodes. It is in units of
		percentage of nodeWidth. If you want a different value for x and y,
		you can set an array with [xMargin, yMargin]
		nodeBorderRadius - a value from 0.0 to 1.0 for size of radius

		The follow keys are boolean and may be set to true on options:
		rectangular - Allow nodes to have a width and height that differs
		noLeft - Don't connect directly to the left
		noRight - Don't connect directly to the right
		noUp - Don't connect directly up
		noDown - Don't connect directly down
		noHorizontal - Equivalent to noLeft, noRight
		noVertical - Equivalent to noUp, noDown
		noRightAngle - Equivalent to noHorizontal, noVertical
		diagonalUpLeft - Also connect diagonal up and left
		diagonalDownLeft - Also connect diagonals down and left
		diagonalUpRight - Also connect diagonals up and right
		diagonalDownRight - Also connect diagonals down and right
		diagonalRight - equivalent to diagonalUpRight, diagonalDownRight
		diagonalLeft - equilvalent to diagonalUpLeft, diagonalDownLeft
		diagonalUp - equivalent to diagonalUpLeft, diagonalUpRight
		diagonalDown - equivalent to diagonalDownLeft, diagonalDownRight
		diagonal - equivalent to diagonalUp, diagonalDown
	*/
	static make(rows, cols, availableWidth, availableHeight, options = {}) {
		if (typeof rows != 'number' || rows < 1.0) throw new Error('Rows must be a positive integer');
		if (typeof cols != 'number' || cols < 1.0) throw new Error('Cols must be a positive integer');

		const nodeMargin = options.nodeMargin || 0;
		const starterValues = options.starterValues || {};
		const nodeBorderRadius = options.nodeBorderRadius || 0;

		if (typeof nodeBorderRadius != 'number') throw new Error('nodeRadius must be a number');
		if (nodeBorderRadius > 1.0 || nodeBorderRadius < 0.0) throw new Error('nodeRadius must be between 0.0 and 1.0');

		if (Array.isArray(nodeMargin)) {
			if (nodeMargin.length != 2) throw new Error('If nodeMargin is an array it must be two items long');
		}

		(Array.isArray(nodeMargin) ? nodeMargin : [nodeMargin]).forEach(margin => {
			if (typeof margin != 'number') throw new Error('nodeMargin must be a number');
			if (margin < 0.0) throw new Error('nodeMargin must be positive');
		});

		const result = new RectangleGraph();
		result.availableHeight = availableHeight;
		result.availableWidth = availableWidth;
		result.nodeMargin = nodeMargin;
		result.nodeBorderRadius = nodeBorderRadius;
		if (options.rectangular) result.rectangular = true;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const values = {...starterValues, row: r, col: c};
				const identifier = RectangleGraph.identifier(r, c);
				result.setNode(identifier, values);
				if (!options.noUp && !options.noVertical && !options.noRightAngle) {
					if (r > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c), {distance: 1.0, type: 'up'});
				}
				if (!options.noLeft && !options.noHorizontal && !options.noRightAngle) {
					if (c > 0) result.setEdge(identifier, RectangleGraph.identifier(r, c - 1), {distance: 1.0, type: 'left'});
				}
				if (!options.noDown && !options.noVertical && !options.noRightAngle) {
					if (r < rows - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c), {distance: 1.0, type: 'down'});
				}
				if (!options.noRight && !options.noHorizontal && !options.noRightAngle) {
					if (c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r, c + 1), {distance: 1.0, type: 'cols'});
				}
				if (options.diagonalUpLeft || options.diagonalUp || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c - 1), {distance: Math.sqrt(2), type: 'diagonalUpLeft'});
				}
				if (options.diagonalDownLeft || options.diagonalDown || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalDownLeft'});
				}
				if (options.diagonalUpRight || options.diagonalUp || options.diagonalRight || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalUpRight'});
				}
				if (options.diagonalDownRight || options.diagonalDown || options.diagonalRight || options.diagonal) {
					if (r < rows - 1 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalDownRight'});
				}
				//TODO set wraps too if desired
			}
		}
		result.bakeLayout();
		return result;
	}

	get nodeMargin() {
		return this.property('nodeMargin');
	}

	set nodeMargin(val) {
		this.setProperty('nodeMargin', val);
	}

	//By default, the nodes are square, but if this is true they will be rectangular.
	get rectangular() {
		return this.property('rectangular');
	}

	set rectangular(val) {
		this.setProperty('rectangular', val);
	}

	get xNodeMargin() {
		const margin = this.nodeMargin;
		if (Array.isArray(margin)) return margin[0];
		return margin;
	}

	get yNodeMargin() {
		const margin = this.nodeMargin;
		if (Array.isArray(margin)) return margin[1];
		return margin;
	}

	get rows() {
		return this.lastNodeIdentifier()[0] + 1;
	}

	get cols() {
		return this.lastNodeIdentifier()[1] + 1;
	}

	get width() {
		return ((this.nodeWidth * (1.0 + this.xNodeMargin) * this.cols) - this.xNodeMargin);
	}

	get height() {
		return ((this.nodeHeight * (1.0 + this.yNodeMargin) * this.rows) - this.yNodeMargin);
	}

	get _nodeHeight() {
		if(this._cachedNodeHeight === undefined) {
			this._cachedNodeHeight = this.availableHeight / (this.rows * (1.0 + this.yNodeMargin) - this.yNodeMargin);
		}
		return this._cachedNodeHeight;
	}

	get nodeHeight() {
		return this.rectangular ? this._nodeHeight : this._nodeSize;
	}

	get _nodeWidth() {
		if(this._cachedNodeWidth === undefined) {
			this._cachedNodeWidth = this.availableWidth / (this.cols * (1.0 + this.xNodeMargin) - this.xNodeMargin);
		}
		return this._cachedNodeWidth;
	}

	get nodeWidth() {
		return this.rectangular ? this._nodeWidth : this._nodeSize;
	}

	get _nodeSize() {
		if(this._cachedNodeSize === undefined) {
			this._cachedNodeSize = Math.min(this._nodeHeight, this._nodeWidth);
		}
		return this._cachedNodeSize;
	}

	//We return width and height directly.
	calculateNodePosition(identifier) {
		const node = this.node(identifier);
		const nodeWidth = this.nodeWidth;
		const nodeHeight = this.nodeHeight;
		return {
			x: (node.col * (nodeWidth * (1.0 + this.xNodeMargin))) + (nodeWidth / 2),
			y: (node.row * (nodeHeight * (1.0 + this.yNodeMargin))) + (nodeHeight / 2),
			width: nodeWidth,
			height: nodeHeight,
		};
	}

}

RectangleGraph.registerGraphType(RectangleGraph);