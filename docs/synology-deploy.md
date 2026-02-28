# Nexus EAM -- 群晖 NAS 部署指南

## 前提条件

- 群晖 DSM 7.x
- 已安装 **Container Manager**（套件中心搜索安装）
- NAS 可以访问 Docker Hub（拉取基础镜像）

---

## 步骤一：上传项目文件到 NAS

### 方式 A：通过 File Station

1. 在 File Station 中创建共享文件夹（例如 `docker`）
2. 在 `docker` 下创建目录 `nexus-eam`
3. 将整个项目上传到 `/volume1/docker/nexus-eam/`

### 方式 B：通过 SSH + Git

```bash
ssh admin@192.168.1.100

# 进入 docker 目录
cd /volume1/docker

# 如果有 git
git clone <your-repo-url> nexus-eam
cd nexus-eam
```

最终目录结构应该是：
```
/volume1/docker/nexus-eam/
├── backend/
├── frontend/
├── database/
├── docker-compose.yml
├── .env
└── ...
```

---

## 步骤二：创建 .env 配置文件

通过 SSH 或 File Station 创建 `.env` 文件：

```bash
cd /volume1/docker/nexus-eam
cp .env.example .env
```

编辑 `.env`，**必须修改以下值**：

```env
# 数据库密码 - 改成你自己的强密码
POSTGRES_PASSWORD=MyStr0ngP@ssw0rd2026

# JWT密钥 - 随机生成一个
# 可以用这个命令生成：openssl rand -hex 32
SECRET_KEY=a1b2c3d4e5f6...your-random-64-char-hex...

# CORS - 替换成你 NAS 的实际 IP
CORS_ORIGINS=http://192.168.1.100

# 端口 - 如果 80 被 DSM 占用，改成其他端口（如 8080）
WEB_PORT=8080
```

> **注意**：群晖 DSM 默认占用 80/443 端口。建议使用 **8080** 或其他空闲端口。

---

## 步骤三：通过 Container Manager 部署

### 方法 1：使用 Container Manager GUI（推荐新手）

1. 打开 **Container Manager** > **项目**
2. 点击 **创建**
3. **项目名称**：`nexus-eam`
4. **路径**：选择 `/volume1/docker/nexus-eam`
5. 它会自动检测到 `docker-compose.yml`
6. 点击 **下一步**，确认配置无误
7. 点击 **完成** 开始构建

构建过程大约 3-5 分钟（首次需要下载基础镜像 + 编译）。

### 方法 2：通过 SSH 命令行

```bash
ssh admin@192.168.1.100
cd /volume1/docker/nexus-eam

# 构建并启动所有服务
sudo docker compose up -d --build

# 查看构建日志
sudo docker compose logs -f

# 确认所有容器运行中
sudo docker compose ps
```

---

## 步骤四：验证部署

等待所有容器变为 `running (healthy)` 状态后：

1. **前端**：打开浏览器访问 `http://你的NAS-IP:8080`
2. **登录**：用户名 `admin`，密码 `admin123`
3. **API 文档**：`http://你的NAS-IP:8080/docs`

> 首次启动后请立即到系统中修改 admin 密码。

---

## 步骤五：配置防火墙（可选）

如果需要从外部访问：

1. DSM > **控制面板** > **安全性** > **防火墙**
2. 添加规则：允许 TCP 端口 8080（或你设置的端口）

---

## 数据持久化

所有数据通过 Docker Named Volumes 持久化，不会因容器重建丢失：

| 数据 | Volume 名称 | 说明 |
|------|------------|------|
| 数据库 | `nexus-eam_pgdata` | PostgreSQL 数据文件 |
| 上传图片 | `nexus-eam_uploads` | 物品图片文件 |

---

## 常用运维命令

```bash
cd /volume1/docker/nexus-eam

# 查看状态
sudo docker compose ps

# 查看日志
sudo docker compose logs backend --tail 50
sudo docker compose logs frontend --tail 50

# 重启服务
sudo docker compose restart

# 更新代码后重新构建
sudo docker compose up -d --build

# 停止所有服务
sudo docker compose down

# 停止并清除数据（⚠️ 会删除所有数据）
sudo docker compose down -v

# 备份数据库
sudo docker compose exec postgres pg_dump -U nexus nexus_eam > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20260228.sql | sudo docker compose exec -T postgres psql -U nexus nexus_eam
```

---

## 故障排除

### 端口冲突
```
Error: bind: address already in use
```
→ 修改 `.env` 中的 `WEB_PORT=8080` 为其他端口

### 数据库连接失败
```
backend | Connection refused
```
→ 等待 postgres 健康检查通过（约 10-15 秒），backend 会自动重试

### 构建失败（内存不足）
→ 群晖内存建议至少 4GB。如果是 2GB 型号，可以在 Windows 电脑上构建镜像后导出：
```bash
# Windows 上构建
docker compose build

# 导出镜像
docker save nexus-eam-backend nexus-eam-frontend | gzip > nexus-eam-images.tar.gz

# 复制到 NAS 后导入
sudo docker load < nexus-eam-images.tar.gz
```

### 首次启动后修改密码
登录后暂时无法从 UI 修改密码，可通过 API：
```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r .access_token)

# 后续可通过 API 操作...
```
