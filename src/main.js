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

var tmw = {
	beings: {},
	callHandler: {},
	config: {},
	data: {},
	floorItems: {},
	gui: {},
	handler: {},
	inventory: [],
	packetsReverse: {},
	pickUpQueue: [],
	playerSet: {},
	sprites: {},
	textParticle: [],
	tilesets: {},
	timeAnimation: 0,
	zipdata: [],
};

window.onload = main;

function main() {
	chrome.runtime.requestUpdateCheck($.noop);

	tmw.debug = false;
	createNetwork();
	tmw.msgOutBuffer = new ArrayBuffer(65536);
	createPathSearch();
	createLoop();

	window.onresize = function() {
		var game = $("#game");
		if (!game.length) return;
		var canvas = document.getElementById("canvas");
		canvas.width = game.width();
		canvas.height = game.height();
	};

	for (var p in tmw.packets) {
		tmw.packetsReverse[tmw.packets[p]] = p;
		if (tmw.handler[p]) tmw.callHandler[tmw.packets[p]] = tmw.handler[p];
	}

	chrome.notifications.onClicked.addListener(function () {
		chrome.notifications.getAll(function (allIds) {
			chrome.app.window.current().show();
			for (var i in allIds)
				chrome.notifications.clear(i, $.noop);
		})
	});

	tmw.state.set("STATE_START");
}

// utils
function ip2String(ip) {
	return (ip & 0xff) +"."+ ((ip>>>8) & 0xff) +"."+ ((ip>>>16) & 0xff) +"."+ (ip>>>24);
}

function htmlToText(text) {
	return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
