const { APDU_COMMANDS, CMD_GET_RESPONSE } = require("./apdu");
const { decodeThai, formatDate, formatGender, splitFullName, parseAddress } = require("./utils");

const readCardData = (reader, protocol) => {
  const keys = Object.keys(APDU_COMMANDS);
  let index = 0;
  const result = {};

  return new Promise((resolve, reject) => {
    function next() {
      if (index >= keys.length) {
        reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
          if (err) console.error("❌ Disconnect Error:", err.message);
          else console.log("🔒 ยกเลิกการเชื่อมต่อสำเร็จ");
        });
        return resolve(result);
      }

      const key = keys[index++];
      const label = getLabel(key);
      const cmd = APDU_COMMANDS[key];

      reader.transmit(cmd, 255, protocol, async (err, data) => {
        if (err) {
          console.error(`❌ อ่านข้อมูล ${label} ไม่สำเร็จ:`, err.message);
          result[key] = null;
          return next();
        }

        try {
          const value = await handleResponse(reader, protocol, data, getExpectedLength(key), key);
          result[key] = value;
        } catch (e) {
          console.error(`❌ เกิดข้อผิดพลาดในการแปลงข้อมูล ${label}:`, e.message);
          result[key] = null;
        }

        next();
      });
    }

    next();
  });
};

const handleResponse = async (reader, protocol, data, expectedLength, key) => {
  let value;

  if (data[data.length - 2] === 0x61) {
    const response = await transmitAsync(reader, CMD_GET_RESPONSE(data[data.length - 1]), protocol);
    value = decodeThai(response.slice(0, expectedLength));
  } else {
    value = decodeThai(data.slice(0, expectedLength));
  }
  console.log("📥 Response raw:", data);
  return formatData(value, key);
};

const transmitAsync = (reader, command, protocol) => {
  return new Promise((resolve, reject) => {
    reader.transmit(command, 255, protocol, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const formatData = (value, key) => {
  if (key === "birthDate") {
    return value.trim() ? formatDate(value) : "-";
  }
  if (key === "issueDate" || key === "expiryDate") {
    return formatDate(value);
  }
  if (key === "gender") {
    return formatGender(value);
  }
  if (key === "religion") {
    return value.trim() ? value : "-";
  }
  if (key === "fullNameThai" || key === "fullNameEng") {
    return splitFullName(value);
  }
  if (key === "address") {
    return parseAddress(value);
  }
  return value;
};

const getLabel = (key) => ({
  cid: "เลขบัตรประชาชน",
  fullNameThai: "ชื่อ-นามสกุล (ไทย)",
  fullNameEng: "ชื่อ-นามสกุล (อังกฤษ)",
  birthDate: "วันเกิด",
  gender: "เพศ",
  address: "ที่อยู่",
  issueDate: "วันออกบัตร",
  expiryDate: "วันหมดอายุ",
  religion: "ศาสนา",
}[key] || key);

const getExpectedLength = (key) =>
  ({ cid: 13, fullNameThai: 100, birthDate: 8, gender: 1, issueDate: 8, expiryDate: 8 }[key] || 255);

module.exports = { readCardData };
