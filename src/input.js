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

function createInput() {
	tmw.input = {
		getArrowKeys: function () {
			return dirKeys;
		},
		getAttackKey: function () {
			return attackKey && tmw.localplayer.action !== "dead";
		},
	};

	var dirKeys = 0;
	var attackKey = false;
	
	document.onkeydown = function onKeyDown(key) {
		if (tmw.gui.npc.isOpen())
			return;
		var arrow = null;
		switch (key.keyIdentifier) {
			case ("Down"): arrow = 1; break;
			case ("Left"): arrow = 2; break;
			case ("Up"): arrow = 4; break;
			case ("Right"): arrow = 8; break;
		}
		if (arrow) {
			if (!key.altKey) {
				dirKeys |= arrow;
			} else {
				playerChangeDirection(arrow);
			}
		}
		if (key.altKey && key.keyCode >= 48 && key.keyCode <= 57) { // Emotes
			var digit = key.keyCode === 48 ? 10 : key.keyCode - 48;
			tmw.gui.emotes.trigger(digit);
		}
		switch (key.keyCode) {
		case 13: // Enter: focus chat
			$("#chatInput").focus();
			break;
		case 17: // control: deselect
			tmw.selectedBeing.clear();
			break;
		case 65: // a: select monster
			tmw.selectedBeing.select("MONSTER");
			break;
		case 78: // n: select npc
			tmw.selectedBeing.select("NPC");
			break;
		case 81: // q: select player
			tmw.selectedBeing.select("PLAYER");
			break;
		case 83: // s: sit
			var action = tmw.localplayer.action;
			if (action !== "stand" && action !== "sit") return;
			if (!tmw.net.packetLimiter("CMSG_PLAYER_CHANGE_ACT")) return;
			var msg = newOutgoingMessage("CMSG_PLAYER_CHANGE_ACT");
			msg.write32(0);
			switch (action) {
				case "stand": msg.write8(2); tmw.localplayer.action = "sit"; break;
				case "sit"  : msg.write8(3); tmw.localplayer.action = "stand"; break;
				default: return;
			}
			msg.send();
			tmw.localplayer.sprite = null;
			break;
		case 84: // t: talk
			var being = tmw.selectedBeing.get();
			if (!being) return;
			if (being.type === "NPC" && !tmw.gui.npc.isOpen()) {
				var msg = newOutgoingMessage("CMSG_NPC_TALK");
				msg.write32(being.id);
				msg.write8(0); // unused
				msg.send();
			} else if (being.type === "PLAYER") {
				tmw.gui.chat.getPanel("wisper", being.nameInsecure);
			}
			break;
		case 88: // x: attack
			attackKey = true;
			break;
		case 89:
		case 90: // y or z: pick-up
			buildPickUpQueue();
			break;
		case 113: // F2: status window
			tmw.gui.status.toggle();
			break;
		case 114: // F3: inventory window
			tmw.gui.inventory.toggle();
			break;
		case 116: // F5: skills window
			tmw.gui.skills.toggle();
			break;
		case 118: // F7: chat window
			tmw.gui.chat.toggle();
			break;
		case 120: // F9: settings window
			tmw.gui.settings.toggle();
			break;
		case 122: // F11: social window
			tmw.gui.social.toggle();
			break;
		case 123: // F12: emote window
			tmw.gui.emotes.toggle();
			break;
		default:
			//console.log(key.keyCode);
		}
	};

	document.onkeyup = function (key) {
		switch (key.keyIdentifier) {
			case ("Down"): dirKeys &= 0xe; break;
			case ("Left"): dirKeys &= 0xd; break;
			case ("Up"): dirKeys &= 0xa; break;
			case ("Right"): dirKeys &= 0x7; break;
		}
		if (key.keyCode === 88) { // x: attack
			attackKey = false;
			if (tmw.localplayer.action.indexOf("attack") === 0) {
				tmw.localplayer.action = "stand";
				tmw.localplayer.sprite = null;
			}
		}
	};
}

function processMovementInput() {
	var arrow = tmw.input.getArrowKeys();
	if (!arrow) return;
	var posX = tmw.localplayer.xTile;
	var posY = tmw.localplayer.yTile;
	var dx = 0;
	var dy = 0;
	if (arrow & 1) dy++;
	if (arrow & 2) dx--;
	if (arrow & 4) dy--;
	if (arrow & 8) dx++;
	if (arrow===1 || arrow===2 || arrow===4 || arrow===8) {
		if (tmw.map.collision[(posY + dy) * tmw.map.width + posX + dx]) {
			playerChangeDirection(arrow);
			return;
		}
	} else if (!tmw.map.collision[(posY + dy) * tmw.map.width + posX]) {
		if (tmw.map.collision[(posY + dy) * tmw.map.width + posX + dx] ||
			tmw.map.collision[(posY) * tmw.map.width + posX + dx]) {
			dx = 0;
		}
	} else if (!tmw.map.collision[(posY) * tmw.map.width + posX + dx]) {
		dy = 0;
	} else {
		return;
	}
	if (dx === 0 && dy === 0) return;
	tmw.localplayer.movePixelPath = [{
		dstX: (posX + dx) * 32 + 16,
		dstY: (posY + dy) * 32 + 16
	}];
	tmw.localplayer.xFloat = tmw.localplayer.x;
	tmw.localplayer.yFloat = tmw.localplayer.y;
	var msg = newOutgoingMessage("CMSG_PLAYER_CHANGE_DEST");
	msg.writeCoordinates(posX + dx, posY + dy);
	msg.send();
}
