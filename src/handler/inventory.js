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

tmw.handler.SMSG_PLAYER_ATTACK_RANGE = function (msg) {
	tmw.localplayer.attackRange = Math.max(2, msg.read16());
	tmw.gui.status.updateAttackRange();
};

tmw.handler.SMSG_PLAYER_INVENTORY_ADD = function (msg) {
	var index = msg.read16() - 2;
	var amount = msg.read16();
	var item = tmw.itemDB[msg.read16()];
	msg.skip(1); // identified
	msg.skip(1); // attribute
	msg.skip(1); // refine
	msg.skip(8); //for (var i = 0; i < 4; i++) cards[i] = msg.read16();
	var equipType = msg.read16();
	msg.skip(1); // itemType
	var err = msg.read8();
	if (err) {
		var text = "";
		switch (err) {
			case 2: text = "Item is too heavy."; break;
			case 4: text = "Inventory is full."; break;
			case 6: text = "Item belongs to someone else."; break;
			default: console.error("SMSG_PLAYER_INVENTORY_ADD error: " + err);
		}
		tmw.textParticle.push({
			text: text,
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "red"
		});
	} else {
		var text = amount > 1 ? (amount + " " + item.name) : item.name;
		tmw.textParticle.push({
			text: text,
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "black"
		});
		var inventoryEntry = tmw.inventory[index];
		if  (inventoryEntry && inventoryEntry.item === item)
			amount += inventoryEntry.amount;
		tmw.inventory[index] = {item: item, amount: amount, equipType: equipType};
		tmw.gui.inventory.draw();
	}
};

tmw.handler.SMSG_PLAYER_ARROW_EQUIP = function (msg) {
	var index = msg.read16() - 2;
	if (tmw.inventory[index])
		tmw.inventory[index].isEquipped = true;
	tmw.gui.inventory.draw();
};

tmw.handler.SMSG_PLAYER_INVENTORY = function (msg) {
	tmw.inventory.length = 0;
	var size = msg.getSize() / 18;
	for (var i=0; i<size; i++) {
		var index = msg.read16() - 2;
		var item = tmw.itemDB[msg.read16()];
		msg.skip(1); // itemType
		msg.skip(1); // identified
		var amount = msg.read16();
		var equipType = msg.read16(); // 0x8000 for arrow
		msg.skip(8); // cards
		tmw.inventory[index] = {item: item, amount: amount, equipType: equipType};
	}
};

tmw.handler.SMSG_PLAYER_EQUIPMENT = function (msg) {
	var size = msg.getSize() / 20;
	for (var i=0; i<size; i++) {
		var index = msg.read16() - 2;
		var item = tmw.itemDB[msg.read16()];
		msg.skip(1); // itemType
		msg.skip(1); // identified
		var equipType = msg.read16();
		var slot = msg.read16();
		msg.skip(1); // attribute
		msg.skip(1); // refine
		msg.skip(8); // cards
		tmw.inventory[index] =
			{item: item, amount: 1, equipType: equipType, isEquipped: Boolean(slot)};
		if (slot)
			tmw.localplayer.equipment[equipTypeToSlotName(slot)] = item;
	}
	tmw.gui.inventory.draw();
};

tmw.handler.SMSG_PLAYER_INVENTORY_REMOVE = function (msg) {
	var index = msg.read16() - 2;
	var amount = msg.read16();
	tmw.inventory[index].amount -= amount;
	if (tmw.inventory[index].amount === 0)
		tmw.inventory[index] = null;
	tmw.gui.inventory.draw();
};

tmw.handler.SMSG_PLAYER_INVENTORY_USE = function (msg) {
	var index = msg.read16() - 2;
	msg.skip(2); // item id
	msg.skip(4); // id
	var amount = msg.read16();
	msg.skip(1); // type
	if (amount)
		tmw.inventory[index].amount = amount;
	else
		tmw.inventory[index] = null;
	tmw.gui.inventory.draw();
};

tmw.handler.SMSG_ITEM_USE_RESPONSE = function (msg) {
	var index = msg.read16() - 2;
	var amount = msg.read16();
	if (msg.read8() === 0) {
		tmw.textParticle.push({
			text: "Failed to use item.",
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "red"
		});
	} else {
		if (amount)
			tmw.inventory[inxex].amount = amount;
		else
			tmw.inventory[inxex] = null;
		tmw.gui.inventory.draw();
	}
};

tmw.handler.SMSG_PLAYER_EQUIP = function (msg) {
	var index = msg.read16() - 2;
	var equipType = msg.read16();
	var flag = msg.read8();
	if (!flag) {
		tmw.textParticle.push({
			text: "Unable to equip.",
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "red"
		});
		return;
	}
	var slot = equipTypeToSlotName(equipType);
	if (slot)
		tmw.localplayer.equipment[slot] = tmw.inventory[index].item;
	else
		console.warn("Equip index %d type %d", index, equipType);
	tmw.inventory[index].isEquipped = true;
	tmw.gui.inventory.draw();
};

tmw.handler.SMSG_PLAYER_UNEQUIP = function (msg) {
	var index = msg.read16() - 2;
	var equipType = msg.read16();
	var flag = msg.read8();
	if (!flag) {
		tmw.textParticle.push({
			text: "Unable to unequip.",
			timeout: tmw.timeAnimation + 4000,
			being: tmw.localplayer,
			color: "red"
		});
		return;
	}
	var slot = equipTypeToSlotName(equipType);
	if (slot)
		tmw.localplayer.equipment[slot] = null;
	else
		console.warn("Unequip index %d type %d", index, equipType);
	tmw.inventory[index].isEquipped = false;
	tmw.gui.inventory.draw();
};

function equipTypeToSlotName(equipType) {
	switch (equipType) {
		case 0x001: return "bottomClothes";
		case 0x002: return "weapon";
		case 0x004: return "gloves";
		case 0x008: return "cape"; // clover
		case 0x010: return "misc1" // wedding ring
		case 0x020: return "shield";
		case 0x022: return "weapon";
		case 0x040: return "shoes";
		case 0x080: return "misc2" // gem rings
		case 0x100: return "hat";
		case 0x200: return "topClothes";
		case 0x8000: return "arrows";
		default: console.error("Unknown equipType: 0x" + equipType.toString(16));
	}
	return null;
}

tmw.handler.SMSG_PLAYER_STORAGE_STATUS = function (msg) {
	console.error("Storage not implemented");
	var usedCount = msg.read16();
	var maxSize = msg.read16();
	$("<div>")
		.html("Storage is not implemented yet!<br>You have in your Storage " +
			usedCount + " Items out of a maximum of " + maxSize + " Items.")
		.attr("title", "Storage")
		.css("display", "none")
		.dialog({ dialogClass: "no-close",
			closeOnEscape: false,
			buttons: { Quit: function() {
				$(this).dialog("close");
				newOutgoingMessage("CMSG_CLOSE_STORAGE").send();
			}
		}});
}
