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

function createShopWindow() {
	tmw.gui.shop = {
		open: open,
		close: close,
		getNpcId: function () { return npcId; },
		setBuyTable: function (table) { content.html(table); },
		setSellTable: function (table) { content.html(table); },
		selectRow: selectRow,
		errorResponse: errorResponse,
	};

	var isOpen = false;
	var npcId = null;
	var selected =  null;
	var price = null;
	var money = null;
	var max = null;
	var amount = 0;

	var win = $("<div>")
		.attr("id", "shopWindow")
		.css("position", "absolute")
		.css("width", 300)
		.css("height", 270)
		.css("left", 3)
		.css("top", 26)
		.hide()
		.css("background", "Bisque")
		.html("<div id='shopWindowTitle'>" +
			"<span id='shopWindowName' style='margin:4px;'>" +
			"</span></div>" +
			"<div>" +
			"<button id='shopBuyRadio'>Buy</button>" +
			"<button id='shopSellRadio'>Sell</button>" +
			"<button id='shopCloseButton'>Close</button>" +
			"</div>" +
			"<div id='shopContent'>Loading...</div>" +
			"<div id='shopControls'>" +
			"<div id='shopControlsTop'>" +
			"<button id='shopMinusButton'>-</button>" +
			"<input type='range' id='shopRange' min='1' value='1' disabled='true'>" +
			"<button id='shopPlusButton'>+</button>" +
			"</div>" +
			"<div id='shopControlsMiddle'>" +
			"Amount: <input id='shopAmountInput' size='5'> / " +
			"<span id='shopAmountMax'>0</span>" +
			"</div>" +
			"<div>Price: <span id='shopTotalPrice'></span>" +
			"<button id='shopActionButton'>Buy</button></div></div>")
		.appendTo("#game");
	win.resizable({resize: resize, containment: "#game",
		minWidth: 200, minHeight: 150});
	win.draggable({handle: "#shopWindowTitle", containment: "#game"});
	$("#shopWindowTitle")
		.css("background", "SpringGreen");
	$("#shopBuyRadio").click(function () {
		if (isOpen === "buy") return;
		isOpen = "buy";
		$("#shopBuyRadio").css("background", "SpringGreen");
		$("#shopSellRadio").css("background", "White");
		money = tmw.localplayer.attributes.money;
		update();
		content.text("Loading...");
		$("#shopActionButton").text("Buy");
		var msg = newOutgoingMessage("CMSG_NPC_BUY_SELL_REQUEST");
		msg.write32(npcId);
		msg.write8(0); // Buy
		msg.send();
	});
	$("#shopSellRadio").click(function () {
		if (isOpen === "sell") return;
		isOpen = "sell";
		$("#shopSellRadio").css("background", "SpringGreen");
		$("#shopBuyRadio").css("background", "White");
		update();
		content.text("Loading...");
		$("#shopActionButton").text("Sell");
		var msg = newOutgoingMessage("CMSG_NPC_BUY_SELL_REQUEST");
		msg.write32(npcId);
		msg.write8(1); // Sell
		msg.send();
	});
	$("#shopCloseButton")
		.css("float", "right")
		.click(function () { close(); });
	var content = $("#shopContent")
		.css("background", "White")
		.css("overflow-y", "scroll");
	var minusButton = $("#shopMinusButton")
		.click(function () { update(amount - 1); });
	var range = $("#shopRange")
		.change(function () { update(Number(range.val())); });
	var plusButton = $("#shopPlusButton")
		.click(function () { update(amount + 1); });
	$("#shopAmountInput")
		.keydown(function (event) { event.stopPropagation(); })
		.keypress(function (event) {
			if (!max || event.which < 48 || event.which > 57)
				return false;
			})
		.on("input", function () { update(Number($("#shopAmountInput").val())); });
	$("#shopActionButton")
		.css("float", "right")
		.click(function () {
			if (isOpen === "buy") {
				var msg = newOutgoingMessage("CMSG_NPC_BUY_REQUEST");
				msg.write16(amount);
				msg.write16(Number(selected.attributes.itemId.value));
				msg.send();
				money -= price * amount;
				max = Math.min(Math.floor(money / price), 30000);
				update(1);
			} else if (isOpen === "sell") {
				var msg = newOutgoingMessage("CMSG_NPC_SELL_REQUEST");
				msg.write16(Number(selected.attributes["slot"].value) + 2);
				msg.write16(amount);
				msg.send();
				if (amount === max) {
					selected.remove();
					update();
				} else {
					var tdAmount = selected.getElementsByTagName("td")[0];
					max = tdAmount.innerText - amount;
					tdAmount.innerText = max;
					update(1);
				}
			}
		});

	function resize() {
		content.css("height", win.height() - 150);
		var rangeWidth = win.width() - minusButton.outerWidth() -
			plusButton.outerWidth() - 16;
		range.css("width", rangeWidth);
	}

	function open(id) {
		console.assert(!isOpen);
		npcId = id;
		$("#shopBuyRadio").trigger("click");
		var name = tmw.beings[npcId] ? tmw.beings[npcId].name : null;
		$("#shopWindowName").text(name ? name : "Shop");
		win.toggle();
		resize();
	}

	function close(id) {
		if (!isOpen) return;
		if (id && id !== npcId) return;
		npcId = null;
		update();
		win.toggle();
		isOpen = false;
	}

	function errorResponse(text) {
		if (!isOpen) return;
		isOpen = "error";
		$("#shopBuyRadio").css("background", "White");
		$("#shopSellRadio").css("background", "White");
		$("#shopContent").html("<h3 style='color:red'>Error: " + text + "</h3>");
		update();
	}

	function selectRow(row) {
		if (row === selected)
			return;
		if (selected)
			selected.style.background = "White";
		selected = row;
		selected.style.background = "Khaki";
		price = selected.attributes["price"].value;
		switch (isOpen) {
			case "buy":
				max = Math.min(Math.floor(money / price), 30000);
				break;
			case "sell":
				max = Number(selected.getElementsByTagName("td")[0].innerText);
				break;
			default: console.error("Unknown isOpen");
		}
		$("#shopAmountMax").text(max);
		range
			.attr("max", max)
			.attr("disabled", false);
		update(1);
	}

	function update(newAmount) {
		if (typeof(newAmount) !== "number") {
			selected = null;
			amount = 0;
			range.val(1).attr("disabled", true);
			$("#shopAmountInput").val("");
			$("#shopAmountMax").text("");
			$("#shopTotalPrice").text("");
			return;
		}
		if (!selected)
			return;
		if (newAmount < 0)
			amount = 0;
		else if (newAmount > max)
			amount = max;
		else
			amount = newAmount;
		range.val(amount);
		range.attr("max", max);
		$("#shopAmountInput").val(amount ? amount : "");
		$("#shopAmountMax").text(max);
		$("#shopTotalPrice").text((price * amount) + " GP" );
	}
}
