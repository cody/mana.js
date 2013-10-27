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
	being.equipment = {};
	being.movePixelPath = [];
	var job = being.job;
	if (job <= 25 || (job >= 4001 && job <= 4049))
		being.type = "PLAYER";
	else if (job >= 46 && job <= 1000)
		being.type = "NPC";
	else if (job > 1000 && job <= 2000)
		being.type = "MONSTER";
	else if (job === 45) {
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
	being.moveSpeed = msg.read16();
	being.stunMode = msg.read16();
	being.statusEffects = msg.read16() | (msg.read16() << 16); // Todo
	being.job = msg.read16();
	if (!tmw.beings[id]) {
		if (!createBeing(being)) return;
	}
	// Todo: Check if being is a member of localplayer's party
	being.equipment.hairStyle = msg.read16();
	being.equipment.weapon = tmw.itemDB[msg.read16()];
	being.equipment.shield = tmw.itemDB[msg.read16()];
	being.equipment.bottomClothes = tmw.itemDB[msg.read16()];
	if (msgType === "SMSG_PLAYER_MOVE") msg.skip(4); // server tick
	being.equipment.hat = tmw.itemDB[msg.read16()];
	being.equipment.topClothes = tmw.itemDB[msg.read16()];
	being.equipment.hairColor = msg.read16();
	msg.skip(2); // shoes
	msg.skip(2); // gloves
	msg.skip(4); // guild
	msg.skip(2); // emblem
	msg.skip(2); // manner
	being.statusEffects3 = msg.read16();  // opt3 // Todo
	msg.skip(1); // karma
	being.sex = msg.read8();
	if (msgType === "SMSG_PLAYER_MOVE") {
		var coord = msg.readCoordinatePair();
		tmw.path.findPath(being, coord.srcX, coord.srcY, coord.dstX, coord.dstY);
	} else {
		var coord = msg.readCoordinate();
		if (being.x) {
			tmw.path.findPath(being, Math.floor(being.x / 32), Math.floor(being.y / 32),
				coord.x, coord.y);
		} else {
			being.x = coord.x * 32 + 16;
			being.y = coord.y * 32 + 16;
		}
		being.direction = coord.direction;
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
		being.movePixelPath.length = 0;
	} else if (msgType === "SMSG_PLAYER_MOVE") {
		msg.skip(1);
	}
	msg.skip(1); // Lv
	msg.skip(1);
	updateHair(being);
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
	var being = id === tmw.localplayer.id ? tmw.localplayer : tmw.beings[id];
	if (!being) return;
	var slot = msg.read8();
	var id = msg.read16();
	switch (slot) {
		case 1: being.equipment.hairStyle = id; updateHair(being); break;
		case 2:
			being.equipment.weapon = tmw.itemDB[id];
			being.equipment.shield = tmw.itemDB[msg.read16()];
			break;
		case 3: being.equipment.bottomClothes = tmw.itemDB[id]; break;
		case 4: being.equipment.hat = tmw.itemDB[id]; break;
		case 5: being.equipment.topClothes = tmw.itemDB[id]; break;
		case 6: being.equipment.hairColor = id; updateHair(being); break;
		case 7: break; // clothes color
		case 8: being.equipment.shield = tmw.itemDB[id]; break;
		case 9: being.equipment.shoes = tmw.itemDB[id]; break;
		case 10: being.equipment.gloves = tmw.itemDB[id]; break;
		case 11: being.equipment.cape = tmw.itemDB[id]; break;
		case 12: being.equipment.misc1 = tmw.itemDB[id]; break;
		case 13: being.equipment.misc2 = tmw.itemDB[id]; break;
		default: console.error("SMSG_BEING_CHANGE_LOOKS2: unsupported slot: %d, id: %d", slot, id); break;
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
	being.moveSpeed = msg.read16();
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
	if (msgType === "SMSG_BEING_VISIBLE") being.action = "stand";
	being.hairStyle = msg.read16();
	being.equipment.weapon = tmw.itemDB[msg.read16()];
	being.equipment.bottomClothes = tmw.itemDB[msg.read16()];
	if (msgType === "SMSG_BEING_MOVE") msg.skip(4); // server tick
	being.equipment.shield = tmw.itemDB[msg.read16()];
	being.equipment.hat = tmw.itemDB[msg.read16()];
	being.equipment.topClothes = tmw.itemDB[msg.read16()];
	being.equipment.hairColor = msg.read16();
	being.equipment.shoes = tmw.itemDB[msg.read16()];
	being.equipment.gloves = tmw.itemDB[msg.read16()];
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
		var coord = msg.readCoordinate();
		if (being.x) {
			tmw.path.findPath(being, Math.floor(being.x / 32), Math.floor(being.y / 32),
				coord.x, coord.y);
		} else {
			being.x = coord.x * 32 + 16;
			being.y = coord.y * 32 + 16;
		}
		being.direction = coord.direction;
	}
	msg.skip(1);
	msg.skip(1);
	msg.skip(1);
	updateHair(being);
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
		case 1: break; // pick-up
		case 2: if (srcBeing) srcBeing.action = "sit"; break;
		case 3: if (srcBeing) srcBeing.action = "stand"; break;
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
	if (dstBeing) {
		if (!dstBeing.damageTaken) dstBeing.damageTaken = 0;
		dstBeing.damageTaken += damage;
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
	being.x = msg.read16() * 32 + 16;
	being.y = msg.read16() * 32 + 16;
	if (being.movePixelPath.length) {
		being.movePixelPath.length = 0;
		being.action = "stand";
	}
};

tmw.handler.SMSG_BEING_RESURRECT = function (msg) {
	var id = msg.read32();
	var being = (id === tmw.localplayer.id) ? tmw.localplayer : tmw.beings[id];
	if (!being) return;
	if (msg.read8() === 1) being.action = "stand";
};
