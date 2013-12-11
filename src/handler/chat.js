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

tmw.handler.SMSG_BEING_CHAT = function (msg) {
	var beingId = msg.read32();
	var being = tmw.beings[beingId];
	var name = being ? being.name : "";
	if (!name) name = "???";
	var text = msg.readString();
	if (text.indexOf(name + " : ") === 0)
		text = text.slice(name.length + 3);
	text = tmw.gui.chat.parse(text);
	tmw.gui.chat.log(name, text, "being");
	if (!being) return;
	being.speechText = text;
	being.speechTimeout = tmw.timeAnimation + 5000;
	notifications(name, text, "being");
}

tmw.handler.SMSG_PLAYER_CHAT = function (msg) {
	var text = msg.readString();
	var index = text.indexOf(" : ");
	var name = "";
	if (index !== -1) {
		name = text.slice(0, index);
		text = text.slice(index + 3);
	}
	if (!tmw.gui.chat) { // "Invisible: On." is send during STATE_CONNECT_GAME
		console.log("Localplayer says: " + text);
		return;
	}
	tmw.gui.chat.log(name, text, "player");
	tmw.localplayer.speechText = text;
	tmw.localplayer.speechTimeout =
		tmw.localplayer.speechTimeout ? tmw.timeAnimation + 5000 : 1; // skip motd
};

tmw.handler.SMSG_GM_CHAT = function (msg) {
	var text = msg.readString();
	var index = text.indexOf(" : ");
	var name = "";
	if (index !== -1) {
		name = text.slice(0, index);
		text = text.slice(index + 3);
	}
	text = tmw.gui.chat.parse(text);
	tmw.gui.chat.log(name, text, "gm");
};

tmw.handler.SMSG_WHISPER = function (msg) {
	var nick = msg.readString(24);
	var text = msg.readString();
	text = tmw.gui.chat.parse(text);
	if (text.indexOf("!selllist ") !== 0 && text.indexOf("!buylist ") !== 0) {
		tmw.gui.chat.log(nick, text, "wisper");
		notifications(nick, text, "wisper");
	}
};

tmw.handler.SMSG_WHISPER_RESPONSE = function (msg) {
	switch (msg.read8()) {
	case 0: // Success
		break;
	case 1:
		tmw.gui.chat.log("", "Whisper could not be sent, user is offline.", "active");
		break;
	case 2:
		tmw.gui.chat.log("", "Whisper could not be sent, ignored by user.", "active");
		break;
	default:
		console.error("SMSG_WHISPER_RESPONSE: Unknown response type.");
	}
};

function notifications(name, text, type) {
	if (!chrome.app.window.current().isMinimized())
		return;
	var lowName = tmw.localplayer.name.toLowerCase();
	var lowText = text.toLowerCase();
	if (type === "being" && lowText.indexOf(lowName) === -1)
		return;
	try {
		var options = {
			type: "basic",
			title: name + (type === "being" ? " says:" : " wispers:"),
			message: text,
			iconUrl: "graphics/icon128.png",
			isClickable: true
		}
		chrome.notifications.create("", options, $.noop);
	} catch (error) {
		console.log("Notifications don't work in this version of Chrome: " +
			error.message);
		return;
	}
}
