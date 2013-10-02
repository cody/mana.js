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

function createSocialWindow() {
	$("<div>")
		.attr("id", "socialWindow")
		.attr("title", "Social")
		.html("<ul id='beingPresent'></ul>")
		.appendTo("#game")
		.dialog({autoOpen: false, closeOnEscape: false});

	var window = $("#socialWindow");

	tmw.gui.social = {
		toggle: function () {
			window.dialog("isOpen") ? window.dialog("close") : window.dialog("open");
		},
		addBeingPresent: function (being) {
			var name = being.name ? being.name : "job: " + being.job;
			$("<li>")
				.attr("id", "beingPresentId" + being.id)
				.html(name)
				.appendTo("#beingPresent");
		},
		removeBeingPresent: function (id) {
			$("#beingPresentId" + id).remove();
		},
		resetBeingPresent: function () {
			$("#socialWindow").html("<ul id='beingPresent'></ul></div>");
		},
	};
}
