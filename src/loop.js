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

function createLoop() {
	var requestAnimationId;
	var checkFps = 0;
	var countFps = 0;
	var game;
	var scrollX;
	var scrollY;

	tmw.loop = {
		start: function () {
			if (requestAnimationId) {
				console.error("loop started a second time");
				return;
			}
			requestAnimationId = window.requestAnimationFrame(run);
			game = $("#game");
		},
		stop: function () {
			if (requestAnimationId)
				window.cancelAnimationFrame(requestAnimationId);
			requestAnimationId = null;
		},
	};

	function run(timeAnimation) {
		requestAnimationId = window.requestAnimationFrame(run);
		var deltaTime = timeAnimation - tmw.timeAnimation;
		tmw.timeAnimation = timeAnimation;

		// localplayer actions
		if (tmw.localplayer.action !== "dead" && !tmw.gui.npc.isOpen()) {
			if (!tmw.localplayer.movePixelPath.length) {
				processMovementInput();
				if (tmw.localplayer.movePixelPath.length) {
					tmw.localplayer.action = "walk";
					tmw.localplayer.sprite = null;
				}
			}
			if (tmw.localplayer.movePixelPath.length) {
				var pixelsMoved = tmw.localplayer.moveSpeed * deltaTime;
				move(tmw.localplayer, pixelsMoved);
				if (!tmw.localplayer.movePixelPath.length) {
					processMovementInput();
					if (!tmw.localplayer.movePixelPath.length) {
						tmw.localplayer.action = "stand";
						tmw.localplayer.sprite = null;
					}
				}
			} else if (tmw.input.getAttackKey()) {
				if (!tmw.selectedBeing.get())
					tmw.selectedBeing.select("MONSTER");
				var selected = tmw.selectedBeing.get();
				if (selected && selected.type !== "NPC") {
					if (tmw.net.packetLimiter("CMSG_PLAYER_ATTACK")) {
						if (tmw.localplayer.action.indexOf("attack") !== 0) {
							var slot = equipmentType2Index("weapon");
							tmw.localplayer.action =
								tmw.localplayer.equipment[slot] ?
								tmw.localplayer.equipment[slot]["attack-action"]:
								"attack";
							tmw.localplayer.sprite = null;
						}
						var msg = newOutgoingMessage("CMSG_PLAYER_ATTACK");
						msg.write32(selected.id);
						msg.write8(0);
						msg.send();
						var dx = Math.abs(selected.xTile - tmw.localplayer.xTile);
						var dy = Math.abs(selected.yTile - tmw.localplayer.yTile);
						if (dy && dy >= dx)
							var dir = (selected.y - tmw.localplayer.y) > 0 ? 1 : 4;
						else if (dx)
							dir = (selected.x - tmw.localplayer.x) > 0 ? 8 : 2;
						if (dx || dy)
							playerChangeDirection(dir);
					}
				}
			}
			if (tmw.pickUpQueue.length)
				itemPickUp();
		}

		// being movement
		for (var i in tmw.beings) {
			var being = tmw.beings[i];
			if (!being.movePixelPath.length) continue;
			var pixelsMoved = being.moveSpeed * deltaTime;
			move(being, pixelsMoved);
			if (!being.movePixelPath.length) {
				being.action = "stand";
				being.sprite = null;
			}
		}

		// fps
		if (tmw.config.showFps) {
			countFps++;
			if (timeAnimation >= checkFps) {
				$("#fps").html("fps: " + countFps);
				countFps = 0;
				checkFps = timeAnimation + 1000;
			}
		}

		var context = tmw.context;
		context.clearRect(0, 0, game.width(), game.height());
		scrollX = tmw.localplayer.x - Math.floor(game.width() / 2);
		scrollY = tmw.localplayer.y - Math.floor(game.height() / 2);
		var startX = Math.max(0, Math.floor(scrollX / 32));
		var startY = Math.max(0, Math.floor(scrollY / 32));
		var endX = Math.min(tmw.map.width, Math.ceil((game.width() + scrollX) / 32));
		var endY = Math.min(tmw.map.height, 2 + Math.ceil((game.height() + scrollY) / 32));

		// tiles
		var isFringe, left, top, src, yPixel, startIndex, index;
		for (var l = 0; l < tmw.map.layers.length; l++) {
			if (tmw.map.layers[l].name === "Collision" && !tmw.config.debugCollision)
				continue;
			isFringe = tmw.map.layers[l].name === "Fringe";
			yPixel = (startY + 1) * 32 - scrollY;
			startIndex = startY * tmw.map.width + startX;
			for (var y = startY; y < endY; y++) {
				index = startIndex;
				left = startX * 32 - scrollX;
				for (var x = startX; x < endX; x++) {
					src = tmw.map.tiles[tmw.map.layers[l].data[index++]];
					if (src) {
						top = yPixel - src.height;
						context.drawImage(src, left, top);
					}
					left += 32;
				}
				if (isFringe) {
					for (var i in tmw.beings) {
						var being = tmw.beings[i];
						if (y !== being.yTile) continue;
						if (being.isSelected)
							tmw.selectedBeing.draw(scrollX, scrollY, timeAnimation);
						drawSprites(being, scrollX, scrollY, timeAnimation);
					}
					if (y === tmw.localplayer.yTile)
						drawSprites(tmw.localplayer, scrollX, scrollY, timeAnimation);
				}
				yPixel += 32;
				startIndex += tmw.map.width;
			}
		}

		if (tmw.config.debugRaster) {
			context.strokeStyle = "Black";
			context.beginPath();
			for (var x = startX; x < endX; x++) {
				for (var y = startY; y < endY; y++) {
					left = x * 32 - scrollX;
					top = y * 32 - scrollY;
					context.rect(left, top, 32, 32);
				}
			}
			context.stroke();
		}

		context.font = "9pt sans-serif";
		context.textAlign = "center";
		context.textBaseline = "bottom";

		for (var i in tmw.beings) {
			drawName(tmw.beings[i]);
		}
		drawName(tmw.localplayer);
		for (var i in tmw.floorItems) {
			var floor = tmw.floorItems[i]
			var item = tmw.itemDB[floor.itemId];
			left = floor.x - scrollX;
			top = floor.y - scrollY;
			context.drawImage(item.image, left, top);
		}
		for (var i in tmw.beings) {
			being = tmw.beings[i];
			if (being.emoteImage)
				drawEmote(being);
		}
		if (tmw.localplayer.emoteImage)
			drawEmote(tmw.localplayer);
		drawParticleText();
		for (var i in tmw.beings) {
			being = tmw.beings[i];
			if (being.speechText)
				drawSpeech(being);
		}
		if (tmw.localplayer.speechText)
			drawSpeech(tmw.localplayer);
	}

	function move(being, pixelsMoved) {
		for (var doLoop=true; doLoop;) {
			doLoop = false;
			var doShift = true;
			var dstX = being.movePixelPath[0].dstX;
			var dstY = being.movePixelPath[0].dstY;
			var dx = dstX - being.xFloat;
			var dy = dstY - being.yFloat;
			console.assert(dx || dy);
			var dir =
				dy > 0 ? 1 :
				dy < 0 ? 4 :
				dx > 0 ? 8 : 2;
			if (being.direction !== dir) {
				being.direction = dir;
				being.sprite = null;
			}
			var remainderX = 0;
			if (dx) {
				remainderX = Math.abs(dx) - pixelsMoved;
				if (remainderX > 0.01) {
					being.xFloat += dx < 0 ? -pixelsMoved : pixelsMoved;
					doShift = false;
				} else if (remainderX < -0.01) {
					being.xFloat = dstX;
					doLoop = true;
				} else {
					being.xFloat = dstX;
				}
			}
			var remainderY = 0;
			if (dy) {
				remainderY = Math.abs(dy) - pixelsMoved;
				if (remainderY > 0.01) {
					being.yFloat += dy < 0 ? -pixelsMoved : pixelsMoved;
					doShift = false;
				} else if (remainderY < -0.01) {
					being.yFloat = dstY;
					doLoop = true;
				} else {
					being.yFloat = dstY;
				}
			}
			if (doShift) {
				being.movePixelPath.shift();
				if (!being.movePixelPath.length)
					doLoop = false;
			}
			if (doLoop) {
				pixelsMoved = -Math.min(remainderX, remainderY);
				console.assert(pixelsMoved > 0);
			}
		}
		being.x = Math.round(being.xFloat);
		being.y = Math.round(being.yFloat);
		being.xTile = Math.floor(being.x / 32);
		being.yTile = Math.floor(being.y / 32);
	}

	function drawEmote(being) {
		if (tmw.timeAnimation > being.emoteTimeout) {
			being.emoteImage = null;
			being.emoteTimeout = null;
			return;
		}
		var left = being.x - 16 - scrollX;
		var top = being.y - 16 - scrollY - 64;
		tmw.context.drawImage(being.emoteImage, left, top);
	}

	function drawSpeech(being) {
		if (tmw.timeAnimation > being.speechTimeout) {
			being.speechText = null;
			return;
		}
		var left = being.x - scrollX;
		var top = being.y - 46 - scrollY;
		var halfWidth = 6 +
			Math.floor(tmw.context.measureText(being.speechText).width / 2);
		tmw.context.fillStyle = "rgba(0, 0, 0, 0.6)";
		tmw.context.beginPath();
		tmw.context.moveTo(left, top - 17);
		tmw.context.arcTo(left + halfWidth, top - 17, left + halfWidth, top + 3, 5);
		tmw.context.arcTo(left + halfWidth, top + 3, left - halfWidth, top + 3, 5);
		tmw.context.arcTo(left - halfWidth, top + 3, left - halfWidth, top - 17, 5);
		tmw.context.arcTo(left - halfWidth, top - 17, left + halfWidth, top - 17, 5);
		tmw.context.closePath();
		tmw.context.fill();
		tmw.context.fillStyle = "white";
		tmw.context.fillText(being.speechText, left, top);
	}

	function drawName(being) {
		var name = null;
		if (being.isSelected && being.type === "MONSTER") {
			name = tmw.monsterDB[being.job].name;
			if (being.damageTaken)
				name += ", " + being.damageTaken;
		} else {
			name = being.nameInsecure;
		}
		if (!name) return;
		var x = being.x - scrollX;
		var y = being.y - scrollY + 26;
		tmw.context.fillStyle = being.nameOutline;
		tmw.context.fillText(name, x-1, y);
		tmw.context.fillText(name, x+1, y);
		tmw.context.fillText(name, x, y-1);
		tmw.context.fillText(name, x, y+1);
		tmw.context.fillStyle = being.nameColor;
		tmw.context.fillText(name, x, y);
	}

	function drawParticleText() {
		for (var i in tmw.textParticle) {
			if (tmw.textParticle[i].timeout < tmw.timeAnimation)
				tmw.textParticle.shift();
			else
				break;
		}
		for (var i in tmw.textParticle) {
			var p = tmw.textParticle[i];
			if (!p.being) return;
			var left = p.being.x - scrollX;
			var top = p.being.y - scrollY - 76 +
				Math.round((p.timeout - tmw.timeAnimation) / 100);
			tmw.context.fillStyle = p.outline;
			tmw.context.fillText(p.text, left-1, top);
			tmw.context.fillText(p.text, left+1, top);
			tmw.context.fillText(p.text, left, top-1);
			tmw.context.fillText(p.text, left, top+1);
			tmw.context.fillStyle = p.color;
			tmw.context.fillText(p.text, left, top);
		}
	}
}
