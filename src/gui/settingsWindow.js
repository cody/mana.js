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

function createSettingsWindow() {
	tmw.gui.settings = {
		toggle: toggle,
	};

	var isOpen = false;
	var win = null;
	var content;

	function buildWindow() {
		win = document.createElement("div");
		win.style.position = "absolute";
		win.style.right = "3px";
		win.style.top = "26px";
		win.style.width = "300px";
		win.style.height = "300px";
		win.style.fontSize = "12pt";
		win.style.background = "Bisque";
		win.innerHTML =
			"<div id='settingsWindowTitle' style='background:Turquoise'>" +
			"<span style='margin:4px;'>Settings</span><span " +
			"id='settingsClose' class='ui-icon ui-icon-close' style='float:right'>" +
			"</span></div><div id='settingsMenuBar'>" +
			"<button id='settingsDebugRadio'>Debug</button>" +
			"<button id='settingsKeyboardRadio'>Keyboard</button>" +
			"</div> <div  id='settingsContentContainer' " +
			"style='position:absolute; width:100%; bottom:0px; overflow:auto;'>" +
			"<div id='settingsContent' style='padding:3px;'></div>";
		document.getElementById("game").appendChild(win);
		document.getElementById("settingsClose").onclick = toggle;
		document.getElementById("settingsContentContainer").style.top =
			document.getElementById("settingsMenuBar").getBoundingClientRect().height +
			document.getElementById("settingsWindowTitle").getBoundingClientRect().height +
			"px";
		$(win)
			.draggable({handle: "#settingsWindowTitle", containment: "#game"})
			.resizable({resize: $.noop, containment: "#game",
				minWidth: 200, minHeight: 150});
		document.getElementById("settingsDebugRadio").onclick = showDebug;
		document.getElementById("settingsKeyboardRadio").onclick = showKeyboard;
		content = document.getElementById("settingsContent");
		showDebug();
	}

	function toggle() {
		if (isOpen)
			document.getElementById("game").removeChild(win);
		else if (win)
			document.getElementById("game").appendChild(win);
		else
			buildWindow();
		isOpen = !isOpen;
	}

	function showDebug() {
		document.getElementById("settingsDebugRadio").style.background = "Turquoise";
		document.getElementById("settingsKeyboardRadio").style.background = "White";
		content.innerHTML =
			"<form id='settingsForm'>" +
			"<label><input type='checkbox' id='showFps'>Show FPS</label><br>" +
			"<label><input type='checkbox' id='debugCollision'>Collision tiles</label><br>" +
			"<label><input type='checkbox' id='debugRaster'>Map raster</label>" +
			"</form>";
		document.getElementById("showFps").checked = tmw.config.showFps;
		document.getElementById("debugCollision").checked = tmw.config.debugCollision;
		document.getElementById("debugRaster").checked = tmw.config.debugRaster;
		document.getElementById("settingsForm").onchange = function (event) {
			var id = event.target.id;
			var value = event.target.checked;
			tmw.config[id] = value;
			if (id === "showFps")
				value ? $("#fps").show() : $("#fps").hide();
		};
	}

	function showKeyboard() {
		document.getElementById("settingsDebugRadio").style.background = "White";
		document.getElementById("settingsKeyboardRadio").style.background = "Turquoise";
		content.innerHTML = "<table>" +
			"<tr><td>Arrows</td><td>Move</td></tr>" +
			"<tr><td>x</td><td>Attack</td></tr>" +
			"<tr><td>y or z</td><td>Pick-up item</td></tr>" +
			"<tr><td>a</td><td>Select Monster</td></tr>" +
			"<tr><td>n</td><td>Select NPC</td></tr>" +
			"<tr><td>q</td><td>Select Player</td></tr>" +
			"<tr><td>ctrl</td><td>Deselect</td></tr>" +
			"<tr><td>t</td><td>Talk to selected NPC or open wisper tab for selected player</td></tr>" +
			"<tr><td>s</td><td>Sit</td></tr>" +
			"<tr><td>Enter</td><td>Chat input</td></tr>" +
			"<tr><td>Alt+0...Alt+9</td><td>Show emotes</td></tr>" +
			"<tr><td>Alt+arrow</td><td>Change direction</td></tr>" +
			"<tr><td>F2</td><td>Status window</td></tr>" +
			"<tr><td>F3</td><td>Inventory window</td></tr>" +
			"<tr><td>F5</td><td>Skills window</td></tr>" +
			"<tr><td>F7</td><td>Chat window</td></tr>" +
			"<tr><td>F9</td><td>Settings window</td></tr>" +
			"<tr><td>F11</td><td>Social window</td></tr>" +
			"<tr><td>F12</td><td>Emote window</td></tr>" +
			"</table>";
	}
}
