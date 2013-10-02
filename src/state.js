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

/*
	STATE_ERROR,
		STATE_START,
    STATE_CHOOSE_SERVER,
    STATE_CONNECT_SERVER,
		STATE_LOGIN,
		STATE_LOGIN_ATTEMPT,
		STATE_WORLD_SELECT,
		STATE_WORLD_SELECT_ATTEMPT,
		STATE_UPDATE,
		STATE_LOAD_DATA,
		STATE_GET_CHARACTERS,
		STATE_CHAR_SELECT,
		STATE_CONNECT_GAME,
		STATE_GAME,
    STATE_CHANGE_MAP,
		STATE_LOGIN_ERROR,
    STATE_ACCOUNTCHANGE_ERROR,
    STATE_REGISTER_PREP,
    STATE_REGISTER,
    STATE_REGISTER_ATTEMPT,
    STATE_CHANGEPASSWORD,
    STATE_CHANGEPASSWORD_ATTEMPT,
    STATE_CHANGEPASSWORD_SUCCESS,
    STATE_CHANGEEMAIL,
    STATE_CHANGEEMAIL_ATTEMPT,
    STATE_CHANGEEMAIL_SUCCESS,
    STATE_UNREGISTER,
    STATE_UNREGISTER_ATTEMPT,
    STATE_UNREGISTER_SUCCESS,
    STATE_SWITCH_SERVER,
    STATE_SWITCH_LOGIN,
    STATE_SWITCH_CHARACTER,
    STATE_LOGOUT_ATTEMPT,
    STATE_WAIT,
    STATE_EXIT,
    STATE_FORCE_QUIT
*/

tmw.state = {
	currentState: null,
	set: function (s, args) {
		console.log("State: " + s);
		this.currentState = s;
		this[s](args);
	},
};

tmw.state.STATE_START = function () {
	console.error("Clean up!"); // Todo
	tmw.state.set("STATE_LOGIN");
}

tmw.state.STATE_LOGIN = function () {
	$("body").html("<div id='wallpaper'></div>")
	$("#wallpaper")
		.css("position", "absolute")
		.css("top", 0)
		.css("left", 0)
		.css("height", "100%")
		.css("width", "100%")
		.css("background", "url(graphics/spit23loginwallpaper_800x600.png)")
		.css("background-size", "100% 100%")
		.css("background-repeat", "no-repeat")
		.html(
			"<form id='loginForm' title='Login'>" +
			"<a id='signUpLink' href='http://www.themanaworld.org/registration.php' target='_blank'>Sign-up</a><br>" +
			"<label for='formName'>Name</label>" +
			"<input type='text' id='formName' class='ui-widget-content ui-corner-all'>" +
			"<label for='formPassword'>Password</label>" +
			"<input type='password' id='formPassword' class='ui-widget-content ui-corner-all'>" +
			"<button id='connectButton'>Play</button>" +
			"</form>");
	$("#loginForm>input")
		.css("display", "block")
		.css("width", "95%")
		.css("margin-bottom", ".5em");
	$("#loginForm>a")
		.css("font-weight", "bold")
		.css("float", "right")
		.css("text-decoration", "none")
		.css("color", "green")
		.css("font-family", "monospace")
		.css("font-size", 20);
	$("#connectButton").button();
	$("#connectButton")
		.css("color", "Brown")
		.click(function (event) {
			event.preventDefault();
			var server = tmw.secret ? tmw.secret.server : "server.themanaworld.org";
			var name = document.getElementById("formName").value;
			var password = document.getElementById("formPassword").value;
			$("#loginForm").dialog("close");
			console.log("Server: " + server + ", Name: " + name);
			tmw.net.setLoginData(name, password);
			tmw.state.set("STATE_LOGIN_ATTEMPT", {server: server, port: 6901});});
	if (tmw.secret) {
		$("#formName").attr("value", tmw.secret.name);
		$("#formPassword").attr("value", tmw.secret.password);
	}
	if ($("#formName").attr("value")) {
		$("#formPassword").attr("autofocus", "true");
	} else {
		$("#formName").attr("autofocus", "true");
	}
	$("#loginForm").dialog({width: 280, dialogClass: "no-close"});
};

tmw.state.STATE_LOGIN_ATTEMPT = function (loginData) {
	tmw.net.connect(loginData, function () {
		newOutgoingMessage("CMSG_SERVER_VERSION_REQUEST").send();
		tmw.net.read();
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

tmw.state.STATE_WORLD_SELECT = function () {
	//if (tmw.net.getWorlds().length === 1)
	tmw.state.set("STATE_WORLD_SELECT_ATTEMPT", 0);
};

tmw.state.STATE_WORLD_SELECT_ATTEMPT = function (index) {
	tmw.net.connect(tmw.net.getWorlds()[index], function () {
		tmw.state.set("STATE_GET_CHARACTERS");
	});
};

tmw.state.STATE_GET_CHARACTERS = function () {
	document.getElementById("wallpaper").innerHTML = "<h1>STATE_GET_CHARACTERS</h1>";	
	var msg = newOutgoingMessage("CMSG_CHAR_SERVER_CONNECT");
    msg.write32(tmw.net.token.accountId);
    msg.write32(tmw.net.token.sessionId1);
    msg.write32(tmw.net.token.sessionId2);
    msg.write16(1);
    msg.write8(tmw.net.token.sex);
	msg.send();
	tmw.net.read(true);
};

tmw.state.STATE_CHAR_SELECT = function (charSelectChoices) {
	document.getElementById("wallpaper").innerHTML =
		"<h1>Account and Character Management</h1>" +
		"<select id='char' size='9'> </select>" +
		"<br><input type='button' id='choose' value='Choose' />";
	document.getElementById("choose").onclick = function () {
		var c = document.getElementById("char").selectedIndex;
		if (c >= 0) {
			tmw.localplayer = charSelectChoices[c];
			var msg = newOutgoingMessage("CMSG_CHAR_SELECT");
			msg.write8(charSelectChoices[c].slot);
			msg.send();
			document.getElementById("wallpaper").innerHTML = "<h1>Sending selected character</h1>";
		}
	};
	var character = document.getElementById("char");
	for (var i=0; i<charSelectChoices.length; i++) {
		character.add(new Option([charSelectChoices[i].name]));
		if (tmw.secret && tmw.secret.character === charSelectChoices[i].name) {
			character.selectedIndex = i;
			$("#choose").trigger("click");
			return;
		}
	}
	character.selectedIndex = 0;
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
	tmw.net.read(true);
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
