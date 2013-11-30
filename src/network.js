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

function createNetwork() {
	tmw.net = {
		token: {},
		write: write,
		connect: connect,
		disconnect: disconnect,
		loginData: {},
		worlds: [],
		updateHost: null,
		setUpdateHost: setUpdateHost,
		packetLimiter: packetLimiter,
		fatalError: fatalError,
	};

	var socketId = null;
	var skip4Bytes = false;
	var overlappingMessage = null;
	var overlappingMessageBegin;
	var hostName;
	var port;

	function write(arraybuffer) {
		if (!socketId) {
			console.error("Network write failed: Not connected to socket.");
			return;
		}
		chrome.socket.write(socketId, arraybuffer, function (writeInfo){
			if (writeInfo.bytesWritten < 0) {
				console.error("socket.write: " + writeInfo.bytesWritten + " " + errorCodes[writeInfo.bytesWritten]);
			}
		});
	}

	function connect(o, skip, success, failure) {
		if (socketId) {
			if (hostName === o.server && port === o.port) {
				console.log("Network: Reusing socketId " + socketId);
				success();
				return;
			} else {
				tmw.net.disconnect();
			}
		}
		hostName = o.server;
		port = o.port;
		chrome.socket.create('tcp', {}, function(createInfo) {
			socketId = Number(createInfo.socketId);
			chrome.storage.local.set({socketId: socketId});
			console.log("Network: Connecting to " + o.server + ":" + o.port + " with sockedId " + socketId);
			chrome.socket.connect(socketId, o.server, o.port, function (result) {
				if (result < 0) {
					console.error("Network connect error");
					if (failure) {
						disconnect();
						failure(errorCodes[result]);
					} else {
						fatalError("Network connect error", result);
					}
					return;
				}
				chrome.socket.setNoDelay(socketId, true, function (noDelayResult) {
					if (!noDelayResult) console.error("setNoDelay failed");
				});
				skip4Bytes = skip;
				chrome.socket.read(socketId, null, dispatchMessages);
				success();
			});
		});
	}

	function disconnect() {
		if (!socketId) return;
		chrome.socket.disconnect(socketId);
		chrome.socket.destroy(socketId);
		console.log("Network: Disconnected from sockedId " + socketId);
		socketId = null;
	}

	function setUpdateHost(update) {
		if (update[update.length-1] === "/")
			tmw.net.updateHost = update.slice(0, -1);
		else
			tmw.net.updateHost = update;
		console.log("Update-host: " + tmw.net.updateHost);
	}

	function dispatchMessages(readInfo) {
		var begin = 0;
		if (readInfo.resultCode < 0) {
			console.error("dispatchMessages Error");
			fatalError("The connection to the server was lost", readInfo.resultCode);
			return;
		}
		if (skip4Bytes) {
			begin = 4;
			skip4Bytes = false;
		}
		var buf;
		if (overlappingMessage) {
			var restLength = overlappingMessage.byteLength - overlappingMessageBegin;
			buf = new ArrayBuffer(restLength + readInfo.data.byteLength);
			var dstU8 = new Uint8Array(buf);
			var srcU8 = new Uint8Array(overlappingMessage, overlappingMessageBegin);
			dstU8.set(srcU8);
			srcU8 = new Uint8Array(readInfo.data);
			dstU8.set(srcU8, restLength);
			overlappingMessage = null;
		}
		else {
			buf = readInfo.data;
		}
		var remainder = buf.byteLength - begin;
		for (; remainder > 0; remainder = buf.byteLength - begin)
		{
			if (remainder < 2) {
				overlappingMessage = buf;
				overlappingMessageBegin = begin;
				break;
			}
			var view = new DataView(buf, begin, 2);
			var msgId = view.getUint16(0, true);
			var offset = 2;
			var size;
			if (tmw.packetsReverse[msgId] === "SMSG_SERVER_VERSION_RESPONSE") {
				size = 10;
			}
			else {
				size = tmw.packet_lengths[msgId];
			}
			if (!size) {
				console.error("Fatal Error: Invalid packet 0x" + msgId.toString(16));
				fatalError("Invalid packet 0x" + msgId.toString(16));
				return;
			}
			if (size < 0) {
				if (remainder < 4) {
					overlappingMessage = buf;
					overlappingMessageBegin = begin;
					break;
				}
				view = new DataView(buf, begin + 2, 2);
				size = view.getUint16(0, true);
				offset = 4;
			}
			if (remainder < size) {
				overlappingMessage = buf;
				overlappingMessageBegin = begin;
				break;
			}
			var msg = newIncomingMessage(buf, begin + offset, size - offset);
			if (tmw.debug) console.log("--> " + tmw.packetsReverse[msgId]);
			if (tmw.callHandler[msgId]) {
				tmw.callHandler[msgId](msg);
			} else {
				if (tmw.packetsReverse[msgId]) {
					console.warn("Unhandeled packet: " + tmw.packetsReverse[msgId] +"("+size+")");
				} else {
					console.error("Unknown packet: 0x" + msgId.toString(16));
				}
			}
			begin += size;
		}
		if (socketId) {
			chrome.socket.read(socketId, null, dispatchMessages);
		}
	}

	var limiterTable = {
		"CMSG_ITEM_PICKUP": {rate: 450, nextTime: 0},
		"CMSG_PLAYER_ATTACK": {rate: 1000, nextTime: 0},
		"CMSG_PLAYER_CHANGE_ACT": {rate: 1000, nextTime: 0},
		"CMSG_PLAYER_INVENTORY_DROP": {rate: 50, nextTime: 0},
		"CMSG_PLAYER_EMOTE": {rate: 1000, nextTime: 0},
	};

	function packetLimiter(msgName) {
		if (limiterTable[msgName].nextTime > Date.now())
			return false;
		var rate;
		switch (msgName) {
			case "CMSG_PLAYER_ATTACK": rate = tmw.localplayer.attackSpeed; break;
			default: rate = limiterTable[msgName].rate;
		}
		limiterTable[msgName].nextTime = Date.now() + rate;
		return true;
	}

	function fatalError(text, code) {
		tmw.net.disconnect();
		console.error("Network error: " + text + ": " + code + " " + errorCodes[code]);
		$("<div>").html(text + (code ? (":<br>" + errorCodes[code]) : ""))
			.attr("title", "Network Error")
			.css("display", "none")
			.dialog({ dialogClass: "no-close",
				closeOnEscape: false,
				buttons: { Quit: function() {
					$(this).dialog("close");
					tmw.state.set("STATE_START");
				}
			}});
	}

	// https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h
	var errorCodes = {
		'-1': 'IO_PENDING',
		'-2': 'FAILED',
		'-3': 'ABORTED',
		'-4': 'INVALID_ARGUMENT',
		'-5': 'INVALID_HANDLE',
		'-6': 'FILE_NOT_FOUND',
		'-7': 'TIMED_OUT',
		'-8': 'FILE_TOO_BIG',
		'-9': 'UNEXPECTED',
		'-10': 'ACCESS_DENIED',
		'-11': 'NOT_IMPLEMENTED',
		'-12': 'INSUFFICIENT_RESOURCES',
		'-13': 'OUT_OF_MEMORY',
		'-14': 'UPLOAD_FILE_CHANGED',
		'-15': 'SOCKET_NOT_CONNECTED',
		'-16': 'FILE_EXISTS',
		'-17': 'FILE_PATH_TOO_LONG',
		'-18': 'FILE_NO_SPACE',
		'-19': 'FILE_VIRUS_INFECTED',
		'-20': 'BLOCKED_BY_CLIENT',
		'-21': 'NETWORK_CHANGED',
		'-22': 'BLOCKED_BY_ADMINISTRATOR',
		'-23': 'SOCKET_IS_CONNECTED',
		'-100': 'CONNECTION_CLOSED',
		'-101': 'CONNECTION_RESET',
		'-102': 'CONNECTION_REFUSED',
		'-103': 'CONNECTION_ABORTED',
		'-104': 'CONNECTION_FAILED',
		'-105': 'NAME_NOT_RESOLVED',
		'-106': 'INTERNET_DISCONNECTED',
		'-107': 'SSL_PROTOCOL_ERROR',
		'-108': 'ADDRESS_INVALID',
		'-109': 'ADDRESS_UNREACHABLE',
		'-110': 'SSL_CLIENT_AUTH_CERT_NEEDED',
		'-111': 'TUNNEL_CONNECTION_FAILED',
		'-112': 'NO_SSL_VERSIONS_ENABLED',
		'-113': 'SSL_VERSION_OR_CIPHER_MISMATCH',
		'-114': 'SSL_RENEGOTIATION_REQUESTED',
		'-115': 'PROXY_AUTH_UNSUPPORTED',
		'-116': 'CERT_ERROR_IN_SSL_RENEGOTIATION',
		'-117': 'BAD_SSL_CLIENT_AUTH_CERT',
		'-118': 'CONNECTION_TIMED_OUT',
		'-119': 'HOST_RESOLVER_QUEUE_TOO_LARGE',
		'-120': 'SOCKS_CONNECTION_FAILED',
		'-121': 'SOCKS_CONNECTION_HOST_UNREACHABLE',
		'-122': 'NPN_NEGOTIATION_FAILED',
		'-123': 'SSL_NO_RENEGOTIATION',
		'-124': 'WINSOCK_UNEXPECTED_WRITTEN_BYTES',
		'-125': 'SSL_DECOMPRESSION_FAILURE_ALERT',
		'-126': 'SSL_BAD_RECORD_MAC_ALERT',
		'-127': 'PROXY_AUTH_REQUESTED',
		'-128': 'SSL_UNSAFE_NEGOTIATION',
		'-129': 'SSL_WEAK_SERVER_EPHEMERAL_DH_KEY',
		'-130': 'PROXY_CONNECTION_FAILED',
		'-131': 'MANDATORY_PROXY_CONFIGURATION_FAILED',
		'-133': 'PRECONNECT_MAX_SOCKET_LIMIT',
		'-134': 'SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED',
		'-135': 'SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY',
		'-136': 'PROXY_CERTIFICATE_INVALID',
		'-137': 'NAME_RESOLUTION_FAILED',
		'-138': 'NETWORK_ACCESS_DENIED',
		'-139': 'TEMPORARILY_THROTTLED',
		'-140': 'HTTPS_PROXY_TUNNEL_RESPONSE',
		'-141': 'SSL_CLIENT_AUTH_SIGNATURE_FAILED',
		'-142': 'MSG_TOO_BIG',
		'-143': 'SPDY_SESSION_ALREADY_EXISTS',
		'-145': 'WS_PROTOCOL_ERROR',
		'-146': 'PROTOCOL_SWITCHED',
		'-147': 'ADDRESS_IN_USE',
		'-148': 'SSL_HANDSHAKE_NOT_COMPLETED',
		'-149': 'SSL_BAD_PEER_PUBLIC_KEY',
		'-150': 'SSL_PINNED_KEY_NOT_IN_CERT_CHAIN',
		'-151': 'CLIENT_AUTH_CERT_TYPE_UNSUPPORTED',
		'-152': 'ORIGIN_BOUND_CERT_GENERATION_TYPE_MISMATCH',
		'-200': 'CERT_COMMON_NAME_INVALID',
		'-201': 'CERT_DATE_INVALID',
		'-202': 'CERT_AUTHORITY_INVALID',
		'-203': 'CERT_CONTAINS_ERRORS',
		'-204': 'CERT_NO_REVOCATION_MECHANISM',
		'-205': 'CERT_UNABLE_TO_CHECK_REVOCATION',
		'-206': 'CERT_REVOKED',
		'-207': 'CERT_INVALID',
		'-208': 'CERT_WEAK_SIGNATURE_ALGORITHM',
		'-210': 'CERT_NON_UNIQUE_NAME',
		'-211': 'CERT_WEAK_KEY',
		'-212': 'CERT_END',
		'-300': 'INVALID_URL',
		'-301': 'DISALLOWED_URL_SCHEME',
		'-302': 'UNKNOWN_URL_SCHEME',
		'-310': 'TOO_MANY_REDIRECTS',
		'-311': 'UNSAFE_REDIRECT',
		'-312': 'UNSAFE_PORT',
		'-320': 'INVALID_RESPONSE',
		'-321': 'INVALID_CHUNKED_ENCODING',
		'-322': 'METHOD_NOT_SUPPORTED',
		'-323': 'UNEXPECTED_PROXY_AUTH',
		'-324': 'EMPTY_RESPONSE',
		'-325': 'RESPONSE_HEADERS_TOO_BIG',
		'-326': 'PAC_STATUS_NOT_OK',
		'-327': 'PAC_SCRIPT_FAILED',
		'-328': 'REQUEST_RANGE_NOT_SATISFIABLE',
		'-329': 'MALFORMED_IDENTITY',
		'-330': 'CONTENT_DECODING_FAILED',
		'-331': 'NETWORK_IO_SUSPENDED',
		'-332': 'SYN_REPLY_NOT_RECEIVED',
		'-333': 'ENCODING_CONVERSION_FAILED',
		'-334': 'UNRECOGNIZED_FTP_DIRECTORY_LISTING_FORMAT',
		'-335': 'INVALID_SPDY_STREAM',
		'-336': 'NO_SUPPORTED_PROXIES',
		'-337': 'SPDY_PROTOCOL_ERROR',
		'-338': 'INVALID_AUTH_CREDENTIALS',
		'-339': 'UNSUPPORTED_AUTH_SCHEME',
		'-340': 'ENCODING_DETECTION_FAILED',
		'-341': 'MISSING_AUTH_CREDENTIALS',
		'-342': 'UNEXPECTED_SECURITY_LIBRARY_STATUS',
		'-343': 'MISCONFIGURED_AUTH_ENVIRONMENT',
		'-344': 'UNDOCUMENTED_SECURITY_LIBRARY_STATUS',
		'-345': 'RESPONSE_BODY_TOO_BIG_TO_DRAIN',
		'-346': 'RESPONSE_HEADERS_MULTIPLE_CONTENT_LENGTH',
		'-347': 'INCOMPLETE_SPDY_HEADERS',
		'-348': 'PAC_NOT_IN_DHCP',
		'-349': 'RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION',
		'-350': 'RESPONSE_HEADERS_MULTIPLE_LOCATION',
		'-351': 'SPDY_SERVER_REFUSED_STREAM',
		'-352': 'SPDY_PING_FAILED',
		'-353': 'PIPELINE_EVICTION',
		'-354': 'CONTENT_LENGTH_MISMATCH',
		'-355': 'INCOMPLETE_CHUNKED_ENCODING',
		'-356': 'QUIC_PROTOCOL_ERROR',
		'-400': 'CACHE_MISS',
		'-401': 'CACHE_READ_FAILURE',
		'-402': 'CACHE_WRITE_FAILURE',
		'-403': 'CACHE_OPERATION_NOT_SUPPORTED',
		'-404': 'CACHE_OPEN_FAILURE',
		'-405': 'CACHE_CREATE_FAILURE',
		'-406': 'CACHE_RACE',
		'-407': 'CACHE_CHECKSUM_READ_FAILURE',
		'-408': 'CACHE_CHECKSUM_MISMATCH',
		'-501': 'INSECURE_RESPONSE',
		'-502': 'NO_PRIVATE_KEY_FOR_CERT',
		'-503': 'ADD_USER_CERT_FAILED',
		'-601': 'FTP_FAILED',
		'-602': 'FTP_SERVICE_UNAVAILABLE',
		'-603': 'FTP_TRANSFER_ABORTED',
		'-604': 'FTP_FILE_BUSY',
		'-605': 'FTP_SYNTAX_ERROR',
		'-606': 'FTP_COMMAND_NOT_SUPPORTED',
		'-607': 'FTP_BAD_COMMAND_SEQUENCE',
		'-701': 'PKCS12_IMPORT_BAD_PASSWORD',
		'-702': 'PKCS12_IMPORT_FAILED',
		'-703': 'IMPORT_CA_CERT_NOT_CA',
		'-704': 'IMPORT_CERT_ALREADY_EXISTS',
		'-705': 'IMPORT_CA_CERT_FAILED',
		'-706': 'IMPORT_SERVER_CERT_FAILED',
		'-707': 'PKCS12_IMPORT_INVALID_MAC',
		'-708': 'PKCS12_IMPORT_INVALID_FILE',
		'-709': 'PKCS12_IMPORT_UNSUPPORTED',
		'-710': 'KEY_GENERATION_FAILED',
		'-711': 'ORIGIN_BOUND_CERT_GENERATION_FAILED',
		'-712': 'PRIVATE_KEY_EXPORT_FAILED',
		'-800': 'DNS_MALFORMED_RESPONSE',
		'-801': 'DNS_SERVER_REQUIRES_TCP',
		'-802': 'DNS_SERVER_FAILED',
		'-803': 'DNS_TIMED_OUT',
		'-804': 'DNS_CACHE_MISS',
		'-805': 'DNS_SEARCH_EMPTY',
		'-806': 'DNS_SORT_ERROR',
	};
}
