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
			if (requestAnimationId) window.cancelAnimationFrame(requestAnimationId);
			requestAnimationId = null;
		},
	};

	function run(timeAnimation) {
		requestAnimationId = window.requestAnimationFrame(run);
		var deltaTime = timeAnimation - tmw.timeAnimation;
		tmw.timeAnimation = timeAnimation;
		processMovementInput();

		if (!tmw.map.width) return;

		if (tmw.input.getAttackKey()) {
			if (!tmw.selectedBeing.get())
				tmw.selectedBeing.select("MONSTER");
			var selected = tmw.selectedBeing.get();
			if (selected && selected.type !== "NPC") {
				if (tmw.net.packetLimiter("CMSG_PLAYER_ATTACK")) {
					tmw.localplayer.action = "attack";
					var msg = newOutgoingMessage("CMSG_PLAYER_ATTACK");
					msg.write32(selected.id);
					msg.write8(0);
					msg.send();
				}
			}
		}

		if (tmw.config.showFps) {
			countFps++;
			if (timeAnimation >= checkFps) {
				$("#fps").html("fps: " + countFps);
				countFps = 0;
				checkFps = timeAnimation + 1000;
			}
		}

		var context = tmw.context;
		var midX = Math.floor(game.width() / 2);
		var midY = Math.floor(game.height() / 2);
		context.clearRect(0, 0, game.width(), game.height());

		var scrollX = tmw.localplayer.x - midX;
		var scrollY = tmw.localplayer.y - midY;
		var startX = Math.max(0, Math.floor(scrollX / 32));
		var startY = Math.max(0, Math.floor(scrollY / 32));
		var endX = Math.min(tmw.map.width, Math.ceil(game.width() + scrollX / 32));
		var endY = Math.min(tmw.map.height, Math.ceil((game.height() + scrollY) / 32));

		// tiles
		var left;
		var top;
		var src;
		for (var l = 0; l < tmw.map.layers.length; l++) {
			if (tmw.map.layers[l].name === "Collision" && !tmw.config.debugCollision)
				continue;
			for (var y = startY; y < endY; y++) { // Todo: use pixel for x and y
				for (var x = startX; x < endX; x++) {
					src = tmw.map.tiles[tmw.map.layers[l].data[y*tmw.map.width+x]];
					if (!src) continue;
					left = x * 32 - scrollX;
					top = y * 32 - scrollY - src.height + 32;
					context.drawImage(src, left, top);
				}
			}
		}

		if (tmw.config.debugRaster) {
			context.strokeStyle = "Black";
			context.beginPath();
			for (var x = startX; x < endX; x++) { // Todo: use pixel for x and y
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
			var being = tmw.beings[i];

			// move
			if (being.movePixelPath.length) {
				var pixelsMoved = (32 / being.moveSpeed) * deltaTime;
				while (true) {
					var cur = being.movePixelPath[0];
					being.direction =
						cur.signY === 1 ? 1 :
						cur.signY === -1 ? 4 :
						cur.signX === 1 ? 8 : 2;
					var rest = cur.distance - pixelsMoved;
					if (rest === 0) {
						being.xFloat += cur.signX * pixelsMoved;
						being.yFloat += cur.signY * pixelsMoved;
						being.movePixelPath.shift();
						break;
					} else if (rest > 0) {
						being.xFloat += cur.signX * pixelsMoved;
						being.yFloat += cur.signY * pixelsMoved;
						being.movePixelPath[0].distance -= pixelsMoved;
						break;
					} else { // rest < 0
						being.xFloat += cur.signX * cur.distance;
						being.yFloat += cur.signY * cur.distance;
						pixelsMoved -= cur.distance;
						being.movePixelPath.shift();
						if (!being.movePixelPath.length)
							break;
					}
				}
				being.x = Math.floor(being.xFloat);
				being.y = Math.floor(being.yFloat);
				if (!being.movePixelPath.length)
					being.action = "stand";
			}

			if (being.isSelected)
				tmw.selectedBeing.draw(scrollX, scrollY, timeAnimation);
			drawSprites(being, scrollX, scrollY, timeAnimation);
			var text = null;
			switch (being.type) {
				case "PLAYER":
					context.fillStyle = being.gmStatus ? "red" : "white";
					text = being.nameInsecure;
					break;
				case "NPC":
					context.fillStyle = "blue";
					text = being.name;
					break;
				case "MONSTER":
					if (being.isSelected) {
						context.fillStyle = "black";
						text = tmw.monsterDB[being.job].name;
						if (being.damageTaken)
							text += ", " + being.damageTaken;
					}
					break;
				default: console.error("Being type not handled: " + being.type);
			}
			if (text) context.fillText(text, being.x-scrollX, being.y+26-scrollY);
			if (being.emoteImage) drawEmote(being, scrollX, scrollY);
			if (being.speechText) drawSpeech(being, scrollX, scrollY);
		}
		drawSprites(tmw.localplayer, scrollX, scrollY, timeAnimation);
		context.fillStyle = "LightSkyBlue";
		context.fillText(tmw.localplayer.name, tmw.localplayer.x - scrollX,
			tmw.localplayer.y + 26 - scrollY);
		if (tmw.localplayer.emoteImage) drawEmote(tmw.localplayer, scrollX, scrollY);
		if (tmw.localplayer.speechText) drawSpeech(tmw.localplayer, scrollX, scrollY);

		for (var i in tmw.floorItems) {
			var floor = tmw.floorItems[i]
			var item = tmw.itemDB[floor.itemId];
			if (item.image) {
				left = floor.x - scrollX;
				top = floor.y - scrollY;
				context.drawImage(item.image, left, top);
			} else if (item.image === undefined) {
				loadItemImage(item);
				item.image = null;
			}
		}

		drawParticleText(scrollX, scrollY);
	}

	function drawEmote(being, scrollX, scrollY) {
		if (tmw.timeAnimation > being.emoteTimeout) {
			being.emoteImage = null;
			being.emoteTimeout = null;
			return;
		}
		var left = being.x - 16 - scrollX;
		var top = being.y - 16 - scrollY - 64;
		tmw.context.drawImage(being.emoteImage, left, top);
	}

	function drawSpeech(being, scrollX, scrollY) {
		if (tmw.timeAnimation > being.speechTimeout) {
			being.speechText = null;
			being.speechTimeout = null;
			return;
		}
		var left = being.x - scrollX;
		var top = being.y - 46 - scrollY;
		tmw.context.fillStyle = "white";
		tmw.context.fillText(being.speechText, left, top);
	}

	function drawParticleText(scrollX, scrollY) {
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
			var top = p.being.y - scrollY - 76 + (p.timeout - tmw.timeAnimation) / 100;
			tmw.context.fillStyle = p.color;
			tmw.context.fillText(p.text, left, top);
		}
	}
}
