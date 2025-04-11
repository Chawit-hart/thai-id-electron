const pcsclite = require("pcsclite");
const { SELECT_THAI_ID_CARD } = require("./apdu");
const { readCardData } = require("./handlers");

const disconnectAsync = (reader) => {
  return new Promise((resolve, reject) => {
    reader.disconnect(reader.SCARD_UNPOWER_CARD, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const connectAsync = (reader) => {
  return new Promise((resolve, reject) => {
    reader.connect(
      { share_mode: reader.SCARD_SHARE_SHARED, protocol: reader.SCARD_PROTOCOL_T0 },
      (err, protocol) => {
        if (err) reject(err);
        else resolve(protocol);
      }
    );
  });
};

const transmitAsync = (reader, command, protocol) => {
  return new Promise((resolve, reject) => {
    reader.transmit(command, 255, protocol, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const handleCardInsert = async (reader) => {
  try {
    await disconnectAsync(reader);
    const protocol = await connectAsync(reader);
    await transmitAsync(reader, SELECT_THAI_ID_CARD, protocol);
    const cardData = await readCardData(reader, protocol);
    return cardData;
  } catch (error) {
    throw error;
  }
};

const initializeReaderAndRead = () => {
  const pcsc = pcsclite();

  return new Promise((resolve, reject) => {
    let timeoutId;

    pcsc.on("reader", (reader) => {
      console.log(`🔍 พบเครื่องอ่านบัตร: ${reader.name}`);

      reader.on("status", async (status) => {
        const cardInserted = (status.state & reader.SCARD_STATE_PRESENT) &&
                             !(reader.state & reader.SCARD_STATE_PRESENT);

        if (cardInserted) {
          console.log("✅ บัตรถูกเสียบแล้ว");
          clearTimeout(timeoutId);

          try {
            const data = await handleCardInsert(reader);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        }
      });

      timeoutId = setTimeout(() => {
        console.log("⚠️ ยังไม่ได้เสียบบัตร");
        reject(new Error("ยังไม่ได้เสียบบัตร"));
      }, 10000);
    });
  });
};

module.exports = { initializeReaderAndRead };
