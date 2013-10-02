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

function newIncomingMessage(arraybuffer, start, size) {
	var view = new DataView(arraybuffer, start, size);
	var pos = 0;
	return {
		read8: function () {
			return view.getUint8(pos++);
		},
		read16: function () {
			var int16 = view.getUint16(pos, true);
			pos += 2;
			return int16;
		},
		read32: function () {
			var int32 = view.getUint32(pos, true);
			pos += 4;
			return int32;
		},
		readString: function (len, cString) {
			if (!len) len = size - pos;
			var s = String.fromCharCode.apply(null, new Uint8Array(arraybuffer, start + pos, len));
			pos += len;
			if (!cString) {
				try {
					s = decodeURIComponent(escape(s));
				} catch(e) {
					console.error("Exception while reading string " + s + ": " + e);
					return "";
				}
			}
			var end = s.indexOf("\0");
			return end === -1 ? s : s.slice(0, end);
		},
		readCoordinate: function () {
			var coord = {};
			var byte0 = view.getUint8(pos++);
			var byte1 = view.getUint8(pos++);
			var byte2 = view.getUint8(pos++);
			coord.x = (byte0 << 2) | (byte1 >>> 6);
			coord.y = ((byte1 & 0x3f) << 4) | ((byte2 & 0xf0) >>> 4);
			switch (byte2 & 0x0f) {
				case 0: coord.direction = 1; break;
				case 1: coord.direction = 1; break;
				case 2: coord.direction = 2; break;
				case 3: coord.direction = 4; break;
				case 4: coord.direction = 4; break;
				case 5: coord.direction = 4; break;
				case 6: coord.direction = 8; break;
				case 7: coord.direction = 1; break;
				case 8: coord.direction = 8; break;
				default: coord.direction = 1;
			}
			return coord;
		},
		readCoordinatePair: function () {
			var ret = {};
			var byte0 = view.getUint8(pos++);
			var byte1 = view.getUint8(pos++);
			var byte2 = view.getUint8(pos++);
			var byte3 = view.getUint8(pos++);
			var byte4 = view.getUint8(pos++);
			ret.srcX = (byte1 >>> 6) | (byte0 << 2);
			ret.srcY = (byte2 >>> 4) | ((byte1 & 0x3f) << 4);
			ret.dstX = (byte3 >>> 2) | ((byte2 & 0xf) << 6);
			ret.dstY = byte4 | ((byte3 & 0x3) << 8);
			return ret;
		},
		skip: function (len) {
			pos += len;
		},
		getSize: function () {
			return size;
		},
	};
}

function newOutgoingMessage(msgName) {
	var view = new DataView(tmw.msgOutBuffer);
	var msgId = tmw.packets[msgName];
	if (!msgId) console.error("Unknown newOutgoingMessage " + msgName);
	view.setUint16(0, tmw.packets[msgName], true);
	var pos = (tmw.packet_lengths[tmw.packets[msgName]] === -1) ? 4 : 2;
	return {
		send: function () {
			var size;
			if (msgName === "CMSG_SERVER_VERSION_REQUEST") {
				size = 2;
			}
			else if (tmw.packet_lengths[tmw.packets[msgName]] === -1) {
				size = pos;
				pos = 2;
				this.write16(size);
			}
			else {
				size = tmw.packet_lengths[tmw.packets[msgName]];
			}
			var slicedBuffer = tmw.msgOutBuffer.slice(0, size);
			if (tmw.debug) console.log("<-- " + msgName);
			tmw.net.write(slicedBuffer);
		},
		write8: function (int8) {
			view.setUint8(pos++, int8);
		},
		write16: function (int16) {
			view.setUint16(pos, int16, true);
			pos += 2;
		},
		write32: function (int32) {
			view.setUint32(pos, int32, true);
			pos += 4;
		},
		writeString: function (utf16, size) {
			var utf8 = unescape(encodeURIComponent(utf16));
			var end = size ? pos + size : pos + utf8.length;
			for (var i=0; pos < end && i < utf8.length; i++, pos++) {
				view.setUint8(pos, utf8.charCodeAt(i));
			}
			for (; pos < end; pos++) {
				view.setUint8(pos, 0);
			}
		},
		writeCoordinates: function (x, y, dir) {
			console.assert(!dir);
			view.setUint8(pos++, x >>> 2);
			view.setUint8(pos++, ((x & 0x3) << 6) | (y >>> 4));
			view.setUint8(pos++, (y & 0xf) << 4);
		},
	};
}
