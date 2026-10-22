# Frontend2 Docker 部署

镜像发布到本仓库的 GitHub Packages，包含新版 frontend2 和 Go 后端。PostgreSQL、Redis 由 Compose 单独运行并持久化数据。

## 镜像版本

- `frontend2`：跟随新版前端更新。
- `frontend2-YYYYMMDD.N`：固定发布版本，日期为 UTC，N 为发布工作流运行编号。
- `frontend2-sha-<12位提交号>`：对应具体源码提交。

生产环境使用固定版本或镜像摘要。更新镜像不会迁移到旧版前端。

## 首次部署

将本目录的 `docker-compose.yml` 和 `frontend2.env.example` 放到服务器的部署目录：

```sh
cp frontend2.env.example .env
chmod 600 .env
```

编辑 `.env`，替换全部 `CHANGE_ME`，设置管理员邮箱和固定镜像版本。JWT_SECRET 和 TOTP_ENCRYPTION_KEY 分别执行 `openssl rand -hex 32` 生成，后续保留原值。

```sh
docker compose pull
docker compose up -d --wait --wait-timeout 240
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

默认仅监听本机 8080，通过已有反向代理配置域名和 HTTPS。若需要临时直接访问，在 `.env` 中设置 `BIND_HOST=0.0.0.0`，并限制服务器防火墙允许的访问来源。

镜像若为私有包，先使用有 read:packages 权限的账号执行 `docker login ghcr.io`。公开包可以匿名拉取。

## 更新

备份数据库和应用数据，修改 `.env` 中的 `SUB2API_IMAGE` 为目标固定版本，再执行：

```sh
docker compose pull sub2api
docker compose up -d --wait --wait-timeout 240
```

数据库、Redis 和应用数据使用命名卷，保留卷即可保留数据。不要执行 `docker compose down --volumes`；数据库发生迁移后，应用回滚需要同时评估数据库兼容性。

## 发布流程

推送当前 `feat/new-frontend` 分支的相关代码，或手动运行 `Frontend2 Package` 工作流。工作流先构建 amd64 镜像，启动独立数据库和缓存，检查健康接口、内嵌首页及数据库备份工具，通过后再发布 amd64/arm64 镜像。版本、提交和镜像摘要记录在工作流摘要中。
