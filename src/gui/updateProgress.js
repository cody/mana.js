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

function showUpdateDialog() {
	$("#wallpaper").html(
		"<div id='updateprogressbar' style='position:relative; width:450px; top:50%; left:50%; margin-top:-18px; margin-left:-225px;'>" +
		"<div id='updateprogresslabel' style='position:absolute; width:100%; text-align:center; top:4px; font-weight:bold;'>" +
		"Trying to log in</div></div>");
	var bar = $("#updateprogressbar");
	var label = $("#updateprogresslabel");
	bar.progressbar({value: false});
	var max;
	return  {
		setText: function (text) {
			bar.progressbar({value: 0});
			label.text(text);
		},
		next: function (text) {
			var val = bar.progressbar("value") + 1;
			if (val <= max) {
				bar.progressbar("value", val);
				text = "[" + val + " of " + max + "] " + text;
			}
			label.text(text);
		},
		setMax: function (num) {
			max = num;
			bar.progressbar("option", "max", max);
		},
	};
}
