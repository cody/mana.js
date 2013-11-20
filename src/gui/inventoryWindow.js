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

function createInventoryWindow() {
	tmw.gui.inventory = {
		toggle: toggle,
		updateWeight: updateWeight,
		updateWeightMax: updateWeightMax,
		draw: draw,
	};

	var isOpen = false;
	var selectedItemIndex = null;
	var itemsPerLine;

	var win = $("<div>")
		.attr("id", "inventoryWindow")
		.css("position", "absolute")
		.css("width", 356)
		.css("height", 200)
		.css("right", 0)
		.css("top", 24)
		.css("background", "grey")
		.html("<div id='inventoryWindowHandle'></div>" +
			"<span style='margin-left:4px;;'>Inventory</span>" +
			"<div id='weightBar'></div>" +
			"<div id='slotBar'></div>" +
			"<div id='inventoryWindowScroll'>" +
			"<canvas id='inventoryWindowItems'></canvas></div>" +
			"<button id='inventoryWindowUseButton'>Use</button>" +
			"<button id='inventoryWindowDropButton'>Drop</button>")
		.hide()
		.appendTo("#game");
	win.resizable({resize: resizeInventory, containment: "#game",
		minWidth: 265, minHeight: 150});
	win.draggable({handle: "#inventoryWindowHandle",
		containment: "#game"});
	$("#inventoryWindowHandle")
		.css("position", "absolute")
		.css("width", "100%")
		.css("height", 42);
	$("#weightBar")
		.css("position", "absolute")
		.css("left", 3)
		.css("top", 20)
		.css("width", 150)
		.css("height", 18)
		.html("<span id='weightBarLabel' style='position:absolute; width:100%;" +
			"text-align:center; top:2px'></span>")
		.progressbar();
	$("#slotBar")
		.css("position", "absolute")
		.css("left", 158)
		.css("top", 20)
		.css("width", 100)
		.css("height", 18)
		.html("<span id='slotBarLabel' style='position:absolute; width:100%;" +
			"text-align:center; top:2px'></span>")
		.progressbar();
	$("#inventoryWindowScroll")
		.css("position", "absolute")
		.css("width", "100%")
		.css("height", win.height() - 70)
		.css("top", 43)
		.css("left", 0)
		.css("background", "White")
		.css("overflow-y", "scroll")
		.css("overflow-x", "hidden")
		.click(onItemClick);
	$("#inventoryWindowItems")
		.attr("width", win.width() - 16)
		.attr("height", win.height() - 70)
		.css("background", "white");
	var context = document.getElementById("inventoryWindowItems").getContext("2d");
	var useButton = $("#inventoryWindowUseButton")
		.css("position", "absolute")
		.css("bottom", 1)
		.css("right", 61)
		.click(onUseButtonClick);
	var dropButton = $("#inventoryWindowDropButton")
		.css("position", "absolute")
		.css("bottom", 1)
		.css("right", 15)
		.click(onDropButtonClick);

	function resizeInventory(event, ui) {
		$("#inventoryWindowItems")
			.attr("width", win.width() - 16)
			.attr("height", win.height() - 70);
		tmw.gui.inventory.draw();
	}

	function onItemClick(event) {
		var x = Math.floor(event.offsetX / 34);
		var y = Math.floor(event.offsetY / 43);
		var index = y * itemsPerLine + x;
		selectedItemIndex = index < tmw.inventory.length ? index : null;
		tmw.gui.inventory.draw();
	}

	function onUseButtonClick() {
		if (selectedItemIndex !== null && tmw.inventory[selectedItemIndex]) {
			if (tmw.inventory[selectedItemIndex].equipType) {
				if (tmw.inventory[selectedItemIndex].isEquipped) {
					var msg = newOutgoingMessage("CMSG_PLAYER_UNEQUIP");
					msg.write16(selectedItemIndex + 2);
					msg.send();
				} else {
					var msg = newOutgoingMessage("CMSG_PLAYER_EQUIP");
					msg.write16(selectedItemIndex + 2);
					msg.write16(0);
					msg.send();
				}
			} else {
				var msg = newOutgoingMessage("CMSG_PLAYER_INVENTORY_USE");
				msg.write16(selectedItemIndex + 2);
				msg.write32(0); // item id
				msg.send();
			}
		}
	}

	function onDropButtonClick() {
		if (!tmw.net.packetLimiter("CMSG_PLAYER_INVENTORY_DROP")) return;
		if (selectedItemIndex !== null && tmw.inventory[selectedItemIndex]) {
			var msg = newOutgoingMessage("CMSG_PLAYER_INVENTORY_DROP");
			msg.write16(selectedItemIndex + 2);
			msg.write16(1);
			msg.send();
		}
	}

	function toggle() {
		win.toggle();
		isOpen = !isOpen;
		if (isOpen) draw();
	}

	function updateWeight() {
		$("#weightBar").progressbar("value", tmw.localplayer.attributes.weight);
		$("#weightBarLabel").text(
			(tmw.localplayer.attributes.weight / 1000) + "kg/" +
			(tmw.localplayer.attributes.weightMax / 1000) + "kg"
		);
		var progressbarValue = $("#weightBar").find(".ui-progressbar-value");
		if (0.5 > tmw.localplayer.attributes.weight / tmw.localplayer.attributes.weightMax)
			progressbarValue.css({"background": "green"});
		else
			progressbarValue.css({"background": "red"});
	}

	function updateWeightMax() {
		$("#weightBar").progressbar("option", "max", tmw.localplayer.attributes.weightMax);
		updateWeight();
	}

	function draw() {
		if (!isOpen) return;
		if (selectedItemIndex !== null && !tmw.inventory[selectedItemIndex])
			selectedItemIndex = null;
		if (selectedItemIndex !== null) {
			useButton.attr("disabled", false);
			dropButton.attr("disabled", false);
			if (tmw.inventory[selectedItemIndex].equipType) {
				if (tmw.inventory[selectedItemIndex].isEquipped)
					useButton.text("Unequip");
				else
					useButton.text("Equip");
			} else if (tmw.inventory[selectedItemIndex].item.type === "usable") {
				useButton.text("Use");
			} else {
				useButton.attr("disabled", true);
			}
		} else {
			useButton.attr("disabled", true);
			dropButton.attr("disabled", true);
		}
		itemsPerLine = Math.floor((win.width() - 16) / 34);
		$("#inventoryWindowScroll").css("height", win.height() - 70)
		$("#inventoryWindowItems")
			.attr("width", win.width() - 16)
			.attr("height", Math.ceil(tmw.inventory.length / itemsPerLine) * 43);
		context.font = "9pt sans-serif";
		context.textAlign = "center";
		var usedSlots = 0;
		for (var i in tmw.inventory) if (tmw.inventory[i]) usedSlots++;
		$("#slotBar").progressbar("value", usedSlots);
		$("#slotBarLabel").text(usedSlots + "/100");
		for (var i in tmw.inventory) {
			var inv = tmw.inventory[i];
			if (inv === null) continue;
			var left = (i % itemsPerLine) * 34;
			var top = Math.floor(i / itemsPerLine) * 43;
			context.drawImage(inv.item.image, left, top);
			var text = "";
			if (!inv.equipType || inv.equipType === 0x8000) {
				if (inv.amount > 1) text = inv.amount;
			} else if (inv.isEquipped) {
				text = "Eq.";
			}
			context.fillText(text, left + 16, top + 41);
		}
		if (selectedItemIndex !== null) {
			if (selectedItemIndex < tmw.inventory.length) {
				context.strokeStyle = "blue";
				left = (selectedItemIndex % itemsPerLine) * 34;
				top = Math.floor(selectedItemIndex / itemsPerLine) * 43;
				context.strokeRect(left, top, 32, 32);
			} else {
				selectedItemIndex = null;
			}
		}
	}
}
