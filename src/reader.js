const pcsclite = require("pcsclite");
const { SELECT_THAI_ID_CARD } = require("./apdu");
const { readCardData } = require("./handlers");

const disconnectAsync = (reader) =>
  new Promise((resolve, reject) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
      if (err) {
        console.warn("⚠️ Disconnect failed:", err.message);
        return reject(err);
      }
      resolve();
    });
  });

const connectAsync = (reader) =>
  new Promise((resolve, reject) => {
    reader.disconnect(reader.SCARD_LEAVE_CARD, () => {
      reader.connect(
        {
          share_mode: reader.SCARD_SHARE_SHARED,
          protocol: reader.SCARD_PROTOCOL_T0 | reader.SCARD_PROTOCOL_T1,
        },
        (err, protocol) => {
          if (err) return reject(new Error(`❌ Connect error: ${err.message}`));
          if (typeof protocol !== "number") {
            return reject(new Error("❌ Invalid protocol returned from reader.connect"));
          }
          resolve(protocol);
        }
      );
    });
  });

const transmitAsync = (reader, command, protocol) =>
  new Promise((resolve, reject) => {
    reader.transmit(command, 255, protocol, (err, response) => {
      if (err) return reject(new Error(`❌ Transmit error: ${err.message}`));
      resolve(response);
    });
  });

const handleCardInsert = async (reader) => {
  try {
    const protocol = await connectAsync(reader);
    await transmitAsync(reader, SELECT_THAI_ID_CARD, protocol);
    const cardData = await readCardData(reader, protocol);
    await disconnectAsync(reader);
    return cardData;
  } catch (error) {
    await disconnectAsync(reader).catch(() => {});
    throw error;
  }
};

const initializeReaderAndRead = () => {
  const pcsc = pcsclite();

  return new Promise((resolve, reject) => {
    let timeoutId;
    let hasResolved = false;

    pcsc.on("reader", (reader) => {
      reader.on("status", async (status) => {
        const isCardInserted = status.state & reader.SCARD_STATE_PRESENT;

        if (isCardInserted && !hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);

          try {
            const data = await handleCardInsert(reader);
            pcsc.close();
            resolve(data);
          } catch (err) {
            pcsc.close();
            reject(err);
          }
        }
      });

      setTimeout(() => {
        reader.emit("status", reader);
      }, 50);

      timeoutId = setTimeout(() => {
        if (!hasResolved) {
          pcsc.close();
          reject(new Error("ยังไม่ได้เสียบบัตร"));
        }
      }, 10000);
    });

    pcsc.on("error", (err) => {
      reject(new Error(`❌ PCSC error: ${err.message}`));
    });
  });
};

module.exports = { initializeReaderAndRead };
