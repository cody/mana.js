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

function createSkillsWindow() {
	tmw.gui.skills = {
		toggle: toggle,
		updateAll: function (arg) { currentSkills = arg; draw(); },
		updateOne: function (arg) { currentSkills[arg.id] = arg; draw(); },
		draw: draw,
	};

	var isOpen = false;
	var tab;
	var currentSkills = {};

	var win = $("<div>")
		.attr("id", "skillsWindow")
		.css("position", "absolute")
		.css("width", 300)
		.css("left", 3)
		.css("top", 26)
		.hide()
		.css("background", "Bisque")
		.html("<div id='skillsWindowTitle' style='background:SpringGreen'>" +
			"<span id='skillsWindowName' style='margin:4px;'>" +
			"Skills</span></div>" +
			"<div>" +
			"<button id='skillsBasicRadio'>Basic</button>" +
			"<button id='skillsFocusRadio'>Focus</button>" +
			"<button id='skillsMagicRadio'>Magic</button>" +
			"</div>" +
			"<div id='skillsContent'></span></div>")
		.appendTo("#game");
	win.draggable({handle: "#skillsWindowTitle", containment: "#game"});

	var content = $("#skillsContent");

	$("#skillsBasicRadio").click(function () {
		if (tab === "Basic") return;
		tab = "Basic";
		$("#skillsBasicRadio").css("background", "SpringGreen");
		$("#skillsFocusRadio").css("background", "White");
		$("#skillsMagicRadio").css("background", "White");
		draw();
	});
	$("#skillsFocusRadio").click(function () {
		if (tab === "Focus") return;
		tab = "Focus";
		$("#skillsBasicRadio").css("background", "White");
		$("#skillsFocusRadio").css("background", "SpringGreen");
		$("#skillsMagicRadio").css("background", "White");
		draw();
	});
	$("#skillsMagicRadio").click(function () {
		if (tab === "Magic") return;
		tab = "Magic";
		$("#skillsBasicRadio").css("background", "White");
		$("#skillsFocusRadio").css("background", "White");
		$("#skillsMagicRadio").css("background", "SpringGreen");
		draw();
	});

	function toggle() {
		win.toggle();
		isOpen = !isOpen;
		if (!isOpen)
			return;
		if (!tab)
			$("#skillsBasicRadio").trigger("click");
		else
			draw();
	}

	function draw() {
		if (!isOpen) return;
		var table = "<table>";
		for (var i in currentSkills) {
			var up = currentSkills[i].up;
			var level = currentSkills[i].level;
			var id = currentSkills[i].id;
			var db = tmw.skillsDB[id];
			if (db.set !== tab) continue;
			table += "<tr><td>" + db.png.outerHTML + "</td>" +
				"<td width=150>" + db.name + "</td>" +
				"<td>Lvl: " + currentSkills[i].level  + "</td>";
			if (up && level <= tmw.localplayer.attributes.skillPoints) {
				table += "<td><button class='skillUpButton' skillid='" + id +
					"'>+</button></td>";
			}
			table += "</tr>";
		}
		if (table === "<table>")
			table += "<div style='padding-left:5px'>You have not learned any " +
				tab + " skills yet.</div>"
		table += "</table>"
		$(content).html(table);
		$(".skillUpButton").click( function (event) {
			var msg = newOutgoingMessage("CMSG_SKILL_LEVELUP_REQUEST");
			msg.write16(Number(event.target.attributes.skillid.value));
			msg.send();
		});
		if (tab === "Focus") {
			$("<div>")
				.html("<span style='padding-left:5px'>" +
					tmw.localplayer.attributes.skillPoints + " Point" +
					(tmw.localplayer.attributes.skillPoints === 1 ? "" : "s") +
					" to distribute</span>")
				.appendTo(content);
			var bar = $("<div>")
				.attr("title", "Job XP")
				.css("margin", 10)
				.appendTo(content)
				.progressbar();
			var barValue = bar.find(".ui-progressbar-value");
			barValue.css({"background": "DodgerBlue"});
			bar.progressbar("option", "max", tmw.localplayer.attributes.jobXpNeeded);
			bar.progressbar("value", tmw.localplayer.attributes.jobXp);
			$("<div>")
				.css("position", "absolute")
				.css("bottom", 12)
				.css("left", 120)
				.html(tmw.localplayer.attributes.jobXp +
					" / " + tmw.localplayer.attributes.jobXpNeeded)
				.appendTo(content);
		}
	}
}
