# 🚀 一键部署指南

## 📱 方案一：本地局域网访问（最快）

### 在服务器上运行：

```bash
cd /root/.openclaw/agents/dev/workspace/doudizhu
python3 -m http.server 0.0.0.0:8888
```

### 然后在手机/电脑浏览器访问：

```
http://服务器IP:8888
```

---

## 🌐 方案二：Netlify 部署（推荐，30秒搞定）

1. 访问 https://netlify.com
2. 注册/登录
3. 把 `doudizhu` 文件夹直接拖拽到网页上
4. 完成！得到一个网址！

---

## 🐙 方案三：GitHub Pages 部署

### 第一步：创建仓库

1. 访问 https://github.com/new
2. Repository name: `doudizhu`
3. 选择 Public
4. 点击 "Create repository"

### 第二步：创建 Token

1. 访问 https://github.com/settings/tokens/new?scopes=repo
2. 点击 "Generate token"
3. 复制生成的 token（类似 `ghp_xxxxxxxxxx`）

### 第三步：上传代码

在服务器上执行：

```bash
cd /root/.openclaw/agents/dev/workspace/doudizhu

# 替换下面的地址和 token
git remote add origin https://你的用户名:你的Token@github.com/你的用户名/doudizhu.git
git branch -M main
git push -u origin main
```

### 第四步：启用 Pages

1. 进入仓库 → Settings → Pages
2. Branch 选择 main
3. 点击 Save
4. 等待 1-2 分钟，访问：`https://你的用户名.github.io/doudizhu/`

---

## 📦 方案四：Gitee（国内推荐）

1. 访问 https://gitee.com
2. 注册/登录
3. 创建仓库
4. 上传文件
5. 启用 Gitee Pages

---

## 💡 最简单的方案

如果你只是想快速给朋友展示，用 **Netlify** 最快！
