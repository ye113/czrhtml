# czrhtml

个人项目静态网站（Cloudflare Pages + GitHub 自动部署）。

线上地址：<https://gm.goodme.qzz.io/>

## 离线模式远程开关

其他后端可通过固定接口读取是否启用离线模式。网站管理页可改开关，写入 Cloudflare KV 后立即生效，无需重新部署。

### 读取（给其他后端）

```http
GET https://gm.goodme.qzz.io/api/status
```

成功响应示例：

```json
{
  "offline": false,
  "updatedAt": "2026-08-10T13:44:00.000Z"
}
```

- `offline === true`：走离线逻辑
- 响应带 `Cache-Control: no-store`
- 建议后端自行短缓存 10–60 秒

### 管理密码放哪里

**不要写进仓库 / HTML / JS。**

放到 Cloudflare Pages 项目环境变量里：

1. Cloudflare Dashboard → Workers & Pages → 你的项目  
2. Settings → Environment variables（Production）  
3. 新增：  
   - Name：`STATUS_PASSWORD`  
   - Value：你自己设的密码（勾选 Encrypt / 存为 Secret）  
4. 同时确认 KV 绑定名是 `STATUS_KV`  

管理页里输入的就是这个 `STATUS_PASSWORD`；校验在服务端 Function 里完成。

### 管理页（改开关）

打开：<https://gm.goodme.qzz.io/admin-status.html>

也可在首页左上角头像 **连续点击 3 次** 进入。填写 Cloudflare 中配置的管理密码，切换「离线模式」后点保存。

### Cloudflare 控制台一次性配置

代码推送到 GitHub 并由 Pages 部署后，在对应 Pages 项目里完成：

1. **创建 KV namespace**（Workers & Pages → KV）
2. **绑定到本项目**  
   Pages 项目 → Settings → Functions → KV namespace bindings  
   - Variable name / Binding：`STATUS_KV`
3. **设置管理密码**  
   Pages 项目 → Settings → Environment variables（Production）  
   - Name：`STATUS_PASSWORD`  
   - Value：你的密码（建议 Encrypt / Secret）
4. 如有 Preview 环境也要用，给 Preview 同样绑 KV 和变量
5. 配置保存后如接口仍报 missing binding，触发一次重新部署

本地可用（可选）：

```bash
npx wrangler pages dev . --kv=STATUS_KV --binding STATUS_PASSWORD=dev-password
```
