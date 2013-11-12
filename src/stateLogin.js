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

function stateLogin() {
	var serverList = {
		"server.themanaworld.org:6901": {
			name: "The Mana World",
			hostname: "server.themanaworld.org",
			port: 6901},
		"caliban.homeip.net:6901": {
			name: "Testing Server",
			hostname: "caliban.homeip.net",
			port: 6901},
		"127.0.0.1:6901": {
			name: "Localhost",
			hostname: "127.0.0.1",
			port: 6901},
	};
	var serverListIndex = "server.themanaworld.org:6901";
	var db;

	var dbRequest = indexedDB.open("serverlist", 1);
	dbRequest.onerror = dbError;
	dbRequest.onupgradeneeded = function (event) {
		db = event.target.result;
		if (!db.objectStoreNames.contains("serverlist"))
			db.createObjectStore("serverlist");
	};
	dbRequest.onsuccess = function (event) {
		db = dbRequest.result;
		db.onerror = dbError;
		loadServerSettings();
	};

	$("#wallpaper").html(
		"<form id='loginForm'>" +
		"<a id='signUpLink' href='http://www.themanaworld.org/registration.php' target='_blank'>Sign-up</a><br>" +
		"<label for='formName'>Name</label>" +
		"<input type='text' id='formName' class='ui-widget-content ui-corner-all'>" +
		"<label for='formPassword'>Password</label>" +
		"<input type='password' id='formPassword' class='ui-widget-content ui-corner-all'>" +
		"<button id='connectButton'>Play</button>" +
		"</form>" +
		"<div id='loginVersion'></div>");
	$("#loginForm>input")
		.css("display", "block")
		.css("width", "95%")
		.css("margin-bottom", ".5em");
	$("#loginForm>a")
		.css("font-weight", "bold")
		.css("float", "right")
		.css("text-decoration", "none")
		.css("color", "green")
		.css("font-family", "monospace")
		.css("font-size", "12pt");
	$("#connectButton")
		.css("color", "Brown")
		.click(function (event) {
			event.preventDefault();
			var server = serverList[serverListIndex];
			var host = server.hostname;
			var port = server.port;
			var name = document.getElementById("formName").value;
			var password = document.getElementById("formPassword").value;
			var character = serverList[serverListIndex].character || "";
			$("#loginForm").dialog("close");
			console.log("Server: " + host + ", Port: " + port + ", Account: " + name);
			tmw.net.loginData = {name: name, password: password, character: character};
			tmw.state.set("STATE_LOGIN_ATTEMPT", {server: host, port: port});})
		.button();
	$("#loginForm").dialog({width: 280, dialogClass: "no-close"});

	$("#loginVersion")
		.css("position", "absolute")
		.css("bottom", 0)
		.css("right", 0)
		.text(chrome.runtime.getManifest().version);

	$("<canvas>")
			.attr("id", "loginSettingsButton")
			.attr("width", 20)
			.attr("height", 18)
			.css("position", "absolute")
			.css("top", 3)
			.css("right", 3)
			.css("margin", 0)
			.appendTo("#wallpaper")
			.button()
			.click(openLoginSettingsWindow);
		var context = document.getElementById("loginSettingsButton").getContext("2d");
		var img = new Image();
		img.src = "graphics/button-icon-setup.png";
		img.onload = function () {
			context.drawImage(img, 20, 0, 20, 18, 0, 0, 20, 18);
		};

	function loadServerSettings() {
		var objectStore = db.transaction("serverlist").objectStore("serverlist");
		objectStore.get("list").onsuccess = function (event) {
			var dbList = event.target.result;
			if (!dbList) return;
			for (var i in serverList) {
				if (dbList[i]) {
					serverList[i].account = dbList[i].account || "";
					serverList[i].password = dbList[i].password || "";
					serverList[i].character = dbList[i].character || "";
				}
			}
		};
		objectStore.get("index").onsuccess = function (event) {
			var dbIndex = event.target.result;
			if (dbIndex && serverList[dbIndex])
				serverListIndex = dbIndex;
			fillInLoginData();
		};
	}

	function fillInLoginData() {
		var titel = serverList[serverListIndex].name === "The Mana World" ?
			"Login" : "Login (" + serverList[serverListIndex].name + ")";
		$("#loginForm").dialog("option", "title", titel);
		$("#formName").attr("value", serverList[serverListIndex].account);
		$("#formPassword").attr("value", serverList[serverListIndex].password);
		if (!serverList[serverListIndex].account)
			document.getElementById("formName").focus();
		else if (!serverList[serverListIndex].password)
			document.getElementById("formPassword").focus();
		else
			document.getElementById("connectButton").focus();
	}

	function openLoginSettingsWindow() {
		$("#loginForm").dialog("close");
		$("<div>")
			.attr("id", "loginSettingsWindow")
			.css("position", "absolute")
			.css("top", 0)
			.css("right", 0)
			.css("z-index", 1000)
			.css("background", "Bisque")
			.css("font-size", "12pt")
			.appendTo("#wallpaper")
			.html(
				"<div style='background:DeepSkyBlue'>" +
				"<span style='margin:4px;'>Server Settings</span></div>" +
				"<div style='margin:5px'>" +
				"<form id='radioServerList'></form>" +
				"<table>" +
				"<tr><td>Hostname:</td><td id='hostname'></td>" +
				"<tr><td>Port:</td><td id='port'></td>" +
				"<tr><td>Name:</td><td><input id='account'></td>" +
				"<tr><td>Password:</td><td><input type='password' id='password'></td>" +
				"<tr><td>Character:</td><td><input id='character'></td>" +
				"</table>" +
				"<div style='float:right'>" +
				"<button id='cancel'>Cancel</button>" +
				"<button id='save'>Save</button>" +
				"</div></div>"
			);
		for (var serv in serverList) {
			$("#radioServerList").append(
				"<label><input type='radio' name='server' value='" + serv +
				"' " + (serverListIndex === serv ? "checked" : "") + ">" +
				serverList[serv].name + "</label><br>");
			if (serverListIndex === serv)
				changeRadioSettings({target: {value: serv}});
		}
		$("#radioServerList").change(changeRadioSettings);
		$("#account").change(changeTextfieldSettings);
		$("#password").change(changeTextfieldSettings);
		$("#character").change(changeTextfieldSettings);
		$("#cancel").click(cancelSettings);
		$("#save").click(saveSettings);
	}

	function changeRadioSettings(event) {
		var server = serverList[event.target.value];
		serverListIndex = event.target.value;
		$("#hostname").text(server.hostname);
		$("#port").text(server.port);
		$("#account").val(serverList[serverListIndex].account);
		$("#password").val(serverList[serverListIndex].password);
		$("#character").val(serverList[serverListIndex].character);
	}

	function changeTextfieldSettings() {
		event.target.value = event.target.value.trim();
		serverList[serverListIndex][event.target.id] = event.target.value;
	}

	function cancelSettings() {
		$("#loginSettingsWindow").remove();
		loadServerSettings();
		$("#loginForm").dialog("open");
	}

	function saveSettings() {
		$("#loginSettingsWindow").remove();
		var transaction = db.transaction("serverlist", "readwrite");
		var objectStore = transaction.objectStore("serverlist");
		objectStore.put(serverList, "list");
		objectStore.put(serverListIndex, "index");
		$("#loginForm").dialog("open");
		fillInLoginData();
	}

	function dbError(event) {
		console.error("IndexedDB error: " + event.target.webkitErrorMessage);
		$("<div>")
			.html(event.target.webkitErrorMessage ||
				(event.target.error.name + ": " + event.target.error.message))
			.attr("title", "IndexedDB Error")
			.dialog({
				dialogClass: "no-close",
				buttons: { OK: function() { $(this).dialog("close"); }}
			});
	}
}
