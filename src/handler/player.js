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

tmw.handler.SMSG_WALK_RESPONSE = function (msg) {
    msg.skip(4); // tick
    var coord = msg.readCoordinatePair();
	tmw.localplayer.xServer = coord.dstX;
	tmw.localplayer.yServer = coord.dstY;
};

tmw.handler.SMSG_PLAYER_ARROW_MESSAGE = function (msg) {
    var type = msg.read16();
	if (type === 0) {
		tmw.textParticle.push({
			text: "Equip arrows first.",
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "red"
		});
	}
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_1  = function (msg) {
	var type = msg.read16();
	var value = msg.read32();
	switch (type) {
		case 0x00: tmw.localplayer.moveSpeed = value;
			tmw.gui.status.updateMoveSpeed();
			break;
		case 0x04: tmw.localplayer.attributes.manner = value;
			break;
		case 0x05: tmw.localplayer.attributes.hp = value;
			tmw.gui.gui.updateHp();
			break;
		case 0x06: tmw.localplayer.attributes.hpMax = value;
			tmw.gui.gui.updateHpMax();
			break;
		case 0x07: tmw.localplayer.attributes.mp = value;
			tmw.gui.gui.updateMp();
			break;
		case 0x08: tmw.localplayer.attributes.mpMax = value;
			tmw.gui.gui.updateMpMax();
			break;
		case 0x09: tmw.localplayer.attributes.charPoints = value;
			tmw.gui.status.updateCharPoints();
			break;
		case 0x0b: tmw.localplayer.attributes.level = value;
			tmw.gui.status.updateLevel();
			break;
		case 0x0c: tmw.localplayer.attributes.skillPoints = value;
			tmw.gui.skills.draw();
			break;
		case 0x18: tmw.localplayer.attributes.weight = value;
			tmw.gui.inventory.updateWeight();
			break;
		case 0x19: tmw.localplayer.attributes.weightMax = value;
			tmw.gui.inventory.updateWeightMax();
			break;
		case 0x29: tmw.localplayer.attributes.atkBase = value;
			tmw.gui.status.updateAtk();
			break;
		case 0x2a: tmw.localplayer.attributes.atkBonus = value;
			tmw.gui.status.updateAtk();
			break;
		case 0x2b: tmw.localplayer.attributes.matkBase = value;
			tmw.gui.status.updateMAtk();
			break;
		case 0x2c: tmw.localplayer.attributes.matkBonus = value;
			tmw.gui.status.updateMAtk();
			break;
		case 0x2d: tmw.localplayer.attributes.defBase = value;
			tmw.gui.status.updateDef();
			break;
		case 0x2e: tmw.localplayer.attributes.defBonus = value;
			tmw.gui.status.updateDef();
			break;
		case 0x2f: tmw.localplayer.attributes.mdefBase = value;
			tmw.gui.status.updateMDef();
			break;
		case 0x30: tmw.localplayer.attributes.mdefBonus = value;
			tmw.gui.status.updateMDef();
			break;
		case 0x31: tmw.localplayer.attributes.accuracy = value;
			tmw.gui.status.updateAccuracy();
			break;
		case 0x32: tmw.localplayer.attributes.evadeBase = value;
			tmw.gui.status.updateEvade();
			break;
		case 0x33: tmw.localplayer.attributes.evadeBonus = value;
			tmw.gui.status.updateEvade();
			break;
		case 0x34: tmw.localplayer.attributes.critical = value;
			tmw.gui.status.updateCritical();
			break;
		case 0x35: tmw.localplayer.attackSpeed = value;
			tmw.gui.status.updateAttackSpeed();
			break;
		case 0x37: tmw.localplayer.attributes.jobXp = value;
			tmw.gui.skills.draw();
			break;
		case 500: tmw.localplayer.gmLevel = value;
			tmw.gui.status.updateLevel();
			break;
		default: console.error("Unknown type in SMSG_PLAYER_STAT_UPDATE_1: " + type);
	}
	if (tmw.localplayer.attributes.hp === 0 && tmw.localplayer.action !== "dead") {
		tmw.localplayer.action = "dead";
		tmw.selectedBeing.clear();
		$("<div>").html("You have died!")
			.attr("title", "Death Notice")
			.css("display", "none")
			.dialog({ dialogClass: "no-close",
				closeOnEscape: false,
				buttons: { Respawn: function() {
					$(this).dialog("close");
					var msg = newOutgoingMessage("CMSG_PLAYER_RESTART");
					msg.write8(0);
					msg.send();
				}
			}});
	}
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_2 = function (msg) {
	var type = msg.read16();
	var value = msg.read32();
	switch(type) {
		case 0x1:
			var diff = value - tmw.localplayer.attributes.xp;
			tmw.localplayer.attributes.xp = value;
			if (diff > 0) {
				tmw.textParticle.push({
					text: diff + "xp",
					timeout: tmw.timeAnimation + 4000,
					being: tmw.localplayer,
					color: "blue"
				});
			}
			tmw.gui.gui.setXp();
			break;
		case 0x2: tmw.localplayer.attributes.jobXp = value;
			tmw.gui.skills.draw();
			break;
		case 0x14: tmw.localplayer.attributes.money = value;
			tmw.gui.status.updateMoney();
			break;
		case 0x16: tmw.localplayer.attributes.xpNeeded = value;
			tmw.gui.gui.setXpNeeded();
			break;
		case 0x17: tmw.localplayer.attributes.jobXpNeeded = value;
			tmw.gui.skills.draw();
			break;
		default: console.error("Unknown type in SMSG_PLAYER_STAT_UPDATE_2");
	}
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_3 = function (msg) {
	var type = msg.read32();
	var state = StateNumberToString(type);
	tmw.localplayer.states[state + "Base"] = msg.read32();
	tmw.localplayer.states[state + "Bonus"] = msg.read32();
	tmw.gui.status[state + "Update"]();
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_4 = function (msg) {
	var state = StateNumberToString(msg.read16());
	if (msg.read8() !== 1)
		tmw.gui.chat.log("", "Cannot raise skill!", "player");
	tmw.localplayer.states[state + "Base"] = msg.read8();
	tmw.gui.status[state + "Update"]();
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_5 = function (msg) {
	tmw.localplayer.attributes.charPoints = msg.read16();
	tmw.gui.status.updateCharPoints();

	var states = ["str", "agi", "vit", "int", "dex", "luk"];
	for (var i in states) {
		var val = msg.read8();
		var needed = msg.read8();
		tmw.localplayer.states[states[i] + "Base"] = val;
		tmw.localplayer.states[states[i] + "PointsNeeded"] = val >= 99 ? "Max" : needed;
	}

	var attrib = ["atk", "matk", "def", "mdef"];
	for (var i in attrib) {
		tmw.localplayer.attributes[attrib[i] + "Base"] = msg.read16();
		tmw.localplayer.attributes[attrib[i] + "Bonus"] = msg.read16();
	}
	tmw.localplayer.attributes["accuracy"] = msg.read16();
	tmw.localplayer.attributes["evadeBase"] = msg.read16();
	tmw.localplayer.attributes["evadeBonus"] = msg.read16();
	tmw.localplayer.attributes["critical"] = msg.read16();
	msg.skip(2); // manner

	tmw.gui.status.draw();
};

tmw.handler.SMSG_PLAYER_STAT_UPDATE_6 = function (msg) {
	var state = StateNumberToString(msg.read16() - 19);
	var needed = msg.read8();
	var val = tmw.localplayer.states[state + "Base"];
	tmw.localplayer.states[state + "PointsNeeded"] = val >= 99 ? "Max" : needed;
	tmw.gui.status[state + "Update"]();
};

tmw.handler.SMSG_PLAYER_WARP = function (msg) {
	tmw.maps.loadMap(msg.readString(16, true));
	tmw.localplayer.x = msg.read16() * 32 + 16;
	tmw.localplayer.y = msg.read16() * 32 + 16;
};

function playerChangeDirection(dir) {
	console.assert(dir===1 || dir===2 || dir===4 || dir===8);
	if (tmw.localplayer.direction === dir) return;
	if (tmw.localplayer.action === "dead") return;
	var msg = newOutgoingMessage("CMSG_PLAYER_CHANGE_DIR");
	msg.write16(0);
	msg.write8(dir);
	msg.send();
	tmw.localplayer.direction = dir;
}

function playerPickUp() {
	var dx, dy, floor;
	for (var f in tmw.floorItems) {
		floor = tmw.floorItems[f];
		dx = Math.abs(Math.floor(tmw.localplayer.x / 32) - floor.x / 32);
		dy = Math.abs(Math.floor(tmw.localplayer.y / 32) - floor.y / 32);
		if (dx <= 1 && dy <= 1) break;
		floor = null;
	}
	if (!floor) return;
	if (!tmw.net.packetLimiter("CMSG_ITEM_PICKUP")) return;
	var msg = newOutgoingMessage("CMSG_ITEM_PICKUP");
	msg.write32(floor.id);
	msg.send();
}

function StateNumberToString(type) {
	var state;
	switch (type) {
		case 13: state = "str"; break;
		case 14: state = "agi"; break;
		case 15: state = "vit"; break;
		case 16: state = "int"; break;
		case 17: state = "dex"; break;
		case 18: state = "luk"; break;
		default: state = type; console.error("Unknown state " + type);
	}
	return state;
}
