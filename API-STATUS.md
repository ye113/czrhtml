# 离线模式状态 API 对接说明

其他后端通过下面的接口读取是否启用离线模式。改开关在网站管理页完成，写入后立即生效，无需重新部署业务项目。

## 接口

- **方法**：`GET`
- **地址**：`https://gm.goodme.qzz.io/api/status`
- **鉴权**：无需（公开只读）
- **缓存**：响应头为 `Cache-Control: no-store`，不要依赖 CDN 长缓存

## 成功响应

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, max-age=0
```

```json
{
  "offline": false,
  "updatedAt": "2026-08-10T14:14:38.400Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `offline` | `boolean` | `true` = 离线模式开启；`false` = 在线 |
| `updatedAt` | `string \| null` | 最近一次修改时间（ISO 8601）。从未保存过时可能为 `null` |

## 使用约定

1. 以 `offline === true` 判定进入离线逻辑。
2. 建议业务侧短缓存 **10–60 秒**，避免过于频繁请求。
3. 请求失败（超时 / 非 200 / JSON 解析失败）时，由业务自行决定降级策略（例如保持上次状态，或默认在线）。

## 调用示例

### curl

```bash
curl -sS https://gm.goodme.qzz.io/api/status
```

### Node.js

```js
async function fetchOfflineStatus() {
  const res = await fetch('https://gm.goodme.qzz.io/api/status', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`status api http ${res.status}`);
  }
  const data = await res.json();
  return {
    offline: Boolean(data.offline),
    updatedAt: data.updatedAt ?? null,
  };
}
```

### Python

```python
import requests

def fetch_offline_status(timeout=5):
    r = requests.get(
        "https://gm.goodme.qzz.io/api/status",
        headers={"Cache-Control": "no-cache"},
        timeout=timeout,
    )
    r.raise_for_status()
    data = r.json()
    return {
        "offline": bool(data.get("offline")),
        "updatedAt": data.get("updatedAt"),
    }
```

### C# / .NET

```csharp
using var http = new HttpClient();
http.DefaultRequestHeaders.CacheControl =
    new System.Net.Http.Headers.CacheControlHeaderValue { NoCache = true };

var json = await http.GetStringAsync("https://gm.goodme.qzz.io/api/status");
using var doc = System.Text.Json.JsonDocument.Parse(json);
var offline = doc.RootElement.GetProperty("offline").GetBoolean();
```

## 管理入口（仅运维，不给业务项目调用）

- 页面：`https://gm.goodme.qzz.io/admin-status.html`
- 或打开首页后，左上角头像连续点击 3 次
- 修改需要管理密码（配置在 Cloudflare Pages 的 `STATUS_PASSWORD`）

业务项目 **只读** `GET /api/status`，不要对接保存接口。
