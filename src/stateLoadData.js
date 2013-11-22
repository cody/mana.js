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

function stateLoadData() {
	loadXml("effects.xml", readEffectsXml);
	loadXml("emotes.xml", readEmotesXml);
	loadXml("hair.xml", readHairXml);
	loadXml("items.xml", readItemsXml);
	loadXml("monsters.xml", readMonstersXml);
	loadXml("npcs.xml", readNpcsXml);
	loadXml("graphics/sprites/player_female_base.xml", readPlayerSpritesFemale);
	loadXml("graphics/sprites/player_male_base.xml", readPlayerSpritesMale);
	loadXml("skills.xml", readSkillsXml);
	loadXml("status-effects.xml", readStatusEffectsXml);
	tmw.loadDataCounter = (function () {
		var numberOfFiles = 10;
		return {
			readXmlFinished: function () {
				if (--numberOfFiles === 0) {
					delete tmw.loadDataCounter;
					tmw.state.set("STATE_WORLD_SELECT");
				}
			},
		};
	})();
};

function readEffectsXml() {
	console.warn("Implement reading effects.xml");
	tmw.loadDataCounter.readXmlFinished();
}

function readEmotesXml() {
	tmw.emoteDB = [null];
	var emotes = this.responseXML.getElementsByTagName("emote");
	for (var i=0; i<emotes.length; i++) {
		var emote = {id: i+1, name: emotes[i].attributes.name.value};
		emote.image = document.createElement("canvas");
		emote.image.width = 30;
		emote.image.height = 32;
		loadPng(emotes[i].attributes.image.value, loadEmote).emote = emote;
		tmw.emoteDB.push(emote);
	}
	function loadEmote() {
		this.emote.image.getContext("2d").drawImage(this, 0, 0);
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readHairXml() {
	tmw.hairColorDB = {};
	var colors = this.responseXML.getElementsByTagName("color");
	for (var i=0; i<colors.length; i++) {
		var id = Number(colors[i].attributes.id.value);
		var color = colors[i].attributes.value.value;
		var name = colors[i].attributes.name.value;
		tmw.hairColorDB[id] = {id: id, color: color, name: name};
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readItemsXml() { // Todo: sound, replace
	tmw.itemDB = {};
	tmw.hairStyleDB = {};
	var items = this.responseXML.getElementsByTagName("items")[0].childNodes;
	for (var i = 0; i < items.length; i++) {
		if (items[i].nodeName !== "item") continue;
		var id = Number(items[i].attributes["id"].value);
		if (id <= -100) continue; // race sprite
		if (id < 0) {
			console.assert(items[i].attributes["type"].value === "hairsprite");
			tmw.hairStyleDB[-id] = {id: -id, name: items[i].attributes["name"].value,
				sprite: items[i].getElementsByTagName("sprite")[0].textContent};
		}
		if (id < 256) continue;
		var item = {};
		tmw.itemDB[id] = item;
		for (var j = 0; j < items[i].attributes.length; j++) {
			var attribute = items[i].attributes.item(j);
			item[attribute.nodeName] = attribute.nodeValue;
		}
		var sprites = items[i].getElementsByTagName("sprite");
		for (var j=0; j<sprites.length; j++) {
			if (!sprites[j].attributes["gender"]) {
				item["sprite"] = sprites[j].textContent;
			} else if (sprites[j].attributes["gender"].value === "male") {
				item["spriteMale"] = sprites[j].textContent;
			} else if (sprites[j].attributes["gender"].value === "female") {
				item["spriteFemale"] = sprites[j].textContent;
			} else {
				console.error("items.xml: Error reading sprite for item with id " + id);
			}
		}
		var separator = item.image.indexOf("|");
		if (separator === -1) {
			item.imagePath = "graphics/items/" + item.image;
		} else {
			item.imagePath = "graphics/items/" + item.image.slice(0, separator);
			item.imageColor = item.image.slice(separator + 1);
		}
		loadItemImage(item);
	}
	tmw.loadDataCounter.readXmlFinished();

	function loadItemImage(item) {
		var png = loadPng(item.imagePath, function () {
			var canvas = document.createElement("canvas");
			canvas.width = 32;
			canvas.height = 32;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(png, 0, 0);
			if (item.imageColor) dye(canvas, [item.imageColor]);
			item.image = canvas;
		});
		png.item = item;
	}
}

function readMonstersXml() { // Todo: sound, particlefx, attack
	tmw.monsterDB = {};
	var monsters = this.responseXML.getElementsByTagName("monster");
	for (var i = 0; i < monsters.length; i++) {
		var job = Number(monsters[i].attributes["id"].value) + 1002;
		var name = monsters[i].attributes["name"].value;
		var sprites = [];
		var s = monsters[i].getElementsByTagName("sprite");
		for (var j=0; j<s.length; j++) {
			sprites.push(s[j].textContent);
		}
		tmw.monsterDB[job] = {job: job, name: name, sprites: sprites};
		if (monsters[i].attributes["targetCursor"])
			tmw.monsterDB[job].targetCursor = monsters[i].attributes["targetCursor"].value;
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readNpcsXml() {
	tmw.npcDB = {};
	var npcs = this.responseXML.getElementsByTagName("npc");
	for (var i=0; i<npcs.length; i++) {
		var npc = {id: Number(npcs[i].attributes.id.value)};
		tmw.npcDB[npc.id] = npc;
		npc.targetSelection = npcs[i].attributes.targetSelection ?
			npcs[i].attributes.targetSelection : true;
		npc.sprites = [];
		var children = npcs[i].children;
		for (var j=0; j<children.length; j++) {
			if (children[j].nodeName === "sprite") {
				var variant = children[j].attributes.variant ?
					Number(children[j].attributes.variant.value) : 0;
				npc.sprites.push({variant: variant, path: children[j].textContent});
			} else if (children[j].nodeName === "particlefx") {
				npc.particlefx = children[j].textContent;
			}
		}
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readPlayerSpritesFemale() {
	var png = loadPng("graphics/sprites/player_female_base.png", function () {
		readPlayerSprite(tmw.playerSet.female);
	});
	tmw.playerSet.female = {variable: "female", xml: this.responseXML, png: png};
}

function readPlayerSpritesMale() {
	var png = loadPng("graphics/sprites/player_male_base.png", function () {
		readPlayerSprite(tmw.playerSet.male);
	});
	tmw.playerSet.male = {variable: "male", xml: this.responseXML, png: png};
}

function readPlayerSprite(args) {
	tmw.playerSet[args.variable] = {};
	var frames = {width: 64, height: 64};
	tmw.playerSet[args.variable].frames = frames;
	var index, end, offsetX, offsetY, delay;
	var actions = args.xml.getElementsByTagName("action");
	for (var i=0; i<actions.length; i++) {
		var actionObj = {};
		frames[actions[i].attributes["name"].value] = actionObj;
		var animations = actions[i].getElementsByTagName("animation");
		for (var j=0; j<animations.length; j++) {
			var dir;
			switch (animations[j].attributes["direction"].value) {
				case "default":
				case "down": dir = 1; break;
				case "left": dir = 2; break;
				case "up": dir = 4; break;
				case "right": dir = 8; break;
				default: dir = "unknown"; console.error("Sprite: Unknown direction");
			}
			var frameSet = actionObj[dir] = [];
			var nodes = animations[j].children;
			for (var n=0; n<nodes.length; n++) {
				var node = nodes[n];
				if (node.nodeName !== "frame" && node.nodeName !== "sequence") continue;
				delay = node.attributes.delay ? Number(node.attributes.delay.value) : 0;
				offsetX = node.attributes.offsetX ? Number(node.attributes.offsetX.value) : 0;
				offsetY = node.attributes.offsetY ? Number(node.attributes.offsetY.value) : 0;
				if (node.nodeName === "frame") {
					index = Number(node.attributes.index.value);
					getCanvasForFrame(args.png, index);
				} else { // sequence
					index = Number(node.attributes.start.value);
					end = Number(node.attributes.end.value);
					while (index <= end) getCanvasForFrame(args.png, index++);
				}
			}
		}
	}
	function getCanvasForFrame(png, index) {
		var top = Math.floor((index * 64) / png.width) * 64;
		var left = ((index * 64) % png.width);
		var canvas = document.createElement("canvas");
		canvas.width = 64;
		canvas.height = 64;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(png, left, top, 64, 64, 0, 0 ,64, 64);
		frameSet.push({canvas: canvas, delay: delay, offsetX: offsetX, offsetY: offsetY});
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readSkillsXml() {
	tmw.skillsDB = {};
	var sets = this.responseXML.getElementsByTagName("set");
	for (var set=0; set<sets.length; set++) {
		var setName = sets[set].attributes.name.value;
		var skills = sets[set].getElementsByTagName("skill");
		for (var skill=0; skill<skills.length; skill++) {
			var id = Number(skills[skill].attributes.id.value);
			var skillName = skills[skill].attributes.name.value;
			var icon = skills[skill].attributes.icon.value;
			var png = loadPng(icon, $.noop);
			tmw.skillsDB[id] = {id: id, set: setName, name: skillName, png: png};
		}
	}
	tmw.loadDataCounter.readXmlFinished();
}

function readStatusEffectsXml() {
	console.warn("Implement reading status.xml");
	tmw.loadDataCounter.readXmlFinished();
}
