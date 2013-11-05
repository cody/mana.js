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

function createNPCWindow() {
	tmw.gui.npc = {
		isOpen: function () { return isOpen; },
		message: message,
		close: close,
		next: next,
		choice: choice,
		intInput: intInput,
		strInput: strInput,
	};

	var formElements = null;
	var isOpen = false;
	var npcId = null;

	var win = $("<div>")
		.attr("id", "npcWindow")
		.css("position", "absolute")
		.css("width", 300)
		.css("height", 300)
		.css("left", 80)
		.css("top", 50)
		.hide()
		.html("<div id='npcWindowTitle'>" +
			"<span id='npcWindowName' style='margin-left:4px;'></span></div>" +
			"<div id='npcWindowScroll'></div>")
		.appendTo("#game");
	win.resizable({resize: $.noop, containment: "#game",
		minWidth: 200, minHeight: 150});
	win.draggable({handle: "#npcWindowTitle", containment: "#game"});
	$("#npcWindowTitle")
		.css("background", "ForestGreen");
	var scroll = $("#npcWindowScroll")
		.css("position", "absolute")
		.css("bottom", 0)
		.css("width", "100%")
		.css("background", "Bisque")
		.css("overflow-y", "scroll")
		.css("overflow-x", "hidden");
	var dialog = $("<div>")
		.css("padding", 3)
		.appendTo(scroll);

	function open(id) {
		isOpen = true;
		npcId = id;
		if (tmw.localplayer.action === "walk") {
			tmw.localplayer.action = "stand";
			tmw.localplayer.sprite = null;
			tmw.localplayer.movePixelPath = 0;
			tmw.localplayer.x = Math.floor(tmw.localplayer.x / 32) * 32 + 16;
			tmw.localplayer.y = Math.floor(tmw.localplayer.y / 32) * 32 + 16;
		}
		win.toggle();
		$("#npcWindowName").text(tmw.beings[id].name ? tmw.beings[id].name : "NPC");
		scroll.css("top", $("#npcWindowTitle").height());
	}

	function message(id, text) {
		if (!isOpen) open(id);
		$("<span>")
			.html(text + "<br>")
			.appendTo(dialog);
	}

	function close() {
		if (!isOpen) return;
		$("<p>")
			.css("text-align", "right")
			.html("<button id='npcCloseButton'>Close</button>")
			.appendTo(dialog);
		$("#npcCloseButton").click(function () {
			if (!isOpen) return;
			win.toggle();
			isOpen = false;
			dialog.empty();
			formElements = null;
			var msg = newOutgoingMessage("CMSG_NPC_CLOSE");
			msg.write32(npcId);
			msg.send();
		});
		scroll.scrollTop(999999);
	}

	function next() {
		formElements = $("<p>")
			.html("<button id='npcNextButton'>Next</button>")
			.appendTo(dialog);
		$("#npcNextButton").click(function () {
			var msg = newOutgoingMessage("CMSG_NPC_NEXT_REQUEST");
			msg.write32(npcId);
			msg.send();
			formElements.remove();
			$("<p>").appendTo(dialog);
		});
		scroll.scrollTop(999999);
	}

	function choice(id, text) {
		if (!isOpen) open(id);
		text = text.slice(0, -1).split(":");
		var menu = "<form id='npcChoice'>"
		for (var i in text) {
			menu += "<input type='radio' id='npcChoiceRadio" + i + "' " +
				"name='npcChoiceRadio' value='" + i + "'>" +
				"<label for='npcChoiceRadio" + i + "'>" + text[i] + "</label><br>";
		}
		menu += "</form>";
		formElements = $("<p>")
			.html(menu)
			.appendTo(dialog);
		$("#npcChoice").click(function () {
			var form = document.getElementById("npcChoice");
			var choicePrint;
			var choiceNumber = null;
			if (!form.npcChoiceRadio.length) { // Only 1 radio button
				choicePrint = text[0];
				choiceNumber = 0;
			} else {
				for (var i=0; i<form.npcChoiceRadio.length; i++) {
					if (form.npcChoiceRadio[i].checked) {
						choicePrint = text[form.npcChoiceRadio[i].value];
						choiceNumber = Number(form.npcChoiceRadio[i].value);
						break;
					}
				}
			}
			if (choiceNumber === null)
				return;
			var msg = newOutgoingMessage("CMSG_NPC_LIST_CHOICE");
			msg.write32(npcId);
			msg.write8(choiceNumber + 1);
			msg.send();
			formElements.remove();
			$("<p>")
				.css("color", "green")
				.html(choicePrint)
				.appendTo(dialog);
		});
		scroll.scrollTop(999999);
	}

	function intInput() {
		formElements = $("<p>")
			.html("<input type='number' id='npcIntInput' value='0' min='0'>" +
				"<button id='npcSubmitButton'>Submit</button>")
			.appendTo(dialog);
		$("#npcSubmitButton").click(function () {
			var text = $("#npcIntInput").val().trim();
			var regex = /^[0-9]+$/;
			if (!regex.test(text))
				return;
			var amount = Number(text);
			var msg = newOutgoingMessage("CMSG_NPC_INT_RESPONSE");
			msg.write32(npcId);
			msg.write32(amount);
			msg.send();
			formElements.remove();
			$("<p>")
				.css("color", "green")
				.html(amount)
				.appendTo(dialog);
		});
		scroll.scrollTop(999999);
	}

	function strInput() {
		formElements = $("<p>")
			.html("<input type='text' id='npcStrInput'>" +
				"<button id='npcSubmitButton'>Submit</button>")
			.appendTo(dialog);
		$("#npcSubmitButton").click(function () {
			var text = $("#npcStrInput").val().trim();
			var msg = newOutgoingMessage("CMSG_NPC_STR_RESPONSE");
			msg.write32(npcId);
			msg.writeString(text);
			//msg.write8(0);
			msg.send();
			formElements.remove();
			$("<p>")
				.css("color", "green")
				.html(text)
				.appendTo(dialog);
		});
		scroll.scrollTop(999999);
	}
}
