// server.js
const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 日志文件路径（和 server.js 同目录）
const DATA_FILE = path.join(__dirname, "logs.json");

// 中间件：解析 JSON、提供静态页面
app.use(express.json());
app.use(express.static("public"));

// 读取文件中的数据
async function readData() {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(text);
  } catch (err) {
    // 文件不存在时，返回默认空内容
    if (err.code === "ENOENT") {
      return { issue_log: "", send_log: "" };
    }
    throw err;
  }
}

// 写入文件
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// 读取日志接口
app.get("/api/logs", async (req, res) => {
  try {
    const data = await readData();
    res.json({ ok: true, data });
  } catch (err) {
    console.error("读取日志失败:", err);
    res.status(500).json({ ok: false, message: "read_failed" });
  }
});

// 保存日志接口
app.post("/api/logs", async (req, res) => {
  try {
    const { issue_log = "", send_log = "" } = req.body || {};
    await writeData({ issue_log, send_log });
    res.json({ ok: true });
  } catch (err) {
    console.error("保存日志失败:", err);
    res.status(500).json({ ok: false, message: "save_failed" });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
