/*
 *  This file is part of mana.js
 *
 *  Copyright 2013, Stefan Dombrowski
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License version 2 as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.
 *  If not, see <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>.
 */

"use strict";

function createPathSearch() {
	tmw.path = {
		findPath: findPath,
	};

	var MAX_WALKPATH = 48;
	var MAX_HEAP = 150;
	var heap = new Array(MAX_HEAP + 1);
	var tp;
	var movePath = [];

	function findPath(being, srcX, srcY, dstX, dstY) {
		being.movePixelPath.length = 0;
		movePath.length = 0;
		if (being.x) {
			srcX = being.xTile;
			srcY = being.yTile;
		} else {
			being.xTile = srcX;
			being.yTile = srcY;
			being.x = srcX * 32 + 16;
			being.y = srcY * 32 + 16;
		}
		being.xFloat = being.x;
		being.yFloat = being.y;
		var posX = srcX * 32 + 16;
		var posY = srcY * 32 + 16;
		if (srcX === dstX && srcY === dstY) {
			being.tileX = srcX;
			being.tileY = srcY;
			being.x = posX;
			being.y = posY;
			if (being.action !== "stand") {
				being.action = "stand";
				being.sprite = null;
			}
			return;
		}
		search(srcX, srcY, dstX, dstY);
		if (!movePath.length) {
			being.xTile = dstX;
			being.yTile = dstY;
			being.x = dstX * 32 + 16;
			being.y = dstY * 32 + 16;
			being.action = "stand";
			being.sprite = null;
			console.error("Path finding failed from ("+srcX+","+srcY+") to ("+dstX+","+dstY+")");
			return;
		}
		for (var i=0; i<movePath.length; i++) {
			switch (movePath[i]) {
				case 1: posY += 32; break;
				case 3: posX -= 32; posY += 32; break;
				case 2: posX -= 32; break;
				case 6: posX -= 32; posY -= 32; break;
				case 4: posY -= 32; break;
				case 12: posX += 32; posY -= 32; break;
				case 8: posX += 32; break;
				case 9: posX += 32; posY += 32; break;
				default: console.error("None existing direction: " + movePath[i]);
			}
			being.movePixelPath.push({dstX: posX, dstY: posY});
		}
		if (being.action !== "walk") {
			being.action = "walk";
			being.sprite = null;
		}
	}

	function calc_index(x,y) {
		return (x + y * MAX_WALKPATH) % (MAX_WALKPATH * MAX_WALKPATH);
	}

	function calc_cost(p, x1, y1) {
		return (Math.abs(x1 - p.x) + Math.abs(y1 - p.y)) * 10 + p.dist;
	}

	function push_heap_path(index) {
		heap[0]++;
		var current = heap[0];
		var parent = current >>> 1;
		while (parent > 0 && tp[index].cost < tp[heap[parent]].cost) {
			heap[current] = heap[parent];
			current = parent;
			parent = current >>> 1;
		}
		heap[current] = index;
	}

	function update_heap_path(index) {
		for (var current = 1; current < heap[0]; current++) {
			if (heap[current] === index)
				break;
		}
		var parent = current >>> 1;
		while (parent > 0 && tp[index].cost < tp[heap[parent]].cost) {
			heap[current] = heap[parent];
			current = parent;
			parent = current >>> 1;
		}
		heap[current] = index;
	}

	function pop_heap_path() {
		console.assert(heap[0] > 0);
		var ret = heap[1];
		heap[1] = heap[heap[0]];
		heap[0]--;
		var current = 1, left, right, min, temp;
		while (true) {
			left = 2 * current;
			right = 2 * current + 1;
			min = current;
			if (left <= heap[0] && tp[heap[left]].cost < tp[heap[current]].cost)
				min = left;
			if (right <= heap[0] && tp[heap[right]].cost < tp[heap[min]].cost)
				min = right;
			if (min === current)
				return ret;
			temp = heap[current];
			heap[current] = heap[min];
			heap[min] = temp;
			current = min;
		}
	}

	function add_path(x, y, dist, dir, before, x1, y1) {
		var i = calc_index(x, y);
		if (tp[i]) {
			console.assert(tp[i].x === x && tp[i].y === y);
			if (tp[i].dist > dist) {
				tp[i].dist = dist;
				tp[i].dir = dir;
				tp[i].before = before;
				tp[i].cost = calc_cost(tp[i], x1, y1);
				if (tp[i].visited)
					push_heap_path(i);
				else
					update_heap_path(i);
				tp[i].visited = false;
			}
			return;
		}
		tp[i] = {};
		tp[i].x = x;
		tp[i].y = y;
		tp[i].dist = dist;
		tp[i].dir = dir;
		tp[i].before = before;
		tp[i].cost = calc_cost(tp[i], x1, y1);
		tp[i].visited = false;
		push_heap_path(i);
	}

	function can_place(x, y) {
		return !tmw.map.collision[y * tmw.map.width + x];
	}

	function can_move(x0, y0, x1, y1) {
		if (x0 - x1 < -1 || x0 - x1 > 1 || y0 - y1 < -1 || y0 - y1 > 1)
			return false;
		if (x1 < 0 || y1 < 0 || x1 >= tmw.map.width || y1 >= tmw.map.height)
			return false;
		if (!can_place(x0, y0))
			return false;
		if (!can_place(x1, y1))
			return false;
		if (x0 === x1 || y0 === y1)
			return true;
		if (!can_place(x0, y1) || !can_place(x1, y0))
			return false;
		return true;
	}

	function search(x0, y0, x1, y1) {
		if (x1 < 0 || x1 >= tmw.map.width || y1 < 0 || y1 >= tmw.map.height)
			return;
		var dx = (x1 - x0 < 0) ? -1 : 1;
		var dy = (y1 - y0 < 0) ? -1 : 1;
		for (var x = x0, y = y0; x !== x1 || y !== y1;) {
			if (movePath.length >= MAX_WALKPATH) {
				movePath.length = 0;
				return;
			}
			if (x !== x1 && y !== y1) {
				if (!can_move(x, y, x + dx, y + dy))
					break;
				x += dx;
				y += dy;
				movePath.push(dx < 0 ? (dy > 0 ? 3 : 6) : (dy < 0 ? 12 : 9));
			} else if (x !== x1) {
				if (!can_move(x, y, x + dx, y))
					break;
				x += dx;
				movePath.push(dx < 0 ? 2 : 8);
			} else { // y!==y1
				if (!can_move(x, y, x, y + dy))
					break;
				y += dy;
				movePath.push(dy > 0 ? 1 : 4);
			}
			if (x === x1 && y === y1) {
				return;
			}
		}
		movePath.length = 0;
		heap[0] = 0;
		tp = new Array(MAX_WALKPATH * MAX_WALKPATH);
		i = calc_index(x0, y0);
		tp[i] = {};
		tp[i].x = x0;
		tp[i].y = y0;
		tp[i].dist = 0;
		tp[i].dir = 0;
		tp[i].before = 0;
		tp[i].cost = calc_cost(tp[i], x1, y1);
		tp[i].visited = false;
		push_heap_path(calc_index(x0, y0));
		while (true) {
			if (heap[0] === 0) {
				console.error("heap[0] === 0");
				movePath.length = 0;
				return;
			}
			var rp = pop_heap_path();
			x = tp[rp].x;
			y = tp[rp].y;
			if (x === x1 && y === y1) {
				for (var len = 0, i = rp; len < 100 && i !== calc_index(x0, y0);
					 i = tp[i].before, len++);
				if (len >= MAX_WALKPATH) {
					console.error("len >= MAX_WALKPATH");
					movePath.length = 0;
					return;
				}
				for (var i = rp, j = len - 1; j >= 0; i = tp[i].before, j--)
					movePath.unshift(tp[i].dir);
				return;
			}
			if (can_move(x, y, x + 1, y - 1))
				add_path(x + 1, y - 1, tp[rp].dist + 14, 12, rp, x1, y1);
			if (can_move(x, y, x + 1, y))
				add_path(x + 1, y, tp[rp].dist + 10, 8, rp, x1, y1);
			if (can_move(x, y, x + 1, y + 1))
				add_path(x + 1, y + 1, tp[rp].dist + 14, 9, rp, x1, y1);
			if (can_move(x, y, x, y + 1))
				add_path(x, y + 1, tp[rp].dist + 10, 1, rp, x1, y1);
			if (can_move(x, y, x - 1, y + 1))
				add_path(x - 1, y + 1, tp[rp].dist + 14, 3, rp, x1, y1);
			if (can_move(x, y, x - 1, y))
				add_path(x - 1, y, tp[rp].dist + 10, 2, rp, x1, y1);
			if (can_move(x, y, x - 1, y - 1))
				add_path(x - 1, y - 1, tp[rp].dist + 14, 6, rp, x1, y1);
			if (can_move(x, y, x, y - 1))
				add_path(x, y - 1, tp[rp].dist + 10, 4, rp, x1, y1);
			tp[rp].visited = true;
			if (heap[0] >= MAX_HEAP - 5) {
				console.error("heap[0] >= MAX_HEAP - 5");
				movePath.length = 0;
				return;
			}
		}
	}
}
