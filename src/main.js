const express = require("express");
const cors = require("cors");
const { initializeReaderAndRead } = require("./reader");

const app = express();
app.use(cors());

app.get("/api/read-id-card", async (req, res) => {
  try {
    const cardData = await initializeReaderAndRead();
    res.json({ success: true, data: cardData });
  } catch (err) {
    console.error("❌ Error reading card:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(5001, "0.0.0.0", () => {
  console.log("✅ Server running on 0.0.0.0:5001");
});

