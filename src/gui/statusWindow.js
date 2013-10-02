/*
 * This file is part of mana.js
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

function createStatusWindow() {
	var a = tmw.localplayer.attributes;
	var s = tmw.localplayer.states;
	var win = $("<div>")
		.attr("id", "statusWindow")
		.css("position", "absolute")
		.css("width", 400)
		.css("left", 30)
		.css("top", 28)
		.hide()
		.css("background", "Bisque")
		.css("font-size", "10pt")
		.html("<div id='statusWindowTitle'>" +
			"<span style='margin-left:4px; font-size:11pt;'>Status</span></div>" +
			"<div id='statusWindowLeft'></div>" +
			"<div id='statusWindowRight'></div>")
		.appendTo("#game");
	win.draggable({handle: "#statusWindowTitle", containment: "#game"});
	$("#statusWindowTitle")
		.css("background", "Sienna");
	$("#statusWindowLeft")
		.css("width", "60%")
		.css("float", "left")
		.html("<table>" +
			"<tr>" +
				"<td>Strength</td>" +
				"<td><span id='statusWindowValueStr'></span></td>" +
				"<td><button id='raiseStrButton'>+</button></td>" +
				"<td><span id='statusWindowValueStrPointsNeeded'></span></td>" +
			"</tr>" +
			"<tr>" +
				"<td>Agility</td>" +
				"<td><span id='statusWindowValueAgi'></span></td>" +
				"<td><button id='raiseAgiButton'>+</button></td>" +
				"<td><span id='statusWindowValueAgiPointsNeeded'></span></td>" +
			"</tr>" +
			"<tr>" +
				"<td>Vitality</td>" +
				"<td><span id='statusWindowValueVit'></span></td>" +
				"<td><button id='raiseVitButton'>+</button></td>" +
				"<td><span id='statusWindowValueVitPointsNeeded'></span></td>" +
			"</tr>" +
			"<tr>" +
				"<td>Intelligence</td>" +
				"<td><span id='statusWindowValueInt'></span></td>" +
				"<td><button id='raiseIntButton'>+</button></td>" +
				"<td><span id='statusWindowValueIntPointsNeeded'></span></td>" +
			"</tr>" +
			"<tr>" +
				"<td>Dexterity</td>" +
				"<td><span id='statusWindowValueDex'></span></td>" +
				"<td><button id='raiseDexButton'>+</button></td>" +
				"<td><span id='statusWindowValueDexPointsNeeded'></span></td>" +
			"</tr>" +
			"<tr>" +
				"<td>Luck</td>" +
				"<td><span id='statusWindowValueLuk'></span></td>" +
				"<td><button id='raiseLukButton'>+</button></td>" +
				"<td><span id='statusWindowValueLukPointsNeeded'></span></td>" +
			"</tr>" +
			"</table>" +
			"Points to distribute: <span id='statusWindowValueCharPoints'></span>" +
			"<br><button id='statusWindowCopyToChatButton'>Copy to chat</button>"
		);
	$("#statusWindowRight")
		.css("width", "40%")
		.css("float", "right")
		.html(
			"<div style='color:blue'>Level: <span id='statusWindowValueLevel'>" + a.level + "</span></div>" +
			"<div style='color:green'>Money: <span id='statusWindowValueMoney'>" + a.money + "</span> GP</div>" +
			"Defence: <span id='statusWindowValueDef'></span><br>" +
			"Attack: <span id='statusWindowValueAtk'></span><br>" +
			"Attack Delay: <span id='statusWindowValueAttackSpeed'></span><br>" +
			"Attack Range: <span id='statusWindowValueAttackRange'></span><br>" +
			"% Accuracy: <span id='statusWindowValueAccuracy'></span><br>" +
			"% Evade: <span id='statusWindowValueEvade'></span><br>" +
			"% Critical: <span id='statusWindowValueCritical'></span><br>" +
			"Magic Attack: <span id='statusWindowValueMAtk'></span><br>" +
			"Magic Defence: <span id='statusWindowValueMDef'></span><br>" +
			"Walk Delay: <span id='statusWindowValueMoveSpeed'></span>"
		);

	$("#raiseStrButton").click(function () { raiseState(13); });
	$("#raiseAgiButton").click(function () { raiseState(14); });
	$("#raiseVitButton").click(function () { raiseState(15); });
	$("#raiseIntButton").click(function () { raiseState(16); });
	$("#raiseDexButton").click(function () { raiseState(17); });
	$("#raiseLukButton").click(function () { raiseState(18); });
	function raiseState(state) {
		var msg  = newOutgoingMessage("CMSG_STAT_UPDATE_REQUEST");
		msg.write16(state);
		msg.write8(1);
		msg.send();
	}

	$("#statusWindowCopyToChatButton").click(function () {
		document.getElementById("chatInput").value += (
			"str: " + s.strBase + (s.strBonus ? "+" + s.strBonus : "") +
			" agi: " + s.strBase + (s.agiBonus ? "+" + s.agiBonus : "") +
			" vit: " + s.vitBase + (s.vitBonus ? "+" + s.vitBonus : "") +
			" int: " + s.intBase + (s.intBonus ? "+" + s.intBonus : "") +
			" dex: " + s.dexBase + (s.dexBonus ? "+" + s.dexBonus : "") +
			" luk: " + s.lukBase + (s.lukBonus ? "+" + s.lukBonus : "")
		);
	});

	tmw.gui.status = {
		toggle: function () {
			win.toggle();
		},
		draw: function () {
			for (var i in this) {
				if (i !== "toggle" && i !== "draw")
					this[i]();
			}
		},
		strUpdate: function () {
			$("#statusWindowValueStr").text(s.strBase + (s.strBonus ? " + " + s.strBonus : ""));
			$("#statusWindowValueStrPointsNeeded").text(s.strPointsNeeded);
		},
		agiUpdate: function () {
			$("#statusWindowValueAgi").text(s.agiBase + (s.agiBonus ? " + " + s.agiBonus : ""));
			$("#statusWindowValueAgiPointsNeeded").text(s.agiPointsNeeded);
		},
		vitUpdate: function () {
			$("#statusWindowValueVit").text(s.vitBase + (s.vitBonus ? " + " + s.vitBonus : ""));
			$("#statusWindowValueVitPointsNeeded").text(s.vitPointsNeeded);
		},
		intUpdate: function () {
			$("#statusWindowValueInt").text(s.intBase + (s.intBonus ? " + " + s.intBonus : ""));
			$("#statusWindowValueIntPointsNeeded").text(s.intPointsNeeded);
		},
		dexUpdate: function () {
			$("#statusWindowValueDex").text(s.dexBase + (s.dexBonus ? " + " + s.dexBonus : ""));
			$("#statusWindowValueDexPointsNeeded").text(s.dexPointsNeeded);
		},
		lukUpdate: function () {
			$("#statusWindowValueLuk").text(s.lukBase + (s.lukBonus ? " + " + s.lukBonus : ""));
			$("#statusWindowValueLukPointsNeeded").text(s.lukPointsNeeded);
		},
		updateCharPoints: function () {
			$("#statusWindowValueCharPoints").text(a.charPoints);
		},
		updateLevel: function () {
			$("#statusWindowValueLevel").text(a.level +
				(tmw.localplayer.gmLevel ? (" (GM " + tmw.localplayer.gmLevel + ")") : ""));
		},
		updateMoney: function () {
			$("#statusWindowValueMoney").text(a.money);
		},
		updateDef: function () {
			$("#statusWindowValueDef").text(a.defBase +
				(a.defBonus ? (" + " + a.defBonus) : ""));
		},
		updateAtk: function () {
			$("#statusWindowValueAtk").text(a.atkBase +
				(a.atkBonus ? (" + " + a.atkBonus) : ""));
		},
		updateAttackSpeed: function () {
			$("#statusWindowValueAttackSpeed").text(tmw.localplayer.attackSpeed);
		},
		updateAttackRange: function () {
			$("#statusWindowValueAttackRange").text(tmw.localplayer.attackRange);
		},
		updateAccuracy: function () {
			$("#statusWindowValueAccuracy").text(a.accuracy);
		},
		updateEvade: function () {
			$("#statusWindowValueEvade").text(a.evadeBase +
				(a.evadeBonus ? (" + " + a.evadeBonus) : ""));
		},
		updateCritical: function () {
			$("#statusWindowValueCritical").text(a.critical);
		},
		updateMAtk: function () {
			$("#statusWindowValueMAtk").text(a.matkBase +
				(a.matkBonus ? (" + " + a.matkBonus) : ""));
			tmw.gui.gui.updateMp();
		},
		updateMDef: function () {
			$("#statusWindowValueMDef").text(a.mdefBase +
				(a.mdefBonus ? (" + " + a.mdefBonus) : ""));
		},
		updateMoveSpeed: function () {
			$("#statusWindowValueMoveSpeed").text(tmw.localplayer.moveSpeed);
		},
	};
}
