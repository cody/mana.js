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

tmw.handler.SMSG_ITEM_VISIBLE = function (msg) {
	var id = msg.read32();
	var itemId = msg.read16();
	msg.skip(1); // identifyFlag
	var xTile = msg.read16();
	var yTile = msg.read16();
	var amount = msg.read16();
	// var subX = msg.read8();
	// var subY = msg.read8();
	tmw.floorItems[id] = {id: id, itemId: itemId, xTile: xTile, yTile: yTile,
		x: xTile * 32, y: yTile * 32, amount: amount};
};

tmw.handler.SMSG_ITEM_DROPPED = function (msg) {
	var id = msg.read32();
	var itemId = msg.read16();
	msg.skip(1); // identifyFlag
	var xTile = msg.read16();
	var yTile = msg.read16();
	var subX = msg.read8();
	var subY = msg.read8();
	var amount = msg.read16();
	tmw.floorItems[id] = {id: id, itemId: itemId, xTile: xTile, yTile: yTile,
		x: xTile * 32, y: yTile * 32, amount: amount};
};

tmw.handler.SMSG_ITEM_REMOVE = function (msg) {
	delete tmw.floorItems[msg.read32()];
};
