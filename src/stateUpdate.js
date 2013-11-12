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

tmw.state.STATE_UPDATE = function () {
	var resources = [];
	var http = new XMLHttpRequest();
	var filesystem;
	var zipname, zipnameCatch;
	
	window.webkitRequestFileSystem(window.PERSISTENT, 1000000000, onInitFs, fileSystemError);
	
	function onInitFs(ret) {
		filesystem = ret;
		console.log('Opened file system: ' + filesystem.name);
		navigator.webkitPersistentStorage.queryUsageAndQuota( 
			function(used, remaining) {
				console.log("Used quota: " + used + ", remaining quota: " + remaining);
			}, fileSystemError);
			
		// Download remote xml
		tmw.gui.update.setText("Loading remote resources.xml");
		http.open("GET", tmw.net.updateHost + "/resources.xml?" + Date.now(), true);
		http.onloadend = onRemoteResources;
		http.send(null);
	}

	function onRemoteResources() {
		if (http.status === 200) {
			filesystem.root.getFile("resources.xml", {create: true},
				writeXmlToFilesystem1, fileSystemError);
		}
		else {
			$("<div>").html("<p>Could not load remote resources.xml.<br>" +
				"Trying to use cached data instead.</p>"+
				"<p>Error was " + http.status + ": " + http.statusText + "</p>")
				.attr("title", "Warning")
				.dialog({modal: true});
			console.error("Error loading remote resources.xml " + http.status + ": " + http.statusText);
			tmw.gui.update.setText("Loading local resources.xml");
			filesystem.root.getFile("resources.xml", {create: false}, 
				onLocalResources, onLocalResources);
		}
	}
	
	function writeXmlToFilesystem1(fileEntry) {
		fileEntry.createWriter(writeXmlToFilesystem2, fileSystemError);
	}
	
	function writeXmlToFilesystem2(fileWriter) {
		fileWriter.onwriteend = function(e) {
			console.log("Write of resouces.xml to local filesystem completed.");
		};

		fileWriter.onerror = function(e) {
			console.error("Write of resouces.xml to local filesystem failed: " + e);
		};

		var blob = new Blob([http.responseText], {type: "text/plain"});
		fileWriter.write(blob);
		readResourcesXml(http.responseXML);
	}
	
	function onLocalResources(fileEntry) {
		if (!fileEntry.fullPath) {
			var html = document.getElementById("wallpaper");
			html.innerHTML += "Not found<br><b>Fatal Error: Can't access resources.xml</b>";
			return;
		}
		fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var parser = new DOMParser();
					var xml = parser.parseFromString(this.result, "text/xml");
					readResourcesXml(xml);
				};
				reader.readAsText(file);
			}, 
			function() {console.error("Error for local resources.xml doing fileEntry.file");}
		)
	}
	
	function readResourcesXml(xml) {
		if (!xml) {
			tmw.net.fatalError("resources.xml is invalid");
			return;
		}
		var updates = xml.getElementsByTagName("updates")[0].childNodes;
		for (var i = 0; i < updates.length; i++) {
			if (updates[i].nodeName !== "update") {
				continue;
			}
			if (updates[i].attributes["type"].value === "data") {
				resources.push(updates[i].attributes["file"].value);
			}
		}
		tmw.gui.update.setMax(resources.length);
		loadUpdates();
	}
	
	function loadUpdates() {
		if (resources.length === 0) {
			tmw.gui.update.next("Loading data ...");
			tmw.state.set("STATE_LOAD_DATA");
			return;
		}
		zipname = resources.shift();
		tmw.gui.update.next(zipname);
		filesystem.root.getFile(zipname, {create: false}, onLocalZip, onLocalZip);
	}
	
	function onLocalZip(fileEntry) {
		if (fileEntry.fullPath) {
			fileEntry.file(function(file) {
					var reader = new FileReader();
					reader.onloadend = function() {
						readZipData(new Uint8Array(this.result));
					};
					reader.readAsArrayBuffer(file);
				}, 
				function() {console.error("Error for local "+zipname+" doing fileEntry.file");}
			)			
		}
		else {
			downloadRemoteZip();
		}
	}
	
	function downloadRemoteZip() {
		var z = tmw.net.updateHost + "/" + zipname;
		http = new XMLHttpRequest();
		http.open("GET", z, true);
		http.responseType = "arraybuffer";
		http.onloadend = onRemoteZip;
		http.send(null);
	}
	
	function onRemoteZip() {
		if (http.status === 200) {
			filesystem.root.getFile(zipname, {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {console.log('Write completed.');};
					fileWriter.onerror = function(e) {console.log('Write failed: ' + e.toString());};
					var blob = new Blob([http.response], {"type": "arraybuffer"})
					fileWriter.write(blob);
					var uint8array = new Uint8Array(http.response);
					readZipData(uint8array);
					}, fileSystemError);
				}, fileSystemError
			);
		}
		else {
			var html = document.getElementById("wallpaper");
			html.innerHTML += "<b>Fatal Error " + http.status + ": " + http.statusText + "</b><br>";
		}
	}
	
	function readZipData(uint8array) {
		var unzip = new Zlib.Unzip(uint8array);
		tmw.zipdata.push(unzip);
		try {
			var filenames = unzip.getFilenames();
		}
		catch(e) {
			if (zipnameCatch === zipname) throw(e);
			zipnameCatch = zipname;
			downloadRemoteZip();
			return;
		}
		for (var i = 0; i<filenames.length; i++) {
			tmw.data[filenames[i]] = tmw.zipdata.length - 1;
		}
		loadUpdates();
	}
	
	function fileSystemError(e) {
		var text;
		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				text = "QUOTA_EXCEEDED_ERR";
				break;
			case FileError.NOT_FOUND_ERR:
				text = "NOT_FOUND_ERR";
				break;
			case FileError.SECURITY_ERR:
				text = "SECURITY_ERR";
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				text = "INVALID_MODIFICATION_ERR";
				break;
			case FileError.INVALID_STATE_ERR:
				text = "INVALID_STATE_ERR";
				break;
			default:
				text = "Unknown Error";
				break;
		};
		console.error("File System Error: " + text);
	}
}
