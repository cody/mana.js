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

var copyOfSocketId = null;

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'bounds': {
      'width': 800,
      'height': 600
    }
  },onInitWindow)}
);

function onInitWindow(appWindow) {
	// Todo
	appWindow.onClosed.addListener(function(){
		if (copyOfSocketId === null) {
			return;
		} else if (copyOfSocketId) {
			chrome.socket.disconnect(copyOfSocketId);
		} else { // undefined
			for (var i=0; i<1000; i++) chrome.socket.disconnect(i);
		}
  });
}
