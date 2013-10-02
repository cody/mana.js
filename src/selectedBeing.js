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

function createSelectedBeing() {
	tmw.selectedBeing = {
		get: function () { return being; },
		select: select,
		clear: clear,
		draw: draw,
	};

	var being = null;
	var size;
	var frameIndex = 0;
	var nextFrame = 0;
	var cursors = {
		small:  {inRange: [], outOfRange: []},
		medium: {inRange: [], outOfRange: []},
		large:  {inRange: [], outOfRange: []}
	};

	loadCursor("../graphics/target-cursor-in-range-s.png", "small", "inRange");
	loadCursor("../graphics/target-cursor-in-range-m.png", "medium", "inRange");
	loadCursor("../graphics/target-cursor-in-range-l.png", "large", "inRange");
	loadCursor("../graphics/target-cursor-normal-s.png", "small", "outOfRange");
	loadCursor("../graphics/target-cursor-normal-m.png", "medium", "outOfRange");
	loadCursor("../graphics/target-cursor-normal-l.png", "large", "outOfRange");

	function loadCursor(src, size, range) {
		var img = new Image();
		img.src = src;
		img.onload = function () {
			var frames = cursors[size][range];
			cursors[size].width = this.width / 4;
			cursors[size].height = this.height / 2;
			for (var i=0; i<4; i++) {
				var canvas = document.createElement("canvas");
				canvas.width = this.width / 4;
				canvas.height = this.height / 2;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(this, i * canvas.width, 0,
					canvas.width, canvas.height, 0, 0 , canvas.width, canvas.height);
				frames.push({canvas: canvas, delay: 300,
					offsetY: (size==="small" ? 0 : 10)});
			}
		};
	}

	function select(type) {
		var chosen = null;
		if (!being || being.type !== type) { // find nearest
			var dist = Infinity;
			var dx, dy;
			for (var i in tmw.beings) {
				if (tmw.beings[i].type !== type) continue;
				if (tmw.beings[i].action === "dead" && type === "MONSTER") continue;
				dx = tmw.localplayer.x - tmw.beings[i].x;
				dy = tmw.localplayer.y - tmw.beings[i].y;
				if (dist < dx * dx + dy * dy) continue;
				dist = dx * dx + dy * dy;
				chosen = tmw.beings[i];
			}
		} else { // find next
			var possibilities = [];
			for (var i in tmw.beings)
				if (tmw.beings[i].type === type) possibilities.push(i);
			if (possibilities.length < 2)
				return;
			var index = possibilities.indexOf(being.id.toString());
			index = (index + 1) % possibilities.length;
			chosen = tmw.beings[possibilities[index]];
		}
		if (being) being.isSelected = false;
		being = chosen;
		if (being) {
			being.isSelected = true;
			if (being.type === "MONSTER" && tmw.monsterDB[being.job].targetCursor)
				size = tmw.monsterDB[being.job].targetCursor;
			else
				size = "medium";
		}
	}

	function clear() {
		if (!being) return;
		being.isSelected = false;
		being = null;
	}

	function draw(scrollX, scrollY, timeAnimation) {
		var range;
		if (being.type === "NPC") {
			range = "inRange";
		} else {
			var dx = Math.abs(Math.floor(tmw.localplayer.x / 32) -
				Math.floor(being.x / 32));
			var dy = Math.abs(Math.floor(tmw.localplayer.y / 32) -
				Math.floor(being.y / 32));
			if (Math.max(dx, dy) <= tmw.localplayer.attackRange)
				range = "inRange";
			else
				range = "outOfRange";
		}
		if (nextFrame < timeAnimation) {
			frameIndex = (frameIndex + 1) % 4;
			nextFrame = timeAnimation + 300;
		}
		var frame = cursors[size][range][frameIndex];
		var left = being.x - scrollX - cursors[size].width / 2;
		var top = being.y - scrollY - cursors[size].height + 16;
		tmw.context.drawImage(frame.canvas, left, top + frame.offsetY);
	}
}
