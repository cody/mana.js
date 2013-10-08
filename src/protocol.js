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

// Todo: Unknown packet: 0x13d @heal

tmw.packets = {
	CMSG_GetCharNameRequest      : 0x94,

/*********************************
 * Packets from server to client *
 *********************************/
	SMSG_SERVER_VERSION_RESPONSE : 0x7531,

  SMSG_CONNECTION_PROBLEM      : 0x0081,
	SMSG_UPDATE_HOST             : 0x0063,
	SMSG_LOGIN_DATA              : 0x0069,
	SMSG_LOGIN_ERROR             : 0x006a,

	SMSG_CHAR_LOGIN              : 0x006b,
SMSG_CHAR_LOGIN_ERROR        : 0x006c,
	SMSG_CHAR_CREATE_SUCCEEDED   : 0x006d,
	SMSG_CHAR_CREATE_FAILED      : 0x006e,
SMSG_CHAR_DELETE_SUCCEEDED   : 0x006f,
SMSG_CHAR_DELETE_FAILED      : 0x0070,
	SMSG_CHAR_MAP_INFO           : 0x0071,
SMSG_CHAR_PASSWORD_RESPONSE  : 0x0062,

SMSG_CHAR_SWITCH_RESPONSE    : 0x00b3,
SMSG_CHANGE_MAP_SERVER       : 0x0092,

	SMSG_MAP_LOGIN_SUCCESS       : 0x0073,
	SMSG_MAP_QUIT_RESPONSE       : 0x018b,
	SMSG_PLAYER_UPDATE_1         : 0x01d8,
	SMSG_PLAYER_UPDATE_2         : 0x01d9,
	SMSG_PLAYER_MOVE             : 0x01da,
	SMSG_PLAYER_STOP             : 0x0088,
SMSG_PLAYER_MOVE_TO_ATTACK   : 0x0139,
	SMSG_PLAYER_STAT_UPDATE_1    : 0x00b0,
	SMSG_PLAYER_STAT_UPDATE_2    : 0x00b1,
	SMSG_PLAYER_STAT_UPDATE_3    : 0x0141,
	SMSG_PLAYER_STAT_UPDATE_4    : 0x00bc,
	SMSG_PLAYER_STAT_UPDATE_5    : 0x00bd,
	SMSG_PLAYER_STAT_UPDATE_6    : 0x00be,
SMSG_WHO_ANSWER              : 0x00c2,
	SMSG_PLAYER_WARP             : 0x0091,
	SMSG_PLAYER_INVENTORY        : 0x01ee,
	SMSG_PLAYER_INVENTORY_ADD    : 0x00a0,
	SMSG_PLAYER_INVENTORY_REMOVE : 0x00af,
	SMSG_PLAYER_INVENTORY_USE    : 0x01c8,
	SMSG_PLAYER_EQUIPMENT        : 0x00a4,
	SMSG_PLAYER_EQUIP            : 0x00aa,
	SMSG_PLAYER_UNEQUIP          : 0x00ac,
	SMSG_PLAYER_ATTACK_RANGE     : 0x013a,
	SMSG_PLAYER_ARROW_EQUIP      : 0x013c,
	SMSG_PLAYER_ARROW_MESSAGE    : 0x013b,
	SMSG_PLAYER_SKILLS           : 0x010f,
	SMSG_PLAYER_SKILL_UP         : 0x010e, // same as SMSG_GUILD_SKILL_UP
	SMSG_SKILL_FAILED            : 0x0110,
SMSG_SKILL_DAMAGE            : 0x01de,
	SMSG_ITEM_USE_RESPONSE       : 0x00a8,
	SMSG_ITEM_VISIBLE            : 0x009d,
	SMSG_ITEM_DROPPED            : 0x009e,
	SMSG_ITEM_REMOVE             : 0x00a1,
	SMSG_BEING_VISIBLE           : 0x0078,
	SMSG_BEING_MOVE              : 0x007b,
	SMSG_BEING_SPAWN             : 0x007c,
SMSG_BEING_MOVE2             : 0x0086,
	SMSG_BEING_REMOVE            : 0x0080,
SMSG_BEING_CHANGE_LOOKS      : 0x00c3,
	SMSG_BEING_CHANGE_LOOKS2     : 0x01d7,
	SMSG_BEING_SELFEFFECT        : 0x019b,
	SMSG_BEING_EMOTION           : 0x00c0,
	SMSG_BEING_ACTION            : 0x008a,
	SMSG_BEING_CHAT              : 0x008d,
	SMSG_BEING_NAME_RESPONSE     : 0x0095,
	SMSG_BEING_CHANGE_DIRECTION  : 0x009c,
	SMSG_BEING_RESURRECT         : 0x0148,

SMSG_PLAYER_STATUS_CHANGE    : 0x0119,
	SMSG_PLAYER_GUILD_PARTY_INFO : 0x0195,
SMSG_BEING_STATUS_CHANGE     : 0x0196,

	SMSG_NPC_MESSAGE             : 0x00b4,
	SMSG_NPC_NEXT                : 0x00b5,
	SMSG_NPC_CLOSE               : 0x00b6,
	SMSG_NPC_CHOICE              : 0x00b7,
	SMSG_NPC_BUY_SELL_CHOICE     : 0x00c4,
	SMSG_NPC_BUY                 : 0x00c6,
	SMSG_NPC_SELL                : 0x00c7,
	SMSG_NPC_BUY_RESPONSE        : 0x00ca,
	SMSG_NPC_SELL_RESPONSE       : 0x00cb,
	SMSG_NPC_INT_INPUT           : 0x0142,
	SMSG_NPC_STR_INPUT           : 0x01d4,
	SMSG_PLAYER_CHAT             : 0x008e,
	SMSG_WHISPER                 : 0x0097,
	SMSG_WHISPER_RESPONSE        : 0x0098,
	SMSG_GM_CHAT                 : 0x009a,
	SMSG_WALK_RESPONSE           : 0x0087,

SMSG_TRADE_REQUEST           : 0x00e5,
SMSG_TRADE_RESPONSE          : 0x00e7,
SMSG_TRADE_ITEM_ADD          : 0x00e9,
SMSG_TRADE_ITEM_ADD_RESPONSE : 0x01b1,
SMSG_TRADE_OK                : 0x00ec,
SMSG_TRADE_CANCEL            : 0x00ee,
SMSG_TRADE_COMPLETE          : 0x00f0,

SMSG_PARTY_CREATE            : 0x00fa,
SMSG_PARTY_INFO              : 0x00fb,
SMSG_PARTY_INVITE_RESPONSE   : 0x00fd,
SMSG_PARTY_INVITED           : 0x00fe,
SMSG_PARTY_SETTINGS          : 0x0101,
SMSG_PARTY_MOVE              : 0x0104,
SMSG_PARTY_LEAVE             : 0x0105,
SMSG_PARTY_UPDATE_HP         : 0x0106,
SMSG_PARTY_UPDATE_COORDS     : 0x0107,
SMSG_PARTY_MESSAGE           : 0x0109,

SMSG_PLAYER_STORAGE_ITEMS    : 0x01f0,
SMSG_PLAYER_STORAGE_EQUIP    : 0x00a6,
SMSG_PLAYER_STORAGE_STATUS   : 0x00f2,
SMSG_PLAYER_STORAGE_ADD      : 0x00f4,
SMSG_PLAYER_STORAGE_REMOVE   : 0x00f6,
SMSG_PLAYER_STORAGE_CLOSE    : 0x00f8,

	SMSG_ADMIN_KICK_ACK          : 0x00cd,
	SMSG_ADMIN_IP                : 0x020c,

SMSG_GUILD_CREATE_RESPONSE   : 0x0167,
SMSG_GUILD_POSITION_INFO     : 0x016c,
SMSG_GUILD_MEMBER_LOGIN      : 0x016d,
SMSG_GUILD_MASTER_OR_MEMBER  : 0x014e,
SMSG_GUILD_BASIC_INFO        : 0x01b6,
SMSG_GUILD_ALIANCE_INFO      : 0x014c,
SMSG_GUILD_MEMBER_LIST       : 0x0154,
SMSG_GUILD_POS_NAME_LIST     : 0x0166,
SMSG_GUILD_POS_INFO_LIST     : 0x0160,
SMSG_GUILD_POSITION_CHANGED  : 0x0174,
SMSG_GUILD_MEMBER_POS_CHANGE : 0x0156,
SMSG_GUILD_EMBLEM            : 0x0152,
SMSG_GUILD_SKILL_INFO        : 0x0162,
SMSG_GUILD_NOTICE            : 0x016f,
SMSG_GUILD_INVITE            : 0x016a,
SMSG_GUILD_INVITE_ACK        : 0x0169,
SMSG_GUILD_LEAVE             : 0x015a,
SMSG_GUILD_EXPULSION         : 0x015c,
SMSG_GUILD_EXPULSION_LIST    : 0x0163,
SMSG_GUILD_MESSAGE           : 0x017f,
SMSG_GUILD_SKILL_UP          : 0x010e, // same as SMSG_PLAYER_SKILL_UP
SMSG_GUILD_REQ_ALLIANCE      : 0x0171,
SMSG_GUILD_REQ_ALLIANCE_ACK  : 0x0173,
SMSG_GUILD_DEL_ALLIANCE      : 0x0184,
SMSG_GUILD_OPPOSITION_ACK    : 0x0181,
SMSG_GUILD_BROKEN            : 0x015e,

SMSG_MVP                     : 0x010c,

/**********************************
 *  Packets from client to server *
 **********************************/
	CMSG_SERVER_VERSION_REQUEST  : 0x7530,
	CMSG_LOGIN_REQUEST           : 0x0064,

CMSG_CHAR_PASSWORD_CHANGE    : 0x0061,
	CMSG_CHAR_SERVER_CONNECT     : 0x0065,
	CMSG_CHAR_SELECT             : 0x0066,
	CMSG_CHAR_CREATE             : 0x0067,
CMSG_CHAR_DELETE             : 0x0068,

	CMSG_MAP_SERVER_CONNECT      : 0x0072,
	CMSG_MAP_LOADED              : 0x007d,
CMSG_CLIENT_QUIT             : 0x018a,

	CMSG_CHAT_MESSAGE            : 0x008c,
	CMSG_CHAT_WHISPER            : 0x0096,

	CMSG_SKILL_LEVELUP_REQUEST   : 0x0112,
	CMSG_STAT_UPDATE_REQUEST     : 0x00bb,
CMSG_SKILL_USE_BEING         : 0x0113,
CMSG_SKILL_USE_POSITION      : 0x0116,
CMSG_SKILL_USE_POSITION_MORE : 0x0190, // Variant of 0x116 with 80 char string at end (unsure of use)
CMSG_SKILL_USE_MAP           : 0x011b,

	CMSG_PLAYER_INVENTORY_USE    : 0x00a7,
	CMSG_PLAYER_INVENTORY_DROP   : 0x00a2,
	CMSG_PLAYER_EQUIP            : 0x00a9,
	CMSG_PLAYER_UNEQUIP          : 0x00ab,

	CMSG_ITEM_PICKUP             : 0x009f,
	CMSG_PLAYER_CHANGE_DIR       : 0x009b,
	CMSG_PLAYER_CHANGE_DEST      : 0x0085,
	CMSG_PLAYER_CHANGE_ACT       : 0x0089, // same as CMSG_PLAYER_ATTACK
	CMSG_PLAYER_RESTART          : 0x00b2, // respawn and switch character
	CMSG_PLAYER_EMOTE            : 0x00bf,
	CMSG_PLAYER_ATTACK           : 0x0089, // same as CMSG_PLAYER_CHANGE_ACT
CMSG_WHO_REQUEST             : 0x00c1,

	CMSG_NPC_TALK                : 0x0090,
	CMSG_NPC_NEXT_REQUEST        : 0x00b9,
	CMSG_NPC_CLOSE               : 0x0146,
	CMSG_NPC_LIST_CHOICE         : 0x00b8,
	CMSG_NPC_INT_RESPONSE        : 0x0143,
	CMSG_NPC_STR_RESPONSE        : 0x01d5,
	CMSG_NPC_BUY_SELL_REQUEST    : 0x00c5,
	CMSG_NPC_BUY_REQUEST         : 0x00c8,
	CMSG_NPC_SELL_REQUEST        : 0x00c9,

CMSG_TRADE_REQUEST           : 0x00e4,
CMSG_TRADE_RESPONSE          : 0x00e6,
CMSG_TRADE_ITEM_ADD_REQUEST  : 0x00e8,
CMSG_TRADE_CANCEL_REQUEST    : 0x00ed,
CMSG_TRADE_ADD_COMPLETE      : 0x00eb,
CMSG_TRADE_OK                : 0x00ef,

CMSG_PARTY_CREATE            : 0x00f9,
CMSG_PARTY_INVITE            : 0x00fc,
CMSG_PARTY_INVITED           : 0x00ff,
CMSG_PARTY_LEAVE             : 0x0100,
CMSG_PARTY_SETTINGS          : 0x0102,
CMSG_PARTY_KICK              : 0x0103,
CMSG_PARTY_MESSAGE           : 0x0108,

CMSG_MOVE_TO_STORAGE         : 0x00f3,
CMSG_MOVE_FROM_STORAGE       : 0x00f5,
CMSG_CLOSE_STORAGE           : 0x00f7,

CMSG_ADMIN_ANNOUNCE          : 0x0099,
CMSG_ADMIN_LOCAL_ANNOUNCE    : 0x019c,
CMSG_ADMIN_HIDE              : 0x019d,
CMSG_ADMIN_KICK              : 0x00cc,
CMSG_ADMIN_MUTE              : 0x0149,

CMSG_GUILD_CHECK_MASTER      : 0x014d,
CMSG_GUILD_REQUEST_INFO      : 0x014f,
CMSG_GUILD_REQUEST_EMBLEM    : 0x0151,
CMSG_GUILD_CHANGE_EMBLEM     : 0x0153,
CMSG_GUILD_CHANGE_MEMBER_POS : 0x0155,
CMSG_GUILD_LEAVE             : 0x0159,
CMSG_GUILD_EXPULSION         : 0x015b,
CMSG_GUILD_BREAK             : 0x015d,
CMSG_GUILD_CHANGE_POS_INFO   : 0x0161,
CMSG_GUILD_CREATE            : 0x0165,
CMSG_GUILD_INVITE            : 0x0168,
CMSG_GUILD_INVITE_REPLY      : 0x016b,
CMSG_GUILD_CHANGE_NOTICE     : 0x016e,
CMSG_GUILD_ALLIANCE_REQUEST  : 0x0170,
CMSG_GUILD_ALLIANCE_REPLY    : 0x0172,
CMSG_GUILD_MESSAGE           : 0x017e,
CMSG_GUILD_OPPOSITION        : 0x0180,
CMSG_GUILD_ALLIANCE_DELETE   : 0x0183,
};

tmw.packet_lengths = [
 10,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
// #0x0040
  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
  0,  50,   3,  -1,  55,  17,   3,  37,  46,  -1,  23,  -1,   3, 108,   3,   2,
  3,  28,  19,  11,   3,  -1,   9,   5,  54,  53,  58,  60,  41,   2,   6,   6,
// #0x0080
  7,   3,   2,   2,   2,   5,  16,  12,  10,   7,  29,  23,  -1,  -1,  -1,   0,
  7,  22,  28,   2,   6,  30,  -1,  -1,   3,  -1,  -1,   5,   9,  17,  17,   6,
 23,   6,   6,  -1,  -1,  -1,  -1,   8,   7,   6,   7,   4,   7,   0,  -1,   6,
  8,   8,   3,   3,  -1,   6,   6,  -1,   7,   6,   2,   5,   6,  44,   5,   3,
// #0x00C0
  7,   2,   6,   8,   6,   7,  -1,  -1,  -1,  -1,   3,   3,   6,   6,   2,  27,
  3,   4,   4,   2,  -1,  -1,   3,  -1,   6,  14,   3,  -1,  28,  29,  -1,  -1,
 30,  30,  26,   2,   6,  26,   3,   3,   8,  19,   5,   2,   3,   2,   2,   2,
  3,   2,   6,   8,  21,   8,   8,   2,   2,  26,   3,  -1,   6,  27,  30,  10,
// #0x0100
  2,   6,   6,  30,  79,  31,  10,  10,  -1,  -1,   4,   6,   6,   2,  11,  -1,
 10,  39,   4,  10,  31,  35,  10,  18,   2,  13,  15,  20,  68,   2,   3,  16,
  6,  14,  -1,  -1,  21,   8,   8,   8,   8,   8,   2,   2,   3,   4,   2,  -1,
  6,  86,   6,  -1,  -1,   7,  -1,   6,   3,  16,   4,   4,   4,   6,  24,  26,
// #0x0140
 22,  14,   6,  10,  23,  19,   6,  39,   8,   9,   6,  27,  -1,   2,   6,   6,
110,   6,  -1,  -1,  -1,  -1,  -1,   6,  -1,  54,  66,  54,  90,  42,   6,  42,
 -1,  -1,  -1,  -1,  -1,  30,  -1,   3,  14,   3,  30,  10,  43,  14, 186, 182,
 14,  30,  10,   3,  -1,   6, 106,  -1,   4,   5,   4,  -1,   6,   7,  -1,  -1,
// #0x0180
  6,   3,  106,  10,  10, 34,   0,   6,   8,   4,   4,   4,  29,  -1,  10,   6,
 90,  86,  24,   6,  30, 102,   9,   4,   8,   4,  14,  10,   4,   6,   2,   6,
  3,   3,  35,   5,  11,  26,  -1,   4,   4,   6,  10,  12,   6,  -1,   4,   4,
 11,   7,  -1,  67,  12,  18, 114,   6,   3,   6,  26,  26,  26,  26,   2,   3,
// #0x01C0
  2,  14,  10,  -1,  22,  22,   4,   2,  13,  97,   0,   9,   9,  29,   6,  28,
  8,  14,  10,  35,   6,  -1,   4,  11,  54,  53,  60,   2,  -1,  47,  33,   6,
 30,   8,  34,  14,   2,   6,  26,   2,  28,  81,   6,  10,  26,   2,  -1,  -1,
 -1,  -1,  20,  10,  32,   9,  34,  14,   2,   6,  48,  56,  -1,   4,   5,  10,
// #0x0200
 26,   0,   0,   0,  18,   0,   0,   0,   0,   0,   0,  19,  10,   0,   0,   0,
  2,  -1,  16,   0,   8,  -1,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
 -1, 122,  -1,  -1,  -1,
];
