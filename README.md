# Kim Jisoo's House

一个用于展示和管理照片、视频的网站。专门为 BLACKPINK Jisoo 粉丝设计的个人收藏展示平台。

## 功能特点

- 照片上传和展示
  - 支持 HEIF/HEIC 格式自动转换
  - 自动生成缩略图
  - 照片墙瀑布流布局
  - 照片预览和全屏查看

- 视频上传和播放
  - 自动视频压缩
  - 流式视频播放
  - 视频预览缩略图
  - 支持多种视频格式

- 用户界面
  - 响应式设计，适配各种设备
  - 优雅的动画效果
  - 鼠标跟随表情特效
  - 轮播图展示

- 其他功能
  - 文件拖拽上传
  - 实时上传进度
  - 查看次数统计
  - 文件管理和删除

## 技术栈

- **前端**
  - HTML5/CSS3
  - JavaScript (ES6+)
  - Font Awesome 图标
  - 自定义动画效果

- **后端**
  - Node.js
  - Express 框架
  - MySQL 数据库
  - Multer 文件上传

- **图片处理**
  - Sharp 图片处理
  - HEIC-Convert 格式转换

- **视频处理**
  - FFmpeg 视频压缩
  - 流式传输

## 安装和运行

1. 克隆仓库
bash
git clone https://github.com/YOUR_USERNAME/jisoo-project.git
cd jisoo-project
2. 安装依赖
bash
npm install
3. 安装 FFmpeg
- 下载 FFmpeg: https://github.com/BtbN/FFmpeg-Builds/releases
- 解压并配置环境变量
- 或直接放置在项目目录下的 ffmpeg 文件夹中

4. 配置数据库
sql
CREATE DATABASE jisoo_db;
USE jisoo_db;
CREATE TABLE photos (
id INT PRIMARY KEY AUTO_INCREMENT,
filename VARCHAR(255) NOT NULL,
filepath VARCHAR(255) NOT NULL,
thumbnail_path VARCHAR(255),
upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
views INT DEFAULT 0,
likes INT DEFAULT 0
);
CREATE TABLE videos (
id INT PRIMARY KEY AUTO_INCREMENT,
filename VARCHAR(255) NOT NULL,
filepath VARCHAR(255) NOT NULL,
upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
views INT DEFAULT 0,
likes INT DEFAULT 0
);
5. 创建数据库用户
sql
CREATE USER 'jisoo_user'@'localhost' IDENTIFIED BY 'jisoo123';
GRANT ALL PRIVILEGES ON jisoo_db. TO 'jisoo_user'@'localhost';
FLUSH PRIVILEGES;
6. 运行项目
bash
npm start
7. 访问网站
- 打开浏览器访问: http://localhost:3000
## 目录结构
jisoo-project/
├── public/ # 静态文件
│ ├── index.html # 主页
│ ├── photos.html # 照片墙
│ ├── videos.html # 视频集
│ ├── styles.css # 主样式
│ ├── photos.css # 照片墙样式
│ ├── videos.css # 视频集样式
│ └── script.js # 主脚本
├── uploads/ # 上传文件存储
│ ├── images/ # 照片存储
│ ├── videos/ # 视频存储
│ └── thumbnails/ # 缩略图存储
├── server.js # 服务器入口
├── package.json # 项目配置
└── README.md # 项目说明

## 注意事项

- 确保 MySQL 服务已启动
- 确保上传目录有写入权限
- 视频上传大小限制为 500MB
- 照片上传大小限制为 50MB
- 支持的视频格式：MP4, WebM, MOV
- 支持的图片格式：JPG, PNG, HEIF/HEIC

## 开发者

- 作者：[周游]
- 邮箱：[2814529243@qq.com]

## 许可证

MIT License