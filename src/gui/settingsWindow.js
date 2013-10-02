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
	var win = $("<div>")
		.attr("id", "settingsWindow")
		.attr("title", "Settings")
		.html("<form id='settingsForm'>" +
			"<input type='checkbox' id='mapRaster'>" +
			"<label for='mapRaster'>Map raster</label><br>" +
			"<input type='checkbox' id='mapCollision'>" +
			"<label for='mapCollision'>Collision tiles</label>" +
			"</form>")
		.appendTo("#game")
		.dialog({autoOpen: false, closeOnEscape: false});

	$("#mapRaster").change(function () {
		tmw.config.debugRaster = document.getElementById("mapRaster").checked;});
		
	$("#mapCollision").change(function () {
		tmw.config.debugCollision = document.getElementById("mapCollision").checked;});

	tmw.gui.settings = {
		toggle: function () {
			win.dialog("isOpen") ? win.dialog("close") : win.dialog("open");
		},
	};
}
