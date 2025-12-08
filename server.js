// server.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

// 数据文件路径（跟 server.js 同一目录）
const DATA_FILE = path.join(__dirname, "data.json");

// 读数据
async function readData() {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    const json = JSON.parse(text);

    // 确保有这两个字段
    return {
      issue_log: json.issue_log ?? "",
      send_log: json.send_log ?? "",
    };
  } catch (err) {
    // 文件不存在或解析失败，就返回空
    return { issue_log: "", send_log: "" };
  }
}

// 写数据
async function writeData(data) {
  const safeData = {
    issue_log: data.issue_log ?? "",
    send_log: data.send_log ?? "",
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(safeData, null, 2), "utf8");
}

app.use(express.json());

// 静态文件（你的前端页面）
app.use(express.static("public"));

// 读取日志
app.get("/api/logs", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    console.error("读取日志失败:", err);
    res.status(500).json({ ok: false, error: "read_failed" });
  }
});

// 保存日志
app.post("/api/logs", async (req, res) => {
  try {
    const { issue_log = "", send_log = "" } = req.body || {};
    await writeData({ issue_log, send_log });
    res.json({ ok: true });
  } catch (err) {
    console.error("保存日志失败:", err);
    res.status(500).json({ ok: false, error: "save_failed" });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
