const iconv = require("iconv-lite");
const ExcelJS = require("exceljs");
const path = require("path");

let thaiAddressData = [];

async function loadThaiAddressData() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(__dirname, "..", "data", "data.xlsx"));
    const worksheet = workbook.getWorksheet(1);
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        rows.push({
          province: String(row.getCell(1).value || "").trim(),
          amphoe: String(row.getCell(2).value || "").trim(),
          district: String(row.getCell(3).value || "").trim(),
          zipcode: String(row.getCell(4).value || "").trim(),
        });
      }
    });
    thaiAddressData = rows;
    console.log("Loaded thaiAddressData:", thaiAddressData);
  } catch (error) {
    console.error("Error loading thaiAddressData:", error);
  }
}
loadThaiAddressData();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const decodeThai = (buffer) => {
  return iconv.decode(buffer, "tis620")
    .replace(/\x00+/g, "")
    .replace(/#+/g, " ")
    .replace(/[^\u0E00-\u0E7F\u0020-\u007E]/g, "")
    .trim();
};

const formatDate = (dateStr) => {
  if (dateStr.length === 8) {
    let year = parseInt(dateStr.substring(0, 4), 10);
    let monthIndex = parseInt(dateStr.substring(4, 6), 10) - 1;
    let day = dateStr.substring(6, 8);
    if (monthIndex < 0 || monthIndex > 11) return "-";
    return `${day} ${MONTHS[monthIndex]} ${year}`;
  }
  return "-";
};

const formatGender = (gender) => {
  return gender === "1" ? "ชาย" : gender === "2" ? "หญิง" : "ไม่ระบุ";
};

const splitFullName = (fullName) => {
  if (!fullName || typeof fullName !== "string")
    return { title: "-", firstname: "-", lastname: "-" };

  const parts = fullName.trim().replace(/\s+/g, " ").split(" ");
  const titles = ["นาย", "นาง", "นางสาว", "Mr.", "Miss", "Ms.", "Mrs."];
  let title = parts[0];
  if (!titles.includes(title)) {
    title = "-";
  } else {
    parts.shift();
  }
  if (parts.length < 2)
    return { title, firstname: parts.join(" "), lastname: "-" };

  const lastname = parts.pop();
  const firstname = parts.join(" ");
  return { title, firstname, lastname };
};

const findPostcode = ({ province, district, subDistrict }) => {
  const normalizedProvince = province.trim().toLowerCase();
  const normalizedAmphoe = district.replace(/^(อ\.|เขต)/, "").trim().toLowerCase();
  const normalizedSubDistrict = subDistrict.trim().toLowerCase();

  console.log("Lookup values:", {
    province: normalizedProvince,
    amphoe: normalizedAmphoe,
    district: normalizedSubDistrict,
  });

  const record = thaiAddressData.find(row =>
    (row.province ?? "").toLowerCase().trim() === normalizedProvince &&
    (row.amphoe ?? "").toLowerCase().trim() === normalizedAmphoe &&
    (row.district ?? "").toLowerCase().trim() === normalizedSubDistrict
  );

  if (record) {
    console.log("Found record:", record);
    return record.zipcode;
  } else {
    console.log("ไม่พบข้อมูล สำหรับ:", {
      province: normalizedProvince,
      amphoe: normalizedAmphoe,
      district: normalizedSubDistrict,
    });
  }
  console.log("All data from Excel:", JSON.stringify(thaiAddressData, null, 2));
  return "";
};

const parseAddress = (addressStr) => {
  addressStr = addressStr.trim();
  let addressObj = null;

  const regexFull = /^(?<houseNo>\S+)(?:\s+หมู่(?:\s*)?(?<moo>\S+))?(?:\s+(?:ซอย|ซ\.)\s*(?<soi>\S+))?(?:\s+(?:ถนน|ถ\.)\s*(?<road>\S+))?\s+(?:ต\.|แขวง)\s*(?<subDistrict>\S+)\s+(?:อ\.|เขต)\s*(?<district>\S+)\s+(?:จ\.|จังหวัด)\s*(?<province>.+)$/;
  let match = addressStr.match(regexFull);
  if (match && match.groups) {
    addressObj = {
      houseNo: match.groups.houseNo || "",
      moo: match.groups.moo || "",
      soi: match.groups.soi || "",
      road: match.groups.road || "",
      subDistrict: match.groups.subDistrict || "",
      district: match.groups.district || "",
      province: match.groups.province || ""
    };
  } else {
    const regexBangkok = /^(?<houseNo>\S+)(?:\s+ซอย\s*(?<soi>.+?))?(?:\s+(?:ถนน|ถ\.)\s*(?<road>\S+))?\s+(?:แขวง\s*(?<subDistrict>\S+)\s+)?เขต\s*(?<district>\S+)\s+(?<province>กรุงเทพมหานคร)$/;
    match = addressStr.match(regexBangkok);
    if (match && match.groups) {
      addressObj = {
        houseNo: match.groups.houseNo || "",
        moo: "",
        soi: match.groups.soi || "",
        road: match.groups.road || "",
        subDistrict: match.groups.subDistrict || "",
        district: match.groups.district || "",
        province: match.groups.province || ""
      };
    }
  }

  if (addressObj) {
    let postcode = "";
    try {
      postcode = findPostcode({
        province: addressObj.province,
        district: addressObj.district,
        subDistrict: addressObj.subDistrict
      }) || "";
    } catch (error) {
      console.error("Error lookup postcode:", error);
    }
    addressObj.postcode = postcode;
    return addressObj;
  }

  return { raw: addressStr, postcode: "" };
};

module.exports = {
  decodeThai,
  formatDate,
  formatGender,
  splitFullName,
  parseAddress
};
