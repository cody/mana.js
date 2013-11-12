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

tmw.handler.SMSG_SERVER_VERSION_RESPONSE = function () {
	/* message length = 10
	 * Offset 2: major (255)
	 * Offset 3: minor ('T')
	 * Offset 4: revision ('M')
	 * Offset 5: release ('W')
	 * Offset 6: official (0 = client registation disabled, 1 = enabled)
	 * Offset 7: which
	 * Offset 8-9: mod version
	*/
	var msg = newOutgoingMessage("CMSG_LOGIN_REQUEST");
	msg.write32(0); // Client Version
	msg.writeString(tmw.net.loginData.name, 24);
	msg.writeString(tmw.net.loginData.password, 24);
	msg.write8(3); // Bitmask 0x01: Can handle Update Host packet
				   //         0x02: defaults to first char-server instead of last 
	msg.send();
};

tmw.handler.SMSG_UPDATE_HOST = function (msg) {
	var updateHost = msg.readString(msg.getSize());
	tmw.net.setUpdateHost(updateHost);
};

tmw.handler.SMSG_LOGIN_DATA = function (msg) {
	tmw.net.worlds.length = 0;
	var worldCount = (msg.getSize() - 43) / 32;
	console.log("Got " + worldCount + " worlds.");
	tmw.net.token.sessionId1 = msg.read32();
	tmw.net.token.accountId = msg.read32();
	tmw.net.token.sessionId2 = msg.read32();
    msg.skip(30);
    tmw.net.token.sex = msg.read8(); // 0 = female, 1 = male
    for (var i = 0; i < worldCount; i++) {
		var ip = msg.read32();
		ip = ip2String(ip);
		var port = msg.read16();
		var name = msg.readString(20);
		var onlineUsers = msg.read32();
		msg.skip(2);
		tmw.net.worlds.push({server: ip, port: port, name: name, onlineUsers: onlineUsers});
		console.log("World: ip: "+ip+", port: "+port+", name: "+name+", user: "+onlineUsers);
	}
    tmw.state.set("STATE_UPDATE");
};

tmw.handler.SMSG_LOGIN_ERROR = function(msg) {
	var code = msg.read8();
	var text;
	switch (code) {
		case 0:
			text = "There is no user with the name " + tmw.net.loginData.name +
				" registered.";
			break;
		case 1:
			text = "Incorrect password.";
			break;
		case 2:
			text = "Account expired.";
			break;
		case 3:
			text = "Rejected from server.";
			break;
		case 4:
			text = "You have been permanently banned from the game.";
			break;
		case 5:
			text = "Client version is too low (client out of date).";
			break;
		case 6:
			text = "You have been temporarily banned from the game until " +
				msg.readString(20);
			break;
		case 7:
			text = "Server overpopulated.";
			break;
		case 9:
			text = "This user name is already taken.";
			break;
		case 0x63:
			text = "Account has been permanently erased.";
			break;
		default:
			text = "Unknown error.";
			break;
	}
	console.log("SMSG_LOGIN_ERROR. Error Code: 0x" + code.toString(16) + " " + text);
    tmw.state.set("STATE_LOGIN_ERROR", text);
};
