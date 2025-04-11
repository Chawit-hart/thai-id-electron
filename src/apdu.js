module.exports = {
  SELECT_THAI_ID_CARD: Buffer.from("00A4040008A000000054480001", "hex"),

  APDU_COMMANDS: {
    cid: Buffer.from("80B0000402000D", "hex"),
    fullNameThai: Buffer.from("80B00011020064", "hex"),
    fullNameEng: Buffer.from("80B00075020064", "hex"),
    birthDate: Buffer.from("80B000D9020008", "hex"),
    gender: Buffer.from("80B000E1020001", "hex"),
    address: Buffer.from("80B01579020064", "hex"),
    issueDate: Buffer.from("80B00167020008", "hex"),
    expiryDate: Buffer.from("80B0016F020008", "hex"),
  },

  CMD_GET_RESPONSE: (length) => Buffer.from(`00C00000${length.toString(16).padStart(2, "0")}`, "hex"),
};
