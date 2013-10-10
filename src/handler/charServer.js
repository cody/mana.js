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

function readCharacterData(msg) {
	var c = {type: "PLAYER", action: "stand", direction: 1};
	c.id = tmw.net.token.accountId;
	c.attributes = {};
	c.states = {};
	c.equipment = {};
	c.sex = tmw.net.token.sex;
	c.charId = msg.read32();
	c.attributes.xp = msg.read32();
	c.attributes.money = msg.read32();
	c.attributes.jobXp = msg.read32();
	c.attributes.jobBase = msg.read32();
	c.equipment.shoes = tmw.itemDB[msg.read16()];
	c.equipment.gloves = tmw.itemDB[msg.read16()];
	c.equipment.cape = tmw.itemDB[msg.read16()];
	c.equipment.misc1 = tmw.itemDB[msg.read16()];
	msg.skip(4); // option
	msg.skip(4); // karma
	msg.skip(4); // manner
	msg.skip(2); // unknown
	c.attributes.hp = msg.read16();
	c.attributes.hpMax = msg.read16();
	c.attributes.mp = msg.read16();
	c.attributes.mpMax = msg.read16();
	msg.skip(2); // speed
	c.race = msg.read16();
	c.equipment.hairStyle = msg.read16();
	c.equipment.weapon = tmw.itemDB[msg.read16()];
	c.attributes.level = msg.read16();
	msg.skip(2); // skill point
	c.equipment.bottomClothes = tmw.itemDB[msg.read16()];
	c.equipment.shield = tmw.itemDB[msg.read16()];
	c.equipment.hat = tmw.itemDB[msg.read16()];
	c.equipment.topClothes = tmw.itemDB[msg.read16()];
	c.equipment.hairColor = msg.read16();
	c.equipment.misc2 = tmw.itemDB[msg.read16()];
	c.nameInsecure = msg.readString(24);
	c.name = htmlToText(c.nameInsecure);
	c.states.strBase = msg.read8();
	c.states.agiBase = msg.read8();
	c.states.vitBase = msg.read8();
	c.states.intBase = msg.read8();
	c.states.dexBase = msg.read8();
	c.states.lukBase = msg.read8();
	c.slot = msg.read8();
	msg.skip(1); // unknown
	updateHair(c);
	tmw.gui.charSelect.addChoice(c);
	return c;
}

tmw.handler.SMSG_CHAR_LOGIN = function (msg) {
	msg.skip(20);
	var count = (msg.getSize() - 20) / 106;
	for (var i=0; i < count; ++i) {
		readCharacterData(msg);
	}
	tmw.state.set("STATE_CHAR_SELECT");
};

tmw.handler.SMSG_CHAR_CREATE_SUCCEEDED = function (msg) {
	tmw.localplayer = readCharacterData(msg);
	var msg = newOutgoingMessage("CMSG_CHAR_SELECT");
	msg.write8(tmw.localplayer.slot);
	msg.send();
};

tmw.handler.SMSG_CHAR_CREATE_FAILED = function (msg) {
	tmw.gui.charSelect.charCreationFailed("Failed to create character. " +
		"Most likely the name is already taken.");
};

tmw.handler.SMSG_CHAR_LOGIN_ERROR = function (msg) {
	var text;
	switch (msg.read8()) {
		case 0:
			text = "Access denied. Most likely, there are " +
				"too many players on this server.";
			break;
		case 1:
			text = "Cannot use this ID.";
			break;
		default:
			text = "Unknown char-server failure.";
	}
	tmw.net.fatalError("SMSG_CHAR_LOGIN_ERROR: " + text);
};

tmw.handler.SMSG_CHAR_MAP_INFO = function (msg) {
	msg.skip(4); // charId again
	tmw.net.token.map = msg.readString(16, true);
	var hostname = ip2String(msg.read32());
	var port = msg.read16();
	tmw.net.connect({server: hostname, port: port}, function () {
		tmw.state.set("STATE_CONNECT_GAME");
	});
};
