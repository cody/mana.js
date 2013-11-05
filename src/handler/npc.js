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

tmw.handler.SMSG_NPC_MESSAGE = function (msg) {
	var npcId = msg.read32();
	var text = htmlToText(msg.readString());
	tmw.gui.npc.message(npcId, text);
};

tmw.handler.SMSG_NPC_CLOSE = function (msg) {
	// var id = msg.read32();
	tmw.gui.npc.close();
};

tmw.handler.SMSG_NPC_NEXT = function (msg) {
	// var id = msg.read32();
	tmw.gui.npc.next();
};

tmw.handler.SMSG_NPC_CHOICE = function (msg) {
	var id = msg.read32();
	var text = htmlToText(msg.readString());
	tmw.gui.npc.choice(id, text);
};

tmw.handler.SMSG_NPC_INT_INPUT = function (msg) {
	// var id = msg.read32();
	tmw.gui.npc.intInput();
};

tmw.handler.SMSG_NPC_STR_INPUT = function (msg) {
	// var id = msg.read32();
	tmw.gui.npc.strInput();
};

tmw.handler.SMSG_NPC_BUY_SELL_CHOICE = function (msg) {
	var npcId = msg.read32();
	if (tmw.gui.shop.getNpcId === npcId)
		return;
	else if (tmw.gui.shop.getNpcId() !== null)
		tmw.gui.shop.close();
	tmw.gui.shop.open(npcId);
};

tmw.handler.SMSG_NPC_BUY = function (msg) {
	var table = $("<table>");
	var count = msg.getSize() / 11;
	for (var i=0; i<count; i++) {
		var price = msg.read32();
		msg.skip(4); // DCvalue
		msg.skip(1); // type
		var itemId = msg.read16();
		var row = $("<tr>")
			.attr("id", "showContentRow" + i)
			.attr("itemId", itemId)
			.attr("price", price)
			.click(function (event) {tmw.gui.shop.selectRow(event.currentTarget);})
			.html("<td>" + tmw.itemDB[itemId].name + "</td>" +
				"<td align='right'>" + price + " GP</td>")
			.appendTo(table);
	}
	tmw.gui.shop.setBuyTable(table);
};

tmw.handler.SMSG_NPC_SELL = function (msg) {
	var table = $("<table>");
	var count = msg.getSize() / 10;
	for (var i=0; i<count; i++) {
		var slot = msg.read16() - 2;
		var price = msg.read32();
		msg.skip(4); // OCvalue
		var inv = tmw.inventory[slot];
		if (inv.isEquipped)
			continue;
		var row = $("<tr>")
			.attr("id", "showContentRow" + i)
			.attr("itemId", inv.item.id)
			.attr("slot", slot)
			.attr("price", price)
			.click(function (event) {tmw.gui.shop.selectRow(event.currentTarget);})
			.html("<td align='right'>" + inv.amount + "</td>" +
				"<td>" + inv.item.name + "</td>" +
				"<td align='right'>" + price + " GP</td>")
			.appendTo(table);
	}
	tmw.gui.shop.setSellTable(table);
};

tmw.handler.SMSG_NPC_BUY_RESPONSE = function (msg) {
	if (msg.read8() === 0)
		; // console.log("Thanks for buying.");
	else
		tmw.gui.shop.errorResponse("Unable to buy.");
};

tmw.handler.SMSG_NPC_SELL_RESPONSE = function (msg) {
	if (msg.read8() === 0)
		; // console.log("Thanks for selling.");
	else
		tmw.gui.shop.errorResponse("Unable to sell.");
};
