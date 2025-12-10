// server.js
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量里拿 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 没有配置");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

app.use(express.json());
app.use(express.static("public"));

// 读取最近一条日志
app.get("/api/logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("order_logs")
      .select("issue_log, send_log")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // 表里没有数据时返回 null

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "db_select_failed" });
    }

    if (!data) {
      // 表里还没有记录
      return res.json({ issue_log: "", send_log: "" });
    }

    res.json({
      issue_log: data.issue_log || "",
      send_log: data.send_log || "",
    });
  } catch (err) {
    console.error("GET /api/logs error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// 手动保存：往表里插入一条新记录
app.post("/api/logs", async (req, res) => {
  try {
    const { issue_log, send_log } = req.body || {};

    const { error } = await supabase.from("order_logs").insert({
      issue_log: issue_log || "",
      send_log: send_log || "",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "db_insert_failed" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/logs error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
