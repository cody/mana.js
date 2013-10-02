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

function createChatWindow() {
	console.assert(!tmw.gui.chat);
	tmw.gui.chat = {
		toggle: toggle,
		log: log,
		parse: parse,
		getPanel: getPanel,
	};

	var isVisible = true;
	var panels = {};
	var panelCounter = 0;
	$("<div>")
		.attr("id", "chatWindow")
		.css("height", "300px")
		.css("width", "300px")
		.css("border", 0)
		.addClass("ui-corner-all")
		.css("position", "absolute")
		.css("bottom", 0)
		.appendTo("#game");
	$("<div>")
		.attr("id", "chatTabs")
		.attr("class", "ui-widget-content")
		.css("-webkit-user-select", "text")
		.css("padding", 0)
		.html("<ul></ul>")
		.appendTo("#chatWindow");
	$("#chatTabs .ui-icon-close")
		.css("float", "left")
		.css("margin", "0.4em 0.2em 0 0")
		.css("cursor", "pointer");
	$("<input>")
		.attr("id", "chatInput")
		.css("background-color", "#33FFFF")
		.css("position", "absolute")
		.css("bottom", 0)
		.css("left", 0)
		.css("border", 0)
		.css("margin", 0)
		.css("padding", 1)
		.addClass("ui-corner-all")
		.keydown(onChatKeypress)
		.appendTo("#chatWindow");
	$("#chatTabs").tabs({create: resizeChat, activate: resizeChat,
		beforeActivate: onBeforeActivate});
	$("#chatWindow").resizable({resize: resizeChat, containment: "#game",
		minWidth: 150, minHeight: 150});
	$("#chatWindow").draggable({handle: "ul", containment: "#game"});
	getPanel("chat", "Chat", true);
	$("#chatTabs").tabs("option", "active", 0);

	$("#chatTabs").delegate("span.ui-icon-close", "click", function () {
		var id = $(this).closest("li").remove().attr("aria-controls");
		$("#" + id).remove();
		$("#chatTabs").tabs("refresh");
		for (var p in panels) {
			if (panels[p].id === id)
				delete panels[p];
		}
	});

	function getActiveTabId() {
		return $("#chatTabs").find(".ui-tabs-active").attr("aria-controls");
	}

	function onBeforeActivate(event, ui) {
		$("a[href='#" + getActiveTabId() + "']").removeClass("chattab-active");
	}

	function resizeChat(event, ui) {
		var h = $("#chatWindow").height() - $("#chatInput").outerHeight();
		$("#chatTabs").css("height", h);
		var id = getActiveTabId();
		$("#" + id).css("height", h - $("#chatTabs ul").outerHeight());
		$("#" + id).scrollTop(999999);
		$("#chatInput").css("width", $("#chatWindow").width() - 2);
		//
		$("a[href='#" + id + "']").removeClass("chattab-highlight").addClass("chattab-active");
	}

	function onChatKeypress(event) {
		event.stopPropagation();
		if (event.keyCode === $.ui.keyCode.ENTER) {
			var text = $("#chatInput").val();
			$("#chatInput").val("");
			text = text.trim();
			if (text !== "") {
				var id = getActiveTabId();
				if (id === "chat") sendChat(text);
				for (var p in panels) {
					if (panels[p].id === id && panels[p].type === "wisper")
						sendWisper(panels[p].name, text);
				}
			}
			$("#chatInput").blur();
		}
	}

	function sendChat(text) {
		var msg  = newOutgoingMessage("CMSG_CHAT_MESSAGE");
		msg.writeString(tmw.localplayer.nameInsecure + " : " + text);
		msg.send();
	}

	function sendWisper(recipient, text) {
		var msg  = newOutgoingMessage("CMSG_CHAT_WHISPER");
		msg.writeString(recipient, 24);
		msg.writeString(text);
		msg.send();
		tmw.gui.chat.log(tmw.localplayer.nameInsecure, text, "active");
	}

	function getPanel(type, name, noClose) {
		var key = type + name;
		if (panels[key]) {
			return panels[key];
		}
		var id = type;
		if (type === "wisper")
			id += panelCounter++;
		var li = "<li><a href='#" + id + "'>" + htmlToText(name) + "</a>";
		if (!noClose)
			li += "<span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span>";
		li += "</li>";
		$("#chatTabs").find(".ui-tabs-nav").append(li);
		$("#chatTabs").append("<div id='" + id + "'></div>");
		var tab = $("#" + id);
		tab.css("padding", 0).css("overflow-y", "scroll");
		$("#chatTabs").tabs("refresh");
		return panels[key] = {id: id, type: type, name: name, tab: tab};
	}

	function toggle() {
		$("#chatWindow").toggle();
		isVisible = !isVisible;
		if (isVisible) resizeChat();
	}

	function log(name, text, type) {
		var color = "";
		text = name + (name ? ": " : "") + text;
		text = htmlToText(text);
		var date = new Date();
		var minutes = (date.getUTCMinutes() < 10 ? "0" : "") + date.getUTCMinutes();
		var time = "[" + date.getUTCHours() + ":" + minutes + "] ";
		var panel;
		var activePanel;
		var activeId = getActiveTabId();
		$.each(panels, function(key, o){if (o.id === activeId) activePanel = o;});
		switch (type) {
			case ("player"):
				panel = getPanel("chat", "Chat");
				color = "green";
				break;
			case ("being"):
				panel = getPanel("chat", "Chat");
				break;
			case ("gm"):
				panel = getPanel("chat", "Chat");
				text = "Broadcast" + (name ? " from " : ": ") + text;
				color = "red";
				break;
			case ("wisper"):
				panel = getPanel("wisper", name);
				break;
			case ("active"):
				panel = activePanel;
				color = "green";
				break;
			default:
				console.error("Unknown chat type " + type);
				return;
		}
		if (color) color = " style='color:" + color + ";'"
		var fromBottom = panel.tab.prop("scrollHeight") -
			panel.tab.outerHeight() - panel.tab.scrollTop();
		panel.tab.append("<span" + color + ">" + time + text + "</span><br>");
		if (activeId !== panel.id)
			$("a[href='#" + panel.id + "']").addClass("chattab-highlight");
		if (fromBottom < 4) panel.tab.scrollTop(999999);
	}

	function parse(text) {
		return text.replace(/##[0-9]/g, "");
	}
}
