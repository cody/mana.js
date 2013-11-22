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

function loadXml(name, callback) {
	var xhr;
	if (tmw.repository) {
		xhr = {}; // mock xhr
		tmw.repository.getFile(name, {},
			function (fileEntry) {
				fileEntry.file(
					function (file) {
						var reader = new FileReader();
						reader.readAsText(file);
						reader.onload = function (event) {
							var parser = new window.DOMParser();
							var xml = parser.parseFromString(this.result, "text/xml");
							xhr.responseXML = xml;
							callback.call(xhr);
						};
					},
					function () { console.error("Error reading " + name); })
			},
			function () { loadResourceError(name) }
		);
	} else {
		var uint8array = tmw.zipdata[tmw.data[name]].decompress(name);
		var blob = new Blob([uint8array], {"type" : "text/xml"});
		var url = URL.createObjectURL(blob);
		xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.send(null);
		xhr.onload = callback;
	}
	return xhr;
}

function loadPng(name, callback) {
	var png = document.createElement("img");
	if (tmw.repository) {
		tmw.repository.getFile(name, {},
			function (fileEntry) {
				fileEntry.file(
					function (file) {
						var reader = new FileReader();
						reader.readAsDataURL(file);
						reader.onload = function (event) {
							png.src = this.result;
							png.onload = callback;
						};
					},
					function () { console.error("Error reading " + name); })
			},
			function () { loadResourceError(name) }
		);
	} else {
		var uint8array = tmw.zipdata[tmw.data[name]].decompress(name);
		var blob = new Blob([uint8array], {"type" : "image/png"});
		png.src = URL.createObjectURL(blob);
		png.onload = callback;
	}
	return png;
}

function loadResourceError(filename) {
	console.error("Error loading file: " + filename);
	$("<div>")
		.html("Can't find file " + filename)
		.attr("title", "Client Data Error")
		.dialog({
			dialogClass: "no-close",
			buttons: {
				Ignore: function () { $(this).dialog("close"); },
				Quit: function () { tmw.state.set("STATE_START"); }
			}
		});
}
function dye(canvas, color) {
	var R, G, B, A;
	var ctx = canvas.getContext("2d");
	var channels = colorToChannels(color);
	if (!channels)
		return;
	var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (var i=0; i<canvas.width*canvas.height*4; i+=4) {
		R = pixels.data[i];
		G = pixels.data[i+1];
		B = pixels.data[i+2];
		A = pixels.data[i+3];
		if (!A)
			continue;
		var paletteIndex = (R ? 1 : 0) + (G ? 2 : 0) + (B ? 4 : 0);
		var intensity = 0;
		var channel;
		switch (paletteIndex) {
			case 1: channel = "R"; intensity = R; break;
			case 2: channel = "G"; intensity = G; break;
			case 3: channel = "Y"; intensity = R === G ? R : 0; break;
			case 4: channel = "B"; intensity = B; break;
			case 5: channel = "M"; intensity = R === B ? R : 0; break;
			case 6: channel = "C"; intensity = G === B ? G : 0; break;
			case 7: channel = "W"; intensity = R === G && G === B ? R : 0; break;
		}
		var chan = channels[channel];
		if (!channel || !intensity || !chan)
			continue;
		var s = Math.floor(intensity * chan.length / 255);
		var t = intensity * chan.length % 255;
		var j = t === 0 ? s - 1 : s;
		var c2 = chan[j];
		var r2 = c2.R,
			g2 = c2.G,
			b2 = c2.B;
		if (t === 0) {
			R = r2;
			G = g2;
			B = b2;
		} else {
			var r1 = 0, g1 = 0, b1 = 0;
			if (s > 0) {
				var c1 = chan[s-1];
				r1 = c1.R;
				g1 = c1.G;
				b1 = c1.B;
			}
			R = Math.floor(((255 - t) * r1 + t * r2) / 255);
			G = Math.floor(((255 - t) * g1 + t * g2) / 255);
			B = Math.floor(((255 - t) * b1 + t * b2) / 255);
		}
		pixels.data[i] = R;
		pixels.data[i+1] = G;
		pixels.data[i+2] = B;
	}
	ctx.putImageData(pixels, 0, 0);
}

function colorToChannels(color) {
	var channels = {}; // Palette -> [int]
	var color0 = color[0].split(";");
	var color1;
	if (color[1]) color1 = color[1].split(";");
	var R, G, B, letter, text, numberText;
	for (var s in color0) {
		text = color0[s];
		if (!text) break; // Cave Maggot
		if (color0[s].charAt(1) === ":") {
			letter = color0[s].charAt(0);
			text = text.slice(3);
		} else {
			if (!color1) return null; // Warlord Boots
			letter = color1[s].charAt(0);
			text = text.slice(1);
		}
		channels[letter] = [];
		numberText = text.split(",");
		for (var n in numberText) {
			var num = parseInt(numberText[n], 16);
			R = (num >>> 16) & 0xff;
			G = (num >>> 8) & 0xff;
			B = num & 0xff;
			channels[letter].push({R: R, G: G, B: B});
		}
	}
	return channels;
}

function drawSprites(being, scrollX, scrollY, timeAnimation) {
	var frame, dir, left, top;
	var frames = being.template.frames;
	if (!frames) return;
	if (!being.sprite) {
		if (!frames[being.action]) being.action = "stand";
		if (!frames[being.action][being.direction])
			being.direction = Object.keys(frames[being.action])[0];
		being.sprite = frames[being.action][being.direction];
		frame = being.sprite[0];
		being.spriteIndex = 0;
		if (frame.delay)
			being.spriteTimer = frame.delay + timeAnimation;
		else if (being.action === "dead")
			being.spriteTimer = 3000 + timeAnimation;
		else
			being.spriteTimer = 0;
	} else if (being.spriteTimer && being.spriteTimer <= timeAnimation) {
		being.spriteIndex += 1;
		if (being.spriteIndex >= being.sprite.length) {
			if (being.type === "MONSTER" && being.action === "dead") {
				delete tmw.beings[being.id];
				return;
			}
			if (being.action.indexOf("attack") === 0) {
				console.assert(!being.movePixelPath.length);
				being.action = "stand";
				if (!frames[being.action]) being.action = "stand";
				if (!frames[being.action][being.direction]) being.direction = 1;
				being.sprite = frames[being.action][being.direction];
			}
			being.spriteIndex = 0;
		}
		frame = being.sprite[being.spriteIndex];
		being.spriteTimer = frame.delay + timeAnimation;
	} else {
		frame = being.sprite[being.spriteIndex];
	}
	left = being.x - scrollX - Math.floor(frames.width / 2);
	top = being.y - scrollY - frames.height + 16;
	tmw.context.drawImage(frame.canvas, left + frame.offsetX, top + frame.offsetY);
	if (being.type === "PLAYER") {
		var visibleEquipment = ["misc2", "shoes", "gloves", "bottomClothes",
			"topClothes", "hair", "hat", "weapon"];
		for (var slot in visibleEquipment) {
			var equip = being.equipment[visibleEquipment[slot]];
			if (!equip) continue;
			if (equip.frames === undefined) {
				equip.frames = null;
				var s = null;
				if (equip.sprite)
					s = equip.sprite.split("|");
				else if (being.sex === 1 && equip.spriteMale)
					s = equip.spriteMale.split("|");
				else if (being.sex === 0 && equip.spriteFemale)
					s = equip.spriteFemale.split("|");
				else
					continue;
				var xhr = loadXml("graphics/sprites/" + s[0], loadFrames);
				xhr.mob = equip;
				if (s.length === 2) xhr.color = [s[1]];
			}
			if (!equip.frames) continue;
			if (!equip.frames[being.action]) continue;
			if (!equip.frames[being.action][being.direction]) {
				frame = equip.frames[being.action][1][0]
			} else {
				frame = equip.frames[being.action][being.direction][being.spriteIndex];
				if (!frame)
					frame = equip.frames[being.action][being.direction][0];
			}
			left = being.x - scrollX - Math.floor(equip.frames.width / 2);
			top = being.y - scrollY - equip.frames.height + 16;
			if (frame) // Remove for testing
				tmw.context.drawImage(frame.canvas, left + frame.offsetX, top + frame.offsetY);
		}
	}
}

function updateHair(being) {
	if (!being.equipment.hairStyle) {
		being.equipment.hair = null;
		return;
	}
	if (!tmw.hairStyleDB[being.equipment.hairStyle]) {
		being.equipment.hair = null;
		return;
	}
	var key = being.equipment.hairStyle + "@" + being.equipment.hairColor;
	if (!tmw.hairDB[key]) {
		tmw.hairDB[key] = {key: key, frames: null};
		var xhr = loadXml("graphics/sprites/" +
			tmw.hairStyleDB[being.equipment.hairStyle].sprite, loadFrames);
		xhr.color = [tmw.hairColorDB[being.equipment.hairColor].color];
		xhr.mob = tmw.hairDB[key];
	}
	being.equipment.hair = tmw.hairDB[key];
}

function loadFrames() {
	var include = this.responseXML.getElementsByTagName("include")[0];
	if (include) {
		var path = "graphics/sprites/" + include.attributes.file.value;
		var xhr = loadXml(path, loadFrames2);
		xhr.imagesetXML = this;
		xhr.color = this.color;
		xhr.variant = this.variant;
	} else {
		this.imagesetXML = this;
		loadFrames2.call(this);
	}
}

function loadFrames2() {
	var imageset = this.imagesetXML.responseXML.getElementsByTagName("imageset")[0];
	var srcArray = imageset.attributes.src.value.split("|");
	if (srcArray.length === 2) {
		if (!this.color) this.color = [];
		this.color.push(srcArray[1]);
	}
	var png = loadPng(srcArray[0], readFrames);
	this.mob = this.imagesetXML.mob;
	png.xml = this;
	png.frameWidth = Number(imageset.attributes.width.value);
	png.frameHeight = Number(imageset.attributes.height.value);
	png.baseOffsetX = imageset.attributes.offsetXS ? Number(imageset.attributes.offsetX.value) : 0;
	png.baseOffsetY = imageset.attributes.offsetY ? Number(imageset.attributes.offsetY.value) : 0;
	png.variant = this.variant;
}

function readFrames() {
	console.assert(this.xml.mob.frames === null);
	this.xml.mob.frames = {};
	var index, end, offsetX, offsetY, delay;
	var imageset = this.xml.responseXML.getElementsByTagName("imageset")[0];
	this.xml.mob.frames.width = imageset.attributes.width.value;
	this.xml.mob.frames.height = imageset.attributes.height.value;
	var actions = this.xml.responseXML.getElementsByTagName("action");
	for (var i=0; i<actions.length; i++) {
		var actionObj = {};
		this.xml.mob.frames[actions[i].attributes["name"].value] = actionObj;
		var animations = actions[i].getElementsByTagName("animation");
		for (var j=0; j<animations.length; j++) {
			var dir;
			if (animations[j].attributes["direction"])
				dir = animations[j].attributes["direction"].value;
			else
				dir = "default";
			switch (dir) {
				case "default":
				case "down": dir = 1; break;
				case "left": dir = 2; break;
				case "up": dir = 4; break;
				case "right": dir = 8; break;
				default: dir = "unknown"; console.error("Sprite: Unknown direction");
			}
			var frames = actionObj[dir] = [];
			var nodes = animations[j].children;
			for (var n=0; n<nodes.length; n++) {
				var node = nodes[n];
				if (node.nodeName !== "frame" && node.nodeName !== "sequence") continue;
				delay = node.attributes.delay ? Number(node.attributes.delay.value) : 0;
				offsetX = node.attributes.offsetX ? Number(node.attributes.offsetX.value) : 0;
				offsetX += this.baseOffsetX;
				offsetY = node.attributes.offsetY ? Number(node.attributes.offsetY.value) : 0;
				offsetY += this.baseOffsetY;
				if (node.nodeName === "frame") {
					index = this.variant ?
						this.variant : Number(node.attributes.index.value);
					getCanvasForFrame(this, index);
					if (this.variant) return;
				} else { // sequence
					index = Number(node.attributes.start.value);
					end = Number(node.attributes.end.value);
					while (index <= end) getCanvasForFrame(this, index++);
				}
			}
		}
	}

	function getCanvasForFrame(png, index) {
		var top = Math.floor((index * png.frameWidth) / png.width) * png.frameHeight;
		var left = (index * png.frameWidth) % png.width;
		var canvas = document.createElement("canvas");
		canvas.width = png.frameWidth;
		canvas.height = png.frameHeight;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(png, left, top, png.frameWidth, png.frameHeight, 0, 0 , png.frameWidth, png.frameHeight);
		if (png.xml.color) dye(canvas, png.xml.color);
		frames.push({canvas: canvas, delay: delay, offsetX: offsetX, offsetY: offsetY});
	}
}
