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
		toggle: function () {
			win.dialog("isOpen") ? win.dialog("close") : win.dialog("open");
		},
	};

	var win = $("<div>")
		.attr("id", "settingsWindow")
		.attr("title", "Settings")
		.html("<form id='settingsForm'>" +
			"<input type='checkbox' id='mapRasterCheckbox'>" +
			"<label for='mapRasterCheckbox'>Map raster</label><br>" +
			"<input type='checkbox' id='collisionCheckbox'>" +
			"<label for='collisionCheckbox'>Collision tiles</label><br>" +
			"<input type='checkbox' id='showFpsCheckbox'>" +
			"<label for='showFpsCheckbox'>Show FPS</label>" +
			"</form>")
		.appendTo("#game")
		.dialog({autoOpen: false, closeOnEscape: false});

	$("#mapRasterCheckbox").change(function () {
		tmw.config.debugRaster = document.getElementById("mapRasterCheckbox").checked;});

	$("#collisionCheckbox").change(function () {
		tmw.config.debugCollision = document.getElementById("collisionCheckbox").checked;});

	$("#showFpsCheckbox").change(function () {
		var value = document.getElementById("showFpsCheckbox").checked;
		tmw.config.showFps = value;
		value ? $("#fps").show() : $("#fps").hide();
	});
}
