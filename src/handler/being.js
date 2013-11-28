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

function createBeing(being) {
	being.action = "stand";
	being.direction = 1;
	being.equipment = [];
	being.movePixelPath = [];
	being.damageTaken = 0;
	var job = being.job;
	if (job <= 25 || (job >= 4001 && job <= 4049)) {
		being.type = "PLAYER";
	} else if (job >= 46 && job <= 1000) {
		being.type = "NPC";
		var npc = tmw.npcDB[job];
		if (npc.frames === undefined) {
			npc.frames = null;
			if (npc.sprites[0]) {
				var sprite = npc.sprites[0].path.split("|");
				var xhr = loadXml("graphics/sprites/" + sprite[0], loadFrames);
				xhr.mob = npc;
				if (sprite.length === 2) xhr.color = [sprite[1]];
				xhr.variant = npc.sprites[0].variant;
			}
		}
		being.template = npc;
	} else if (job > 1000 && job <= 2000) {
		being.type = "MONSTER";
		var monster = tmw.monsterDB[being.job];
		if (monster.frames === undefined) {
			monster.frames = null;
			var sprite = monster.sprites[0].split("|");
			var xhr = loadXml("graphics/sprites/" + sprite[0], loadFrames);
			xhr.mob = monster;
			if (sprite.length === 2) xhr.color = [sprite[1]];
		}
		being.template = monster;
	} else if (job === 45) {
		return false; // Skip portals
	} else {
		being.type = "UNKNOWN";
		console.error("Being of unknown type: " + being);
	}
	if (being.type === "PLAYER" || being.type === "NPC") {
		being.name = "";
		var msgOut = newOutgoingMessage("CMSG_GetCharNameRequest");
		msgOut.write32(being.id);
		msgOut.send();
	}
	tmw.beings[being.id] = being;
	return true;
}

tmw.handler.SMSG_PLAYER_MOVE = function (msg) {processPlayerPacket(msg, "SMSG_PLAYER_MOVE");};
tmw.handler.SMSG_PLAYER_UPDATE_1 = function (msg) {processPlayerPacket(msg, "SMSG_PLAYER_UPDATE_1");};
tmw.handler.SMSG_PLAYER_UPDATE_2 = function (msg) {processPlayerPacket(msg, "SMSG_PLAYER_UPDATE_2");};
function processPlayerPacket(msg, msgType) {
	var id = msg.read32();
	var being = tmw.beings[id] || {id: id};
	being.moveSpeed = 32 / msg.read16();
	being.stunMode = msg.read16();
	being.statusEffects = msg.read16() | (msg.read16() << 16); // Todo
	being.job = msg.read16();
	if (!tmw.beings[id]) {
		if (!createBeing(being)) return;
	}
	// Todo: Check if being is a member of localplayer's party
	var equipment = [];
	setEquipment(being, "hairStyle", msg.read16());
	equipment.push(["weapon", msg.read16()]);
	equipment.push(["shield", msg.read16()]);
	equipment.push(["bottomClothes", msg.read16()]);
	if (msgType === "SMSG_PLAYER_MOVE") msg.skip(4); // server tick
	equipment.push(["hat", msg.read16()]);
	equipment.push(["topClothes", msg.read16()]);
	setEquipment(being, "hairColor", msg.read16());
	msg.skip(2); // shoes
	msg.skip(2); // gloves
	msg.skip(4); // guild
	msg.skip(2); // emblem
	msg.skip(2); // manner
	being.statusEffects3 = msg.read16();  // opt3 // Todo
	msg.skip(1); // karma
	being.sex = msg.read8();
	being.template = tmw.playerSet[being.sex ? "male" : "female"];
	for (var i in equipment)
		setEquipment(being, equipment[i][0], equipment[i][1]);
	if (msgType === "SMSG_PLAYER_MOVE") {
		var coord = msg.readCoordinatePair();
		tmw.path.findPath(being, coord.srcX, coord.srcY, coord.dstX, coord.dstY);
	} else {
		var coord = msg.readCoordinate();
		if (being.x) {
			tmw.path.findPath(being, being.xTile, being.yTile, coord.x, coord.y);
		} else {
			being.xTile = coord.x;
			being.yTile = coord.y;
			being.x = coord.x * 32 + 16;
			being.y = coord.y * 32 + 16;
			being.movePixelPath.length = 0;
		}
		being.direction = coord.direction;
		being.sprite = null;
	}
	being.gmStatus = msg.read16() ? true : false;
	if (msgType === "SMSG_PLAYER_UPDATE_1")	{
		var action = msg.read8();
		switch (action) {
			case 0: being.action = "stand"; break;
			case 1: being.action = "dead"; break;
			case 2: being.action = "sit"; break;
			default: console.error("Ignoring action "+action+" for being "+id+" "+being.name);
		}
		being.sprite = null;
	} /* else if (msgType === "SMSG_PLAYER_MOVE") {
		msg.skip(1);
	}
	msg.skip(1); // Lv
	msg.skip(1); */
}

tmw.handler.SMSG_BEING_NAME_RESPONSE = function (msg) {
	var id = msg.read32();
	var being = tmw.beings[id];
	if (being) {
		being.nameInsecure = msg.readString(24);
		being.name = htmlToText(being.nameInsecure);
		tmw.gui.social.addBeingPresent(being);
	}
};

tmw.handler.SMSG_BEING_REMOVE = function (msg) {
	var id = msg.read32();
	var being = tmw.beings[id];
	if (!being) return;
	if (being.isSelected) tmw.selectedBeing.clear();
	if (msg.read8() === 1 && being.type !== "NPC") {
		being.action = "dead";
		being.sprite = null;
		being.movePixelPath.length = 0;
	} else {
		tmw.gui.social.removeBeingPresent(id);
		delete tmw.beings[id];
	}
	if (being.type === "NPC")
		tmw.gui.shop.close(id);
};

tmw.handler.SMSG_BEING_CHANGE_LOOKS2 = function (msg) {
	var id = msg.read32();
	var being = tmw.beings[id];
	if (!being) return;
	var slot = msg.read8();
	var id = msg.read16();
	switch (slot) {
		case 1: setEquipment(being, "hairStyle", id); break;
		case 2:
			setEquipment(being, "weapon", id);
			setEquipment(being, "shield", msg.read16());
			break;
		case 3: setEquipment(being, "bottomClothes", id); break;
		case 4: setEquipment(being, "hat", id); break;
		case 5: setEquipment(being, "topClothes", id); break;
		case 6: setEquipment(being, "hairColor", id); break;
		case 7: break; // clothes color
		case 8: setEquipment(being, "shield", id); break;
		case 9: setEquipment(being, "shoes", id); break;
		case 10: setEquipment(being, "gloves", id); break;
		case 11: setEquipment(being, "cape", id); break;
		case 12: setEquipment(being, "misc1", id); break;
		case 13: setEquipment(being, "misc2", id); break;
		default: console.error("SMSG_BEING_CHANGE_LOOKS2: unsupported slot: %d, id: %d", slot, id);
	}
};

tmw.handler.SMSG_BEING_EMOTION = function (msg) {
	var id = msg.read32();
	var emote = tmw.emoteDB[msg.read8()];
	var being = id === tmw.localplayer.id ? tmw.localplayer : tmw.beings[id];
	if (!emote || !being) return;
	being.emoteImage = emote.image;
	being.emoteTimeout = tmw.timeAnimation + 1500;
};

tmw.handler.SMSG_BEING_VISIBLE = function (msg) {processBeingPacket(msg, "SMSG_BEING_VISIBLE");};
tmw.handler.SMSG_BEING_MOVE = function (msg) {processBeingPacket(msg, "SMSG_BEING_MOVE");};
function processBeingPacket(msg, msgType) {
	var id = msg.read32();
	if (tmw.beings[id] && tmw.beings[id].action === "dead")
		delete tmw.beings[id];
	var being = tmw.beings[id] ? tmw.beings[id] : {id: id};
	being.moveSpeed = 32 / msg.read16();
	being.stunMode = msg.read16();
	being.statusEffects = msg.read16() | (msg.read16() << 16); // Todo
	being.job = msg.read16();
	if (!tmw.beings[id]) {
		if (being.job == 0 && id >= 110000000) {
			console.log("Found ghost!");
			return;
		}
		if (!createBeing(being)) return;
	}
	msg.skip(2); // hairStyle
	msg.skip(2); // weapon
	msg.skip(2); // bottomClothes
	if (msgType === "SMSG_BEING_MOVE") msg.skip(4); // server tick
	msg.skip(2); // shield
	msg.skip(2); // hat
	msg.skip(2); // topClothes
	msg.skip(2); // hairColor
	msg.skip(2); // shoes
	msg.skip(2); // gloves
	being.guild = msg.read32();
	msg.skip(2); // guild emblem
	msg.skip(2); // manner
	being.statusEffect3 = msg.read16();
	msg.skip(1); // karma
	being.sex = msg.read8();
	if (msgType === "SMSG_BEING_MOVE") {
		var coord = msg.readCoordinatePair();
		tmw.path.findPath(being, coord.srcX, coord.srcY, coord.dstX, coord.dstY);
	} else { // SMSG_BEING_VISIBLE
		being.action = "stand";
		var coord = msg.readCoordinate();
		if (being.x) {
			tmw.path.findPath(being, being.xTile, being.yTile, coord.x, coord.y);
		} else {
			being.xTile = coord.x;
			being.yTile = coord.y;
			being.x = coord.x * 32 + 16;
			being.y = coord.y * 32 + 16;
			being.sprite = null;
		}
		being.direction = coord.direction;
	}
	msg.skip(1);
	msg.skip(1);
	msg.skip(1);
}

tmw.handler.SMSG_BEING_SPAWN = function (msg) {
	// Do nothing.
};

tmw.handler.SMSG_BEING_CHANGE_DIRECTION = function (msg) {
	var being = tmw.beings[msg.read32()];
	if (!being) return;
	msg.skip(2);
	switch (msg.read8()) {
		case 1: being.direction = 1; break;
		case 3: being.direction = 1; break;
		case 2: being.direction = 2; break;
		case 6: being.direction = 4; break;
		case 4: being.direction = 4; break;
		case 12: being.direction = 4; break;
		case 8: being.direction = 8; break;
		case 9: being.direction = 1; break;
	}
	being.sprite = null;
};

tmw.handler.SMSG_PLAYER_GUILD_PARTY_INFO = function (msg) {
	var being = tmw.beings[msg.read32()];
	if (!being) return;
	being.partyNameInsecure = msg.readString(24);
	being.partyName = htmlToText(being.partyNameInsecure);
	// being.guildNameInsecure = msg.readString(24);
	// being.guildName = htmlToText(being.guildNameInsecure);
	// being.guildPosInsecure = msg.readString(24);
	// being.guildPos = htmlToText(being.guildPosInsecure);
	// msg.skip(24);
};

tmw.handler.SMSG_BEING_ACTION = function (msg) {
	var srcId = msg.read32();
	var srcBeing = srcId === tmw.localplayer.id ? null : tmw.beings[srcId];
	var dstId = msg.read32();
	var dstBeing = dstId === tmw.localplayer.id ? tmw.localplayer : tmw.beings[dstId];
	msg.skip(4); // server tick
	msg.skip(4); // src speed
	msg.skip(4); // dst speed
	var damage = msg.read16();
	msg.skip(2); // param 2
	var type = msg.read8();
	msg.skip(2); // param 3
	switch (type) {
		case 1: return; // pick-up
		case 2: // sit
			if (srcBeing) {
				srcBeing.action = "sit";
				srcBeing.sprite = null;
			}
			return;
		case 3: // stand
			if (srcBeing) {
				srcBeing.action = "stand";
				srcBeing.sprite = null;
			}
			return;
		case 0x0: // HIT
		case 0xa: // CRITICAL
		case 0x8: // MULTI
			var color;
			if (!damage)
				color = "Yellow";
			else if (dstId === tmw.localplayer.id)
				color = "Red";
			else if (srcId === tmw.localplayer.id)
				color = "Green";
			else
				color = "Blue";
			tmw.textParticle.push({
				text: (damage ? damage.toString() : "miss"),
				timeout: tmw.timeAnimation + 3000,
				being: dstBeing,
				color: color
			});
			if (srcBeing && !srcBeing.movePixelPath.length &&
				srcBeing.action.indexOf("attack") !== 0) {
				var slot = equipmentType2Index("weapon");
				srcBeing.action = srcBeing.equipment[slot] ?
					srcBeing.equipment[slot]["attack-action"]: "attack";
				srcBeing.sprite = null;
			}
			break;
		case 0x4: // REFLECT
			tmw.textParticle.push({
				text: ("REFLECT " + damage),
				timeout: tmw.timeAnimation + 3000,
				being: dstBeing,
				color: "#dddd00"
			});
			break;
		case 0xb: // FLEE (Lucky Dodge)
			tmw.textParticle.push({
				text: "miss",
				timeout: tmw.timeAnimation + 3000,
				being: dstBeing,
				color: "#dddd00"
			});
			break;
		default: console.error("Unknown SMSG_BEING_ACTION type " + type);
	}
	if (!dstBeing) return;
	dstBeing.damageTaken += damage;
	if (!srcBeing) return;
	var dx = Math.abs(dstBeing.xTile - srcBeing.xTile);
	var dy = Math.abs(dstBeing.yTile - srcBeing.yTile);
	if (dy && dy >= dx)
		var dir = (dstBeing.y - srcBeing.y) > 0 ? 1 : 4;
	else if (dx)
		dir = (dstBeing.x - srcBeing.x) > 0 ? 8 : 2;
	if ((dx || dy) && srcBeing.direction !== dir) {
		srcBeing.direction = dir;
		srcBeing.sprite = null;
	}
};

tmw.handler.SMSG_BEING_SELFEFFECT = function (msg) {
	var being = tmw.beings[msg.read32()];
	if (!being) return;
	var effectType = msg.read32();
	console.log((being.name?being.name:being.job) + " triggered self effect " + effectType);
};

tmw.handler.SMSG_PLAYER_STOP = function (msg) {
	var being = tmw.beings[msg.read32()];
	if (!being) return;
	being.xTile = msg.read16();
	being.yTile = msg.read16();
	being.x = being.xTile * 32 + 16;
	being.y = being.yTile * 32 + 16;
	if (being.movePixelPath.length) {
		being.movePixelPath.length = 0;
		being.action = "stand";
		being.sprite = null;
	}
};

tmw.handler.SMSG_BEING_RESURRECT = function (msg) {
	var id = msg.read32();
	var being = (id === tmw.localplayer.id) ? tmw.localplayer : tmw.beings[id];
	if (!being) return;
	if (msg.read8() === 1) {
		being.action = "stand";
		being.sprite = null;
	}
};
