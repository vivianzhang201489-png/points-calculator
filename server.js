import express from "express";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ----------------------
// 取得最新日志 (从数据库读取)
// ----------------------
app.get("/api/logs", async (req, res) => {
  const { data, error } = await supabase
    .from("order_logs")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("读取数据库失败：", error);
    return res.json({ issue_log: "", send_log: "" });
  }

  if (data && data.length > 0) {
    return res.json({
      issue_log: data[0].issue_log || "",
      send_log: data[0].send_log || "",
    });
  }

  return res.json({ issue_log: "", send_log: "" });
});

// ----------------------
// 保存日志到数据库
// ----------------------
app.post("/api/logs", async (req, res) => {
  const { issue_log, send_log } = req.body;

  const { error } = await supabase.from("order_logs").insert([
    {
      issue_log,
      send_log,
    },
  ]);

  if (error) {
    console.error("写入数据库失败：", error);
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

// ----------------------
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
