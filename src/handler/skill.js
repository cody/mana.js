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

tmw.handler.SMSG_PLAYER_SKILLS = function (msg) {
	var currentSkills = {};
	var size = msg.getSize() / 37;
	for (var i=0; i<size; i++) {
		var id = msg.read16();
		if (!tmw.skillsDB[id])
			console.error("Unknown skills id " + id);
		msg.skip(2);  // target type
		msg.skip(2);  // unused
		var level = msg.read16();
		msg.skip(2); // sp
		msg.skip(2); // range
		msg.skip(24); // unused
		var up = msg.read8();
		currentSkills[id] = {id: id, level: level, up: up};
	}
	tmw.gui.skills.updateAll(currentSkills);
}

tmw.handler.SMSG_PLAYER_SKILL_UP = function (msg) {
	var id = msg.read16();
	var level = msg.read16();
	msg.skip(2); // sp
	msg.skip(2); // range
	var up = msg.read8();
	tmw.gui.skills.updateOne({id: id, level: level, up: up});
}

tmw.handler.SMSG_SKILL_FAILED = function (msg) {
	var skillId = msg.read16();
	var bskill = msg.read16();
	msg.skip(2); // btype
	var success = msg.read8();
	var reason = msg.read8();
	var text = "";
	if (!success && skillId === 0x1 /*SKILL_BASIC*/) {
		switch (bskill) {
			case 0: // BSKILL_TRADE
				text = "Trade failed! ";
				break;
			case 1: // BSKILL_EMOTE
				text = "Emote failed! ";
				break;
			case 2: // BSKILL_SIT
				text = "Sit failed! ";
				break;
			case 3: // BSKILL_CREATECHAT
				text = "Chat creating failed! ";
				break;
			case 4: // BSKILL_JOINPARTY
				text = "Could not join party! ";
				break;
			case 4: // BSKILL_SHOUT
				text = "Cannot shout! ";
				break;
			default: console.error("Unknown skill failed: " + bskill);
		}
		switch (reason) {
			case 0: //RFAIL_SKILLDEP
				text += "You have not yet learned that skill!";
				break;
			case 1: // RFAIL_INSUFSP
				text += "Insufficient SP!";
				break;
			case 2: // RFAIL_INSUFHP
				text += "Insufficient HP!";
				break;
			case 3: // RFAIL_NOMEMO
				text += "You have no memos!";
				break;
			case 4: // RFAIL_SKILLDELAY
				text += "You cannot do that right now!";
				break;
			case 5: // RFAIL_ZENY
				text += "Seems you need more money... ;-)";
				break;
			case 6: // RFAIL_WEAPON
				text += "You cannot use this skill with that kind of weapon!";
				break;
			case 7: // RFAIL_REDGEM
				text += "You need another red gem!";
				break;
			case 8: // RFAIL_BLUEGEM
				text += "You need another blue gem!";
				break;
			case 9: // RFAIL_OVERWEIGHT
				text += "You're carrying to much to do this!";
				break;
			default:
				text += "Huh? What's that?";
		}
	} else {
		switch (skillId) {
			case 0x1b: // SKILL_WARP
				text = "Warp failed...";
				break;
			case 0x32: // SKILL_STEAL
				text = "Could not steal anything...";
				break;
			case 0x34: // SKILL_ENVENOM
				text = "Poison had no effect...";
				break;
			default: console.error("Unknown skill id: 0x" + bskill.toString(16));
		}
	}
	tmw.gui.chat.log("", text, "player");
};
