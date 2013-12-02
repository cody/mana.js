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
	tmw.gui.login = {
		registrationEnabled: registrationEnabled,
	};

	var serverList = {
		"server.themanaworld.org:6901": {
			name: "The Mana World",
			hostname: "server.themanaworld.org",
			port: 6901,
			signUp: "http://www.themanaworld.org/registration.php"},
		"testing.themanaworld.org:6902": {
			name: "Testing Server",
			hostname: "testing.themanaworld.org",
			port: 6902},
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
		"<div id='signUp' style='float:right; font-weight:bold;" +
		"font-family:monospace;'></div><br>" +
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
		.button({disabled: true});
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
					serverList[i].useRepository = dbList[i].useRepository || false;
					serverList[i].repository = dbList[i].repository || null;
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
		document.getElementById("signUp").innerHTML = "Connecting...";
		document.getElementById("formName").value =
			serverList[serverListIndex].account || "";
		document.getElementById("formPassword").value =
			serverList[serverListIndex].password || "";
		if (!serverList[serverListIndex].account)
			document.getElementById("formName").focus();
		else if (!serverList[serverListIndex].password)
			document.getElementById("formPassword").focus();
		else
			document.getElementById("connectButton").focus();
		$("#connectButton").button("option", "disabled", true);
		tmw.net.connect({server: serverList[serverListIndex].hostname,
			port: serverList[serverListIndex].port}, false,
			function () {
				$("#connectButton").button("option", "disabled", false);
				newOutgoingMessage("CMSG_SERVER_VERSION_REQUEST").send();
			},
			function (result) {
				$("#connectButton").button("option", "disabled", false);
				document.getElementById("signUp").innerHTML =
					"<span style='color:Red'>" + result + "</span>";
			});
		tmw.repository = null;
		if (serverList[serverListIndex].useRepository) {
			var folderId = serverList[serverListIndex].repository;
			if (folderId) {
				chrome.fileSystem.restoreEntry(folderId, function (entry) {
						if (entry)
							tmw.repository = entry;
						else
							repoError("Failed to open Repository.");
					});
			} else {
				repoError("No repository set!");
			}
		};
		function repoError(text) {
			console.error("Repository error: " + text);
			$("<div>")
				.html(text)
				.attr("title", "Repository Error")
				.dialog({
					dialogClass: "no-close",
					buttons: { OK: function() { $(this).dialog("close"); }}
				});
			openLoginSettingsWindow();
		}
	}

	function registrationEnabled(isEnabled) {
		var div = document.getElementById("signUp");
		if (!div) return;
		var link = document.createElement("a");
		link.style.fontSize = "12pt";
		link.style.color = "Green";
		link.style.textDecoration = "none";
		if (isEnabled) {
			link.innerText = "Register";
			div.innerHTML = link.outerHTML;
			div.onclick = openSignUpWindow;
		} else {
			if (serverList[serverListIndex].signUp) {
				link.href = serverList[serverListIndex].signUp;
				link.target = "_blank";
				link.innerText = "Sign-up";
				div.innerHTML = link.outerHTML;
			} else {
				div.innerHTML = "<span style='color:Blue'>Registration disabled</span>";
			}
		}
	}

	function openLoginSettingsWindow() {
		$("#loginForm").dialog("close");
		$("<div>")
			.attr("id", "loginSettingsWindow")
			.css("position", "absolute")
			.css("top", 0)
			.css("right", 0)
			.css("background", "Bisque")
			.css("font-size", "12pt")
			.appendTo("#wallpaper")
			.html(
				"<div style='background:DeepSkyBlue'>" +
				"<span style='margin:4px;'>Server Settings</span></div>" +
				"<div style='margin:5px'>" +
				"<form id='radioServerList'></form>" +
				"<table>" +
				"<tr><td>Hostname:</td><td id='hostname' style='font-size:10pt'></td>" +
				"<tr><td>Port:</td><td id='port' style='font-size:10pt'></td>" +
				"<tr><td>Name:</td><td><input id='account'></td>" +
				"<tr><td>Password:</td><td><input type='password' id='password'></td>" +
				"<tr><td>Character:</td><td><input id='character'></td>" +
				"<tr><td>Client data:</td><td style='font-size:10pt'>" +
				"<form id='radioClientData'>" +
				"<label><input type='radio' id='clientDataDefault' name='updates'>Default</input></label>" +
				"<label><input type='radio' id='clientDataRepo' name='updates'>Repository</input></label>" +
				"</form></td>" +
				"<tr><td>Repository:</td><td><input id='repo'readonly></td>" +
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
		document.getElementById("radioServerList").onchange = changeRadioSettings;
		document.getElementById("account").onchange = changeTextfieldSettings;
		document.getElementById("password").onchange = changeTextfieldSettings;
		document.getElementById("character").onchange = changeTextfieldSettings;
		document.getElementById("radioClientData").onchange = changeRadioRepo;
		document.getElementById("repo").onclick = changeRepository;
		document.getElementById("cancel").onclick = cancelSettings;
		document.getElementById("save").onclick = saveSettings;
	}

	function changeRadioSettings(event) {
		var server = serverList[event.target.value];
		serverListIndex = event.target.value;
		$("#hostname").text(server.hostname);
		$("#port").text(server.port);
		$("#account").val(serverList[serverListIndex].account);
		$("#password").val(serverList[serverListIndex].password);
		$("#character").val(serverList[serverListIndex].character);
		if (serverList[serverListIndex].useRepository)
			document.getElementById("clientDataRepo").checked = true;
		else
			document.getElementById("clientDataDefault").checked = true;
		var folderId = serverList[serverListIndex].repository;
		if (folderId) {
			chrome.fileSystem.restoreEntry(folderId, function (entry) {
					if (!entry) {console.log("No restore"); return;}
					console.log("restored");
					document.getElementById("repo").value = entry.name;
				});
		} else {
			document.getElementById("repo").value = "";
		}
	}

	function changeTextfieldSettings() {
		event.target.value = event.target.value.trim();
		serverList[serverListIndex][event.target.id] = event.target.value;
	}

	function changeRadioRepo() {
		var repo = document.getElementById("clientDataRepo").checked;
		serverList[serverListIndex].useRepository = repo;
	}

	function changeRepository() {
		try {
		chrome.fileSystem.chooseEntry({type: "openDirectory"},
			function (entry) {
				if (!entry) return;
				document.getElementById("repo").value = entry.name;
				serverList[serverListIndex].repository = chrome.fileSystem.retainEntry(entry);
			});
		} catch (e) {
			console.error("Repository needs Chrome 31 or higher! Exception was: " + e.message);
			$("<div>")
				.html("Repository requires Chrome version 31 or higher.")
				.attr("title", "Repository error")
				.dialog({
					dialogClass: "no-close",
					buttons: {
						OK: function () { $(this).dialog("close"); }
					}
				});
		}
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

	function openSignUpWindow() {
		$("#loginForm").dialog("close");
		var sex = "_M";
		var div = document.createElement("div");
		document.getElementById("wallpaper").appendChild(div);
		div.style.background = "Bisque";
		div.style.position = "absolute";
		div.innerHTML = "<div style='background:DeepSkyBlue'>" +
			"<span style='margin:4px;'>Register at " +
			serverList[serverListIndex].name + "</span></div>" +
			"<table><tr><td>Name:</td><td><input id='name'></td></tr>" +
			"<tr><td>Password:</td><td><input type='password' id='password'></td></tr>" +
			"<tr><td>Confirm:</td><td><input type='password' id='confirm'></td></tr>" +
			"<tr><td></td><td><form><label><input type='radio' id='male' name='sex' checked>Male</input></label>" +
			"<label><input type='radio' id='female' name='sex'>Female</input></label></form></td>" +
			"<tr><td></td><td><span style='float:right'>" +
			"<button id='cancelSignUp'>Cancel</button>" +
			"<button id='register'>Register</button>" +
			"</span></td></tr></table>";
		var rect = div.getBoundingClientRect();
		div.style.left = Math.floor((window.innerWidth - rect.width) / 2) + "px";
		div.style.top = Math.floor((window.innerHeight - rect.height) / 2) + "px";
		div.style.fontSize = "12pt";
		document.getElementById("male").onchange = function () { sex = "_M"; };
		document.getElementById("female").onchange = function () { sex = "_F"; };
		document.getElementById("cancelSignUp").onclick = function () {
			div.parentNode.removeChild(div);
			$("#loginForm").dialog("open");
		};
		document.getElementById("register").onclick = function () {
			var host = serverList[serverListIndex].hostname;
			var port = serverList[serverListIndex].port;
			var name = document.getElementById("name").value.trim();
			var password = document.getElementById("password").value.trim();
			var confirm = document.getElementById("confirm").value.trim();
			var error = null;
			if (name.length < 4)
				error = "The username needs to be at least 4 characters long.";
			else if (name.length > 21)
				error = "The username needs to be less than 22 characters long.";
			else if (password.length < 4)
				error = "The password needs to be at least 4 characters long.";
			else if (password.length > 23)
				error = "The password needs to be less than 24 characters long.";
			else if (password !== confirm)
				error = "Passwords do not match.";
			if (error) {
				$("<div>")
					.html(error)
					.attr("title", "Error")
					.dialog({
						dialogClass: "no-close",
						buttons: { OK: function() { $(this).dialog("close"); }}
					});
			} else {
				name += sex;
				console.log("Register account: " + name);
				tmw.net.loginData = {name: name, password: password};
				tmw.state.set("STATE_LOGIN_ATTEMPT", {server: host, port: port});
			}
		};
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
