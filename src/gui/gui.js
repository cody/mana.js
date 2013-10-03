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

function createGui() {
	// fps
	$("<div>")
		.attr("id", "fps")
		.css("position", "absolute")
		.css("right", 1)
		.css("bottom", 1)
		.css("width", 50)
		.css("height", 20)
		.css("background-color", "white")
		.css("font-size", "10pt")
		.hide()
		.appendTo("#game");

	// hp Bar
	$("<div>")
		.attr("id", "hpBar")
		.css("position", "absolute")
		.css("left", 3)
		.css("top", 3)
		.css("width", 100)
		.css("height", 18)
		.html("<span id='hpBarLabel' style='position:absolute; width:100%;" +
			"text-align:center; top:2px'></span>")
		.appendTo("#game")
		.progressbar();

	// mp Bar
	$("<div>")
		.attr("id", "mpBar")
		.css("position", "absolute")
		.css("left", 108)
		.css("top", 3)
		.css("width", 100)
		.css("height", 18)
		.html("<span id='mpBarLabel' style='position:absolute; width:100%;" +
			"text-align:center; top:2px'></span>")
		.appendTo("#game")
		.progressbar();

	// xp Bar
	$("<div>")
		.attr("id", "xpBar")
		.css("position", "absolute")
		.css("left", 213)
		.css("top", 3)
		.css("width", 100)
		.css("height", 18)
		.html("<span id='xpBarLabel' style='position:absolute; width:100%;" +
			"text-align:center; top:2px'></span>")
		.appendTo("#game")
		.progressbar();
	$("#xpBar").find(".ui-progressbar-value").css({"background": "LightSkyBlue"});

	// Buttons
	var offsetRight = 3;
	var buttonsData = [
		{
			id: "toggleWindowButtonSettings",
			func: tmw.gui.settings.toggle,
			png: "button-icon-setup.png",
		},
		{
			id: "toggleWindowButtonShortcut",
			func: $.noop,
			png: "button-icon-shortcut.png",
		},
		{
			id: "toggleWindowButtonSkills",
			func: tmw.gui.skills.toggle,
			png: "button-icon-specials.png",
		},
		{
			id: "toggleWindowButtonSocial",
			func: tmw.gui.social.toggle,
			png: "button-icon-social.png",
		},
		{
			id: "toggleWindowButtonChat",
			func: tmw.gui.chat.toggle,
			png: "button-icon-skills.png",
		},
		{
			id: "toggleWindowButtonEquipment",
			func: $.noop,
			png: "button-icon-equipment.png",
		},
		{
			id: "toggleWindowButtonStatus",
			func: tmw.gui.status.toggle,
			png: "button-icon-status.png",
		},
		{
			id: "toggleWindowButtonInventory",
			func: tmw.gui.inventory.toggle,
			png: "button-icon-inventory.png",
		},
		{
			id: "toggleWindowButtonSmilies",
			func: tmw.gui.emotes.toggle,
			png: "button-icon-smilies.png",
		},
	];

	for (var i=0; i<buttonsData.length; i++)
		createButton(buttonsData[i]);

	function createButton(b) {
		$("<canvas>")
			.attr("id", b.id)
			.attr("width", 20)
			.attr("height", 18)
			.css("position", "absolute")
			.css("top", 3)
			.css("right", offsetRight)
			.css("margin", 0)
			.appendTo("#game")
			.button()
			.click(b.func);
		offsetRight += 25;
		var context = document.getElementById(b.id).getContext("2d");
		var img = new Image();
		img.src = "../../graphics/" + b.png;
		img.onload = function () { context.drawImage(img, 20, 0, 20, 18, 0, 0, 20, 18); };
	}

	tmw.gui.gui = {
		updateHp: function () {
			$("#hpBar").progressbar("value", tmw.localplayer.attributes.hp);
			$("#hpBarLabel").text(tmw.localplayer.attributes.hp);
			var progressbarValue = $("#hpBar").find(".ui-progressbar-value");
			var d = tmw.localplayer.attributes.hp / tmw.localplayer.attributes.hpMax;
			var green = Math.floor(255 * d).toString(16);
			if (green.length === 1) green = "0" + green;
			var red = Math.floor(255 * (1 - d)).toString(16);
			if (red.length === 1) red = "0" + red;
			progressbarValue.css({"background": "#" + red + green + "00"});
		},
		updateHpMax: function () {
			$("#hpBar").progressbar("option", "max", tmw.localplayer.attributes.hpMax);
			tmw.gui.gui.updateHp();
		},
		updateMp: function () {
			$("#mpBar").progressbar("value", tmw.localplayer.attributes.mp);
			$("#mpBarLabel").text(tmw.localplayer.attributes.mp);
			var progressbarValue = $("#mpBar").find(".ui-progressbar-value");
			if (tmw.localplayer.attributes.matkBase)
				progressbarValue.css({"background": "DodgerBlue"});
			else
				progressbarValue.css({"background": "LightGray"});
		},
		updateMpMax: function () {
			$("#mpBar").progressbar("option", "max", tmw.localplayer.attributes.mpMax);
		},
		setXp: function () {
			$("#xpBar").progressbar("value", tmw.localplayer.attributes.xp);
			var num = tmw.localplayer.attributes.xp / tmw.localplayer.attributes.xpNeeded;
			num = Math.round(10000 * num) / 100;
			var text = num === Infinity ? "Max" : num + " %";
			$("#xpBarLabel").text(text);
			$("#xpBar").attr("title", tmw.localplayer.attributes.xp + " / " + tmw.localplayer.attributes.xpNeeded);
		},
		setXpNeeded: function () {
			var needed = tmw.localplayer.attributes.xpNeeded;
			$("#xpBar").progressbar("option", "max", needed ? needed : 1);
			tmw.gui.gui.setXp();
		},
	};
}
