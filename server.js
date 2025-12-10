// server.js  — 用 ES Module 写法

import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// 让 __dirname 在 ES module 里也能用
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== 静态文件（public/index.html 等）======
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ====== Supabase 客户端 ======
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️ Supabase 环境变量缺失，请在 Render Environment 里设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====== API：读取日志（只取最新一条）======
app.get("/api/logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("order_logs")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "database error" });
    }

    const row = data && data[0] ? data[0] : { issue_log: "", send_log: "" };

    res.json({
      data: {
        issue_log: row.issue_log || "",
        send_log: row.send_log || "",
      },
    });
  } catch (err) {
    console.error("GET /api/logs exception:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ====== API：保存日志（插入一条新记录）======
app.post("/api/logs", async (req, res) => {
  try {
    const { issue_log, send_log } = req.body || {};

    const { data, error } = await supabase
      .from("order_logs")
      .insert({
        issue_log: issue_log || "",
        send_log: send_log || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "database error" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error("POST /api/logs exception:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ====== 启动服务器 ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
