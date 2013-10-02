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

function cleanOutMap() {
	tmw.beings = {};
	tmw.floorItems = {};
	tmw.gui.social.resetBeingPresent();
	tmw.gui.shop.close();
	tmw.localplayer.action = "stand";
	tmw.localplayer.speechText = null;
	tmw.localplayer.speechTimeout = null;
	tmw.selectedBeing.clear();
	tmw.textParticle.length = 0;
}

function createMaps() {
	tmw.maps = {
		loadMap: loadMap,
	};

	var cache = {};

	function loadMap(name) {
		tmw.loop.stop();
		cleanOutMap();
		var end = name.lastIndexOf(".");
		if (end !== -1) name = name.slice(0, end);
		if (cache[name]) {
			newOutgoingMessage("CMSG_MAP_LOADED").send();
			tmw.map = cache[name];
			tmw.loop.start();
			return;
		}
		tmw.map = {fileName: name, layers: [], tiles: [null]};
		cache[name] = tmw.map;
		tmw.map.fileName = name;
		name = "maps/" + name + ".tmx";
		var uint8array = tmw.zipdata[tmw.data[name]].decompress(name);
		var blob = new Blob([uint8array], {"type" : "text/xml"});
		var url = URL.createObjectURL(blob);
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.send(null);
		xhr.onload = function () {
			newOutgoingMessage("CMSG_MAP_LOADED").send();
			var layers = xhr.responseXML.getElementsByTagName("layer");
			var root = xhr.responseXML.getElementsByTagName("map")[0];
			tmw.map.width = root.attributes.width.value;
			tmw.map.height = root.attributes.height.value;
			var children = root.childNodes;
			for (var i = 0; i < children.length; i++) {
				switch (children[i].nodeName) {
				case "properties":
					var properties = children[i].childNodes;
					for (var j = 0; j < properties.length; j++) {
						if (properties[j].nodeName !== "property") continue;
						switch (properties[j].attributes.name.value) {
							case "name": tmw.map.name = properties[j].attributes.value.value; break;
							case "minimap": tmw.map.minimap = properties[j].attributes.value.value; break;
						}
					}
					break;
				case "tileset":
					var firstgid = Number(children[i].attributes.firstgid.value);
					var source = children[i].attributes.source.value.slice(3);
					if (tmw.tilesets[source]) {
						copyTiles(tmw.tilesets[source], firstgid);
					} else {
						var xhrTileset = loadXmlFromZip(source, readTileset);
						xhrTileset.name = source;
						xhrTileset.firstgid = firstgid;
					}
					break;
				case "layer":
					var name = children[i].attributes["name"].value;
					var dataset = children[i].getElementsByTagName("data")[0];
					var orginal = dataset.textContent;
					var encoding = dataset.attributes.encoding.value;
					if (encoding === "base64") {
						var string = atob(orginal.trim());
						var array = new Uint8Array(new ArrayBuffer(string.length));
						for (var pos=0; pos<string.length; pos++)
							array[pos] = string.charCodeAt(pos);
						var gunzip = new Zlib.Gunzip(array);
						var data = new Uint32Array(gunzip.decompress().buffer);
					} else { // csv
						var data = orginal.split(",");
						for (var pos=0; pos<data.length; pos++)
							data[pos] = Number(data[pos]);
					}
					tmw.map.layers.push({name: name, data: data});
					if (name === "Collision") {
						tmw.map.collision = data;
						for (var i=0; i<data.length; i++)
							if (data[i] !== 2) data[i] = 0;
					}
					break;
				}
			}
			tmw.loop.start();
		};
	}
}

function readTileset() {
	var xml = this.responseXML.getElementsByTagName("tileset")[0];
	var tileWidth = Number(xml.attributes["tilewidth"].value);
	var tileHeight = Number(xml.attributes["tileheight"].value);
	xml = this.responseXML.getElementsByTagName("image")[0];
	var mockSource = xml.attributes["source"].value.slice(3);
	// var pngWidth = Number(xml.attributes["width"].value);
	// var pngHeight = Number(xml.attributes["height"].value);
	var png = loadPngFromZip(mockSource, function () {
		var pos = 0;
		for (var y=0; y<png.height; y+=tileHeight) {
			for (var x=0; x<png.width; x+=tileWidth) {
				var canvas = document.createElement("canvas");
				canvas.width = tileWidth;
				canvas.height = tileHeight;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(this, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
				this.tileset[pos++] = canvas;
			}
		}
		copyTiles(this.tileset, this.firstgid);
	});
	png.firstgid = this.firstgid;
	png.tileset = [];
	tmw.tilesets[this.name] = png.tileset;
}

function copyTiles(cache, firstgid) {
	for (var i=0; i<cache.length; i++) tmw.map.tiles[i + firstgid] = cache[i];
}
