# Gemini API 代理设置说明

## 如何使用代理地址

本项目已支持通过环境变量配置 Gemini API 代理地址。

### 设置方法

#### 1. 使用 .env.local 文件（推荐）

在项目根目录创建或编辑 `.env.local` 文件：

```env
# Gemini API Key（必需）
GEMINI_API_KEY=your_api_key_here

# Gemini 代理地址（可选）
GEMINI_BASE_URL=https://your-proxy-domain.com/v1beta
```

#### 2. 系统环境变量

也可以直接设置系统环境变量：

```bash
# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"
$env:GEMINI_BASE_URL="https://your-proxy-domain.com/v1beta"

# macOS/Linux
export GEMINI_API_KEY="your_api_key_here"
export GEMINI_BASE_URL="https://your-proxy-domain.com/v1beta"
```

### 代理地址示例

```env
# 使用 CloudFlare 代理
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# 使用自建代理服务
GEMINI_BASE_URL=https://your-proxy.example.com/gemini/v1beta

# 使用第三方代理服务
GEMINI_BASE_URL=https://api-proxy.example.com/google/v1beta
```

### 启动应用

设置完成后，正常启动应用：

```bash
npm run dev
```

### 验证设置

如果设置了代理地址，启动时控制台会显示：
```
使用代理地址: https://your-proxy-domain.com/v1beta
```

### 注意事项

1. **API Key 依然必需**：即使使用代理，仍需要有效的 Gemini API Key
2. **代理地址格式**：确保代理地址包含正确的 API 版本路径
3. **HTTPS 协议**：建议使用 HTTPS 协议确保安全性
4. **网络连通性**：确保代理服务器可正常访问

### 常见代理服务

- **自建反向代理**：使用 Nginx、Cloudflare Workers 等
- **API 网关**：使用 Kong、Traefik 等
- **第三方代理服务**：各种 API 代理服务商

### 故障排除

如果遇到连接问题：

1. 检查代理地址是否正确
2. 验证代理服务是否正常运行
3. 确认 API Key 有效性
4. 查看浏览器开发者工具的网络请求