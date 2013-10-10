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

function createCharSelectWindow() {
	tmw.gui.charSelect = {
		addChoice: addChoice,
		draw: draw,
		charCreationFailed: function (text) {$("#charCreationInfoText").text(text);},
	};

	var choices = {};
	var blankChar = {type: "PLAYER", equipment: {}, x: 48, y: 65, direction: 8};
	var selectedSlot;
	var animationId = null;
	var rotateNextTime = 0;

	function addChoice(character) {
		choices[character.slot] = character;
		if (tmw.secret && tmw.secret.character === character.name) {
			var msg = newOutgoingMessage("CMSG_CHAR_SELECT");
			msg.write8(character.slot);
			msg.send();
			tmw.localplayer = character;
		}
	}

	function draw() {
		for (var i in choices) {
			drawChoices();
			return;
		}
		drawCreate();
	}

	var wallpaper = $("#wallpaper");
	var win = $("<div>")
		.css("position", "absolute")
		.width(288)
		.height(288)
		.css("left", Math.floor(wallpaper.width() / 2) - 140)
		.css("top", Math.floor(wallpaper.height() / 2) - 140)
		.css("font-size", "11pt")
		.css("background", "Bisque")
		.text("Fetching characters...");
	wallpaper.html(win);

	function drawChoices() {
		var canvas = document.createElement("canvas");
		canvas.width = win.width();
		canvas.height = win.height();
		win.css("padding", 0)
		win.html(canvas);
		canvas.onclick = function (event) {
			stopAnimation();
			var x = Math.floor(event.offsetX / 96);
			var y = Math.floor(event.offsetY / 96);
			selectedSlot = y * 3 + x;
			for (var i in choices){
				if (choices[i].slot === selectedSlot) {
					tmw.localplayer = choices[i];
					var msg = newOutgoingMessage("CMSG_CHAR_SELECT");
					msg.write8(choices[i].slot);
					msg.send();
					win.html("Sending selected character to server...");
					return;
				}
			}
			drawCreate();
		};
		tmw.context = canvas.getContext("2d");
		animationId = window.requestAnimationFrame(runAnimationChoices);
	}

	function drawCreate() {
		win.css("padding", 4)
		win.html(
			"Name: <input id='charCreationName' autofocus='autofocus'><br>" +
			"Hair style: <select id='charCreationStyle'> </select><br>" +
			"Hair color: <select id='charCreationColor'> </select><br>" +
			"<table>" +
			"<tr><td>Strength:</td>" +
			"<td><input type='range' id='charCreationStr' style='width:90px' min='1' max='9' value='9'></td>" +
			"<td id='charCreationStrValue'>9</td></tr>" +
			"<tr><td>Agility:</td>" +
			"<td><input type='range' id='charCreationAgi' style='width:90px' min='1' max='9' value='1'></td>" +
			"<td id='charCreationAgiValue'>1</td></tr>" +
			"<tr><td>Vitality:</td>" +
			"<td><input type='range' id='charCreationVit' style='width:90px' min='1' max='9' value='9'></td>" +
			"<td id='charCreationVitValue'>9</td></tr>" +
			"<tr><td>Intelligence:</td>" +
			"<td><input type='range' id='charCreationInt' style='width:90px' min='1' max='9' value='1'></td>" +
			"<td id='charCreationIntValue'>1</td></tr>" +
			"<tr><td>Dexterity:</td>" +
			"<td><input type='range' id='charCreationDex' style='width:90px' min='1' max='9' value='9'></td>" +
			"<td id='charCreationDexValue'>9</td></tr>" +
			"<tr><td>Luck:</td>" +
			"<td><input type='range' id='charCreationLuk' style='width:90px' min='1' max='9' value='1'></td>" +
			"<td id='charCreationLukValue'>1</td></tr>" +
			"</table>" +
			"<p id='charCreationInfoText' style='color:red'></p>"
		);
		document.getElementById("charCreationName").oninput = checkValues;
		document.getElementById("charCreationStr").onchange = onChangeRange;
		document.getElementById("charCreationAgi").onchange = onChangeRange;
		document.getElementById("charCreationVit").onchange = onChangeRange;
		document.getElementById("charCreationInt").onchange = onChangeRange;
		document.getElementById("charCreationDex").onchange = onChangeRange;
		document.getElementById("charCreationLuk").onchange = onChangeRange;
		var charCreateButtons = $("<div>")
			.css("position", "absolute")
			.css("right", 4)
			.css("bottom", 4)
			.appendTo(win);
		$("<button>")
			.attr("id", "charCreateCancel")
			.text("Cancel")
			.click(function () {
					stopAnimation();
					drawChoices();
				})
			.appendTo(charCreateButtons);
		$("<button>")
			.attr("id", "charCreateCreate")
			.text("Create")
			.click(function () {
					$("#charCreateCreate").attr("disabled", true);
					var msg = newOutgoingMessage("CMSG_CHAR_CREATE");
					var name = $("#charCreationName").val().trim();
					msg.writeString(name, 24);
					msg.write8($("#charCreationStr").val());
					msg.write8($("#charCreationAgi").val());
					msg.write8($("#charCreationVit").val());
					msg.write8($("#charCreationInt").val());
					msg.write8($("#charCreationDex").val());
					msg.write8($("#charCreationLuk").val());
					msg.write8(selectedSlot);
					msg.write16(document.getElementById("charCreationColor").selectedIndex);
					msg.write16(document.getElementById("charCreationStyle").selectedIndex);
					msg.send();
					$("#charCreationInfoText").text("Creating character...");
				})
			.appendTo(charCreateButtons);
		checkValues();

		var selectStyle = document.getElementById("charCreationStyle");
		selectStyle.add(new Option(["Skinhead"]));
		for (var i in tmw.hairStyleDB) {
			selectStyle.add(new Option([tmw.hairStyleDB[i].name]));
		}
		selectStyle.selectedIndex = Math.random() * (selectStyle.length - 1);
		selectStyle.onchange = function () {
			blankChar.equipment.hairStyle = selectStyle.selectedIndex;
			updateHair(blankChar);
		}

		var selectColor = document.getElementById("charCreationColor");
		for (var i in tmw.hairColorDB) {
			if (i >= 12) break;
			selectColor.add(new Option([tmw.hairColorDB[i].name]));
		}
		selectColor.selectedIndex = Math.random() * (selectColor.length - 1);
		selectColor.onchange = function () {
			blankChar.equipment.hairColor = selectColor.selectedIndex;
			updateHair(blankChar);
		}

		var canvas = document.createElement("canvas");
		canvas.width = 96;
		canvas.height = 96;
		canvas.style.position = "absolute";
		canvas.style.right = 0;
		canvas.style.top = "96px";
		win.append(canvas);
		var context = canvas.getContext("2d");
		tmw.context = context;
		blankChar.sex = tmw.net.token.sex;
		blankChar.equipment.topClothes = tmw.itemDB[1202];
		blankChar.equipment.bottomClothes = tmw.itemDB[881];
		selectColor.dispatchEvent(new Event("change"));
		selectStyle.dispatchEvent(new Event("change"));
		animationId = window.requestAnimationFrame(runAnimationCreate);
	}

	function stopAnimation() {
		window.cancelAnimationFrame(animationId);
		animationId = null;
	}

	function runAnimationChoices(timeAnimation) {
		animationId = window.requestAnimationFrame(runAnimationChoices);
		var context = tmw.context;
		context.clearRect(0, 0, win.width(), win.height());
		context.beginPath();
		context.strokeStyle = "#947356";
		context.moveTo(96, 0); context.lineTo(96, 288);
		context.moveTo(192, 0); context.lineTo(192, 288);
		context.moveTo(0, 96); context.lineTo(288, 96);
		context.moveTo(0, 192); context.lineTo(288, 192);
		context.stroke();
		context.font = "9pt sans-serif";
		context.textAlign = "center";
		context.textBaseline = "bottom";
		for (var slot=0; slot<9; slot++) {
			var index = null;
			for (var i in choices){
				if (choices[i].slot === slot) {
					index = i;
					break;
				}
			}
			var left = (slot * 96) % 288 + 48;
			var top = Math.floor(slot / 3) * 96;
			if (index !== null) {
				choices[index].x = left;
				choices[index].y = top + 65;
				var text = choices[index].nameInsecure;
			} else {
				text = "create";
			}
			context.fillText(text, left, top + 94);
		}
		for (var i in choices) {
			drawSprites(choices[i], 0, 0, 0);
		}
	}

	function runAnimationCreate(timeAnimation) {
		animationId = window.requestAnimationFrame(runAnimationCreate);
		tmw.context.clearRect(0, 0, 96, 96);
		if (timeAnimation > rotateNextTime) {
			rotateNextTime = timeAnimation + 1000;
			if (blankChar.direction === 8)
				blankChar.direction = 1;
			else
				blankChar.direction *= 2;
		}
		drawSprites(blankChar, 0, 0, 0);
	}

	function onChangeRange(event) {
		$("#" + event.target.attributes.id.value + "Value").text(event.target.value);
		checkValues();
	}

	function checkValues() {
		var name = $("#charCreationName").val().trim();
		var sum =
			Number($("#charCreationStr").val()) +
			Number($("#charCreationAgi").val()) +
			Number($("#charCreationVit").val()) +
			Number($("#charCreationInt").val()) +
			Number($("#charCreationDex").val()) +
			Number($("#charCreationLuk").val());
		var text = "";
		if (name === "")
			text = "Please choose a name";
		else if (name.length < 4)
			text = "Name too short";
		else if (name.length > 23)
			text = "Name too long";
		else if (sum < 30)
			text = "Please distribute " + (30 - sum) + " Point" +
				((30 - sum) === 1 ? "" : "s");
		else if (sum > 30)
			text = "Please remove " + (sum - 30) + " Point" +
				((sum - 30) === 1 ? "" : "s");
		$("#charCreationInfoText").text(text);
		$("#charCreateCreate").attr("disabled", text !== "");
	}
}
