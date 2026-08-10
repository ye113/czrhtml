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

1. **创建 KV namespace**（若还没有）  
   Workers & Pages → KV → Create a namespace
2. **在 Pages 项目里绑定 KV**  
   打开你的 Pages 项目 → **Settings** → **Bindings**（或 Functions → KV namespace bindings）→ **Add**  
   - Variable name：`STATUS_KV`（必须一致）  
   - KV namespace：选你创建的那个  
   - 环境：Production  
   若之前因 `wrangler.toml` 提示“绑定由配置文件管理”，仓库已不再使用该文件；重新部署后即可在控制台添加绑定。
3. **设置管理密码**  
   Settings → Variables and Secrets（Production）  
   - Name：`STATUS_PASSWORD`  
   - Value：你的密码（Encrypt / Secret）
4. **重新部署**（Deployments → Retry deployment）  
5. 验证：  
   - `https://gm.goodme.qzz.io/api/status`  
   - `https://gm.goodme.qzz.io/admin-status.html`
