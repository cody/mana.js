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

tmw.handler.SMSG_CONNECTION_PROBLEM = function(msg) {
	var code = msg.read8();
	var text;
	switch (code) {
		case 0:
			text = "Authentication failed.";
			break;
		case 1:
			text = "No servers available.";
			break;
		case 2:
			if (tmw.state.currentState === "STATE_GAME")
				text = "Someone else is trying to use this account.";
			else
				text = "This account is already logged in.";
			break;
		case 3:
			text = "Speed hack detected.";
			break;
		case 8:
			text = "Duplicated login.";
			break;
		default:
			text = "Unknown connection error.";
			break;
	}
	console.error("SMSG_LOGIN_ERROR. Error Code: 0x" + code.toString(16) + " " + text);
	tmw.state.set("STATE_LOGIN_ERROR", text);
};

tmw.handler.SMSG_MAP_LOGIN_SUCCESS = function (msg) {
	msg.skip(4); // server tick
	var coord = msg.readCoordinate();
	tmw.localplayer.xTile = coord.x;
	tmw.localplayer.yTile = coord.y;
	tmw.localplayer.x = coord.x * 32 + 16;
	tmw.localplayer.y = coord.y * 32 + 16;
	tmw.localplayer.direction = coord.direction;
	msg.skip(2);
	tmw.state.set("STATE_GAME");
};

tmw.handler.SMSG_ADMIN_IP = function (msg) {
	var being = tmw.beings[msg.read32()];
	if (being) being.ip = ip2String(msg.read32());
};

tmw.handler.SMSG_ADMIN_KICK_ACK = function (msg) {
	var id = msg.read32();
	if (id)
		tmw.gui.chat.log("", "Kick succeeded!", "player");
	else
		tmw.gui.chat.log("", "Kick failed!", "player");
};

tmw.handler.SMSG_MAP_QUIT_RESPONSE = function (msg) {
	var text = "Unknown quit response";
	var callback = $.noop;
	switch (msg.read8()) {
		case 0:
			text =  "You have been kicked from the server!";
			tmw.net.disconnect();
			callback = function () { tmw.state.set("STATE_START"); };
			break;
		case 1:
			text = "Request to quit denied!";
			break;
	}
	$("<div>").html(text)
		.attr("title", "Map Quit Response")
		.css("display", "none")
		.dialog({ dialogClass: "no-close",
			closeOnEscape: false,
			buttons: { OK: function() {
				$(this).dialog("close");
				callback();
			}
		}});
}
