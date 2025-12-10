import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 静态文件（index.html）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------
   ✅ 读取 Supabase 环境变量
   （注意：这里不会写 key，key 存在 Render 的 Environment）
----------------------- */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 如果没读到环境变量，直接提示错误
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Supabase 环境变量缺失！");
  console.error("必须设置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/* ----------------------
   ✅ API：读取日志
----------------------- */
app.get("/api/logs", async (req, res) => {
  const { data, error } = await supabase
    .from("order_logs")
    .select("*")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error });
  }

  const row = data.length > 0 ? data[0] : { issue_log: "", send_log: "" };
  res.json({
    ok: true,
    data: {
      issue_log: row.issue_log || "",
      send_log: row.send_log || "",
    },
  });
});

/* ----------------------
   ✅ API：保存日志（手动保存）
----------------------- */
app.post("/api/logs", async (req, res) => {
  const { issue_log, send_log } = req.body;

  if (!issue_log && !send_log) {
    return res.json({ ok: false, message: "内容为空" });
  }

  // 确保表中只有一条记录：id = 1
  const { error } = await supabase.from("order_logs").upsert({
    id: 1,
    issue_log,
    send_log,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ 保存失败：", error);
    return res.status(500).json({ ok: false, error });
  }

  res.json({ ok: true });
});

/* ----------------------
   启动服务器
----------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
