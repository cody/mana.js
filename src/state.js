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

tmw.state = {
	currentState: null,
	set: function (s, args) {
		console.log("State: " + s);
		this.currentState = s;
		this[s](args);
	},
};

tmw.state.STATE_START = function () {
	console.warn("Clean up!"); // Todo
	$("body").html("<div id='wallpaper'></div>")
	$("#wallpaper")
		.css("position", "absolute")
		.css("top", 0)
		.css("left", 0)
		.css("height", "100%")
		.css("width", "100%")
		.css("background", "url(graphics/spit23loginwallpaper_800x600.png)")
		.css("background-size", "100% 100%")
		.css("background-repeat", "no-repeat");
	tmw.state.set("STATE_LOGIN");
}

tmw.state.STATE_LOGIN = function () {
	stateLogin();
};

tmw.state.STATE_LOGIN_ATTEMPT = function (loginData) {
	tmw.net.connect(loginData, false, function () {
		var msg = newOutgoingMessage("CMSG_LOGIN_REQUEST");
		msg.write32(0); // Client Version
		msg.writeString(tmw.net.loginData.name, 24);
		msg.writeString(tmw.net.loginData.password, 24);
		msg.write8(3); // Bitmask 0x01: Can handle Update Host packet
					   //         0x02: defaults to first char-server instead of last
		msg.send();
	});
	tmw.gui.update = showUpdateDialog();
};

tmw.state.STATE_LOGIN_ERROR = function (text) {
	tmw.net.disconnect();
	$("#wallpaper").empty();
	$("<div>").html(text)
		.attr("title", "Login Error")
		.css("display", "none")
		.dialog({ dialogClass: "no-close",
			closeOnEscape: false,
			buttons: { OK: function() {
				$(this).dialog("close");
				tmw.state.set("STATE_START");
			}
		}});
};

tmw.state.STATE_UPDATE = function () {
	if (tmw.repository) {
		console.log("Skipping updates, using repository");
		tmw.state.set("STATE_LOAD_DATA");
	} else {
		stateUpdate();
	}
};

tmw.state.STATE_LOAD_DATA = function () {
	stateLoadData();
};

tmw.state.STATE_WORLD_SELECT = function () {
	//if (tmw.net.worlds.length === 1)
	tmw.state.set("STATE_WORLD_SELECT_ATTEMPT", 0);
};

tmw.state.STATE_WORLD_SELECT_ATTEMPT = function (index) {
	tmw.net.connect(tmw.net.worlds[index], true, function () {
		tmw.state.set("STATE_GET_CHARACTERS");
	});
};

tmw.state.STATE_GET_CHARACTERS = function () {
	var msg = newOutgoingMessage("CMSG_CHAR_SERVER_CONNECT");
    msg.write32(tmw.net.token.accountId);
    msg.write32(tmw.net.token.sessionId1);
    msg.write32(tmw.net.token.sessionId2);
    msg.write16(1);
    msg.write8(tmw.net.token.sex);
	msg.send();
	createCharSelectWindow();
};

tmw.state.STATE_CHAR_SELECT = function () {
	tmw.gui.charSelect.draw();
};

tmw.state.STATE_CONNECT_GAME = function () {
	document.getElementById("wallpaper").innerHTML = "<h1>Connecting to map-server</h1>";
	var msg = newOutgoingMessage("CMSG_MAP_SERVER_CONNECT");
	msg.write32(tmw.net.token.accountId);
	msg.write32(tmw.localplayer.charId);
	msg.write32(tmw.net.token.sessionId1);
	msg.write32(tmw.net.token.sessionId2);
	msg.write8(tmw.net.token.sex);
	msg.send();
};

tmw.state.STATE_GAME = function () {
	$("body").empty();
	$("<div>")
		.attr("id", "game")
		.css("position", "absolute")
		.css("top", 0)
		.css("left", 0)
		.css("height", "100%")
		.css("width", "100%")
		.css("font-size", "11pt")
		.appendTo("body");
	$("<canvas>")
		.attr("id", "canvas")
		.css("position", "absolute")
		.css("top", 0)
		.css("left", 0)
		.css("z-index", -1)
		.css("background-color", "black")
		.appendTo("#game");
	document.getElementById("canvas").onmousewheel = function (event) {
		return false;
	};
	window.onresize();
	tmw.context = document.getElementById("canvas").getContext("2d");
	createSelectedBeing();
	createChatWindow();
	createInventoryWindow();
	createStatusWindow();
	createSkillsWindow();
	createSettingsWindow();
	createSocialWindow();
	createEmoteWindow();
	createShopWindow();
	createNPCWindow();
	createGui();
	createMaps();
	tmw.maps.loadMap(tmw.net.token.map);
	createInput();
};
