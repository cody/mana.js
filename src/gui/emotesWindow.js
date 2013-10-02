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

function createEmoteWindow() {
	var isVisible = false;
	$("<canvas>")
		.attr("id", "emoteWindow")
		.attr("width", 180)
		.attr("height", 224)
		.css("position", "absolute")
		.css("top", 24)
		.css("right", 124)
		.css("background", "white")
		.hide()
		.click(onclickEmote)
		.appendTo("#game");
	var ctx = document.getElementById("emoteWindow").getContext("2d");
	for (var y=0; y<7; y++) {
		for (var x=0; x<6; x++) {
			ctx.drawImage(tmw.emoteDB[y*6+x+1].image, x*30, y*32);
		}
	}

	function onclickEmote(event) {
		tmw.gui.emotes.toggle();
		var x = Math.floor(event.offsetX  / 30);
		var y = Math.floor(event.offsetY / 32);
		tmw.gui.emotes.trigger(y*6 + x + 1);
	}

	tmw.gui.emotes = {
		toggle: function () {
			isVisible ? $("#emoteWindow").hide() : $("#emoteWindow").show();
			isVisible = !isVisible;
		},
		trigger: function (emoteId) {
			if (!tmw.net.packetLimiter("CMSG_PLAYER_EMOTE")) return;
			var msg = newOutgoingMessage("CMSG_PLAYER_EMOTE");
			msg.write8(emoteId);
			msg.send();
		},
	};
}
