const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const heicConvert = require('heic-convert');
const Jimp = require('jimp');
const app = express();

// 修改 FFmpeg 路径配置
const FFMPEG_PATH = 'D:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe';
ffmpeg.setFfmpegPath(FFMPEG_PATH);

// 添加路径检查
if (!fs.existsSync(FFMPEG_PATH)) {
    console.error('FFmpeg 路径不存在:', FFMPEG_PATH);
}

// 确保上传目录存在
const uploadDirs = ['uploads/images', 'uploads/videos', 'uploads/thumbnails'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// 确保缩略图目录存在
const THUMBNAIL_PATH = 'uploads/thumbnails';
if (!fs.existsSync(THUMBNAIL_PATH)) {
    fs.mkdirSync(THUMBNAIL_PATH, { recursive: true });
}

// 照片上传配置
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + '.jpg');
    }
});

// 视频上传配置
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 确保目录存在
        const uploadPath = 'uploads/videos';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // 保留原始文件扩展名
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

// 创建 multer 实例
const upload = multer({
    storage: photoStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 限制文件大小为 50MB
    },
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片文件'));
        }
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 限制视频大小为 500MB
    },
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('只支持视频文件'));
        }
    }
});

// 数据库连接配置
const db = mysql.createConnection({
    host: 'localhost',
    user: 'jisoo_user',
    password: 'jisoo123',
    database: 'jisoo_db'
});

// 测试数据库连接
db.connect(error => {
    if (error) {
        console.error('数据库连接错误:', error);
        return;
    }
    console.log('数据库连接成功');
});

// 基本中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
}));

// API 路由
app.post('/api/upload/photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        let processedFilePath = req.file.path;
        let processedFile = req.file;

        // 检查是否是 HEIF/HEIC 格式
        if (req.file.mimetype === 'image/heif' || req.file.mimetype === 'image/heic') {
            try {
                // 读取 HEIF 文件
                const inputBuffer = await fs.promises.readFile(req.file.path);
                
                // 转换为 JPEG
                const jpegBuffer = await heicConvert({
                    buffer: inputBuffer,
                    format: 'JPEG',
                    quality: 0.9
                });

                // 创建新的文件名和路径
                const jpegName = req.file.filename.replace(/\.[^.]+$/, '.jpg');
                const jpegPath = path.join('uploads/images', jpegName);

                // 保存转换后的文件
                await fs.promises.writeFile(jpegPath, jpegBuffer);

                // 删除原始 HEIF 文件
                await fs.promises.unlink(req.file.path);

                // 更新文件信息
                processedFilePath = jpegPath;
                processedFile = {
                    ...req.file,
                    filename: jpegName,
                    path: jpegPath,
                    mimetype: 'image/jpeg'
                };

                // 等待文件写入完成
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (conversionError) {
                console.error('HEIF 转换失败:', conversionError);
                // 如果转换失败，继续使用原始文件
            }
        }

        // 使用 Jimp 生成缩略图
        const thumbnailName = `thumb-${path.basename(processedFile.filename)}`;
        let thumbnailPath = path.join(THUMBNAIL_PATH, thumbnailName);

        try {
            // 确保源文件存在
            if (fs.existsSync(processedFilePath)) {
                await sharp(processedFilePath)
                    .resize(200, 200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .toFormat('jpeg')
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);
            } else {
                console.error('源文件不存在:', processedFilePath);
                thumbnailPath = processedFilePath;
            }
        } catch (error) {
            console.error('缩略图生成失败:', error);
            thumbnailPath = processedFilePath;
        }

        // 插入数据库
        const query = `
            INSERT INTO photos (
                filename, 
                filepath, 
                thumbnail_path, 
                upload_date
            ) VALUES (?, ?, ?, NOW())
        `;
        
        db.query(
            query,
            [
                processedFile.filename,
                processedFilePath,
                thumbnailPath
            ],
            (err, result) => {
                if (err) {
                    console.error('数据库错误:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }
                
                res.json({
                    success: true,
                    file: {
                        id: result.insertId,
                        filename: processedFile.filename,
                        filepath: processedFilePath,
                        thumbnail: thumbnailPath
                    }
                });
            }
        );
    } catch (error) {
        console.error('处理图片错误:', error);
        res.status(500).json({ 
            error: '处理图片时出错: ' + error.message 
        });
    }
});

app.post('/api/upload/video', videoUpload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        console.log('收到视频文件:', req.file);

        // 创建压缩后的视频文件名和路径
        const compressedName = `compressed-${req.file.filename}`;
        const compressedPath = path.join('uploads/videos', compressedName);

        // 使用 ffmpeg 压缩视频
        await new Promise((resolve, reject) => {
            ffmpeg(req.file.path)
                .videoCodec('libx264')
                .size('1280x?') // 限制宽度为1280，高度自适应
                .videoBitrate('1000k') // 视频比特率
                .audioBitrate('128k') // 音频比特率
                .fps(30) // 帧率
                .outputOptions([
                    '-preset fast', // 编码速度
                    '-movflags +faststart', // 快速开始播放
                    '-profile:v main', // 编码配置文件
                    '-level 3.1' // 编码级别
                ])
                .on('start', () => {
                    console.log('开始压缩视频...');
                })
                .on('progress', (progress) => {
                    console.log('压缩进度:', progress.percent, '%');
                })
                .on('end', () => {
                    console.log('视频压缩完成');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('视频压缩失败:', err);
                    reject(err);
                })
                .save(compressedPath);
        });

        // 删除原始视频文件
        await fs.promises.unlink(req.file.path);

        // 保存到数据库
        const query = `
            INSERT INTO videos (
                filename,
                filepath,
                upload_date,
                views,
                likes
            ) VALUES (?, ?, NOW(), 0, 0)
        `;
        
        db.query(
            query,
            [
                compressedName,
                compressedPath.replace(/\\/g, '/') // 统一使用正斜杠
            ],
            (err, result) => {
                if (err) {
                    console.error('数据库错误:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }
                
                console.log('视频保存成功:', result);
                
                res.json({
                    success: true,
                    file: {
                        id: result.insertId,
                        filename: compressedName,
                        filepath: compressedPath.replace(/\\/g, '/')
                    }
                });
            }
        );
    } catch (error) {
        console.error('处理视频错误:', error);
        res.status(500).json({ error: '处理视频时出错: ' + error.message });
    }
});

app.get('/api/photos', (req, res) => {
    const query = 'SELECT * FROM photos ORDER BY upload_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询照片错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(results);
    });
});

app.delete('/api/photos/:id', async (req, res) => {
    const photoId = req.params.id;
    
    try {
        // 先获取照片信息
        const getPhotoQuery = 'SELECT filepath, thumbnail_path FROM photos WHERE id = ?';
        db.query(getPhotoQuery, [photoId], async (err, results) => {
            if (err) {
                console.error('查询照片错误:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: '照片不存在' });
            }

            const photo = results[0];

            // 删除物理件
            try {
                // 删除原图
                if (fs.existsSync(photo.filepath)) {
                    await fs.promises.unlink(photo.filepath);
                }
                
                // 删除缩略图
                if (photo.thumbnail_path && fs.existsSync(photo.thumbnail_path)) {
                    await fs.promises.unlink(photo.thumbnail_path);
                }
            } catch (fileError) {
                console.error('删除文件错误:', fileError);
            }

            // 从数据库中删除记录
            const deleteQuery = 'DELETE FROM photos WHERE id = ?';
            db.query(deleteQuery, [photoId], (deleteErr) => {
                if (deleteErr) {
                    console.error('删除数据库记录错误:', deleteErr);
                    return res.status(500).json({ error: '数据库错误' });
                }

                res.json({ success: true });
            });
        });
    } catch (error) {
        console.error('删除照片错误:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

// 获取视频列表
app.get('/api/videos', (req, res) => {
    const query = 'SELECT * FROM videos ORDER BY upload_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询视频错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        console.log('查询到的视列表:', results);
        res.json(results);
    });
});

// 删除视频
app.delete('/api/videos/:id', async (req, res) => {
    const videoId = req.params.id;
    
    try {
        // 先获取视频信息
        const getVideoQuery = 'SELECT filepath FROM videos WHERE id = ?';
        db.query(getVideoQuery, [videoId], async (err, results) => {
            if (err) {
                console.error('查询视频错误:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: '视频不存在' });
            }

            const video = results[0];

            // 删除物理文件
            try {
                if (fs.existsSync(video.filepath)) {
                    await fs.promises.unlink(video.filepath);
                }
            } catch (fileError) {
                console.error('删除文件错误:', fileError);
            }

            // 从数据库中删除记录
            const deleteQuery = 'DELETE FROM videos WHERE id = ?';
            db.query(deleteQuery, [videoId], (deleteErr) => {
                if (deleteErr) {
                    console.error('删除数据库记录错误:', deleteErr);
                    return res.status(500).json({ error: '数据库错误' });
                }

                res.json({ success: true });
            });
        });
    } catch (error) {
        console.error('删除视频错误:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/photos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photos.html'));
});

app.get('/videos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'videos.html'));
});

// 404 处理必须在最后
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 添加一个测试路由
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// 更新照片查看次数
app.post('/api/photos/:id/view', (req, res) => {
    const photoId = req.params.id;
    const query = 'UPDATE photos SET views = COALESCE(views, 0) + 1 WHERE id = ?';
    
    db.query(query, [photoId], (err, result) => {
        if (err) {
            console.error('更新查看次数错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ success: true });
    });
});

// 更新视频观看次数
app.post('/api/videos/:id/view', (req, res) => {
    const videoId = req.params.id;
    const query = 'UPDATE videos SET views = COALESCE(views, 0) + 1 WHERE id = ?';
    
    db.query(query, [videoId], (err, result) => {
        if (err) {
            console.error('更新观看次数错误:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ success: true });
    });
});

// 添加视频流服务
app.get('/video/:id', (req, res) => {
    const videoId = req.params.id;
    
    db.query('SELECT filepath FROM videos WHERE id = ?', [videoId], (err, results) => {
        if (err || !results.length) {
            return res.status(404).send('Video not found');
        }

        const videoPath = results[0].filepath;
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            // 限制每个块的大小为 1MB，更小的块大小可以提高流畅度
            const chunkSize = 1024 * 1024;
            end = Math.min(start + chunkSize, end);

            const contentLength = end - start + 1;
            // 增加缓冲区大小到 128KB，提高读取效率
            const file = fs.createReadStream(videoPath, { 
                start, 
                end, 
                highWaterMark: 128 * 1024,
                autoClose: true
            });

            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': contentLength,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'public, max-age=31536000',
                'Connection': 'keep-alive',
                'Transfer-Encoding': 'chunked'
            };

            res.writeHead(206, headers);

            // 错误处理
            file.on('error', (error) => {
                console.error('视频流错误:', error);
                res.end();
            });

            // 使用管道传输数据
            file.pipe(res);

            // 清理源
            res.on('close', () => {
                file.destroy();
            });
        } else {
            const headers = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'public, max-age=31536000',
                'Connection': 'keep-alive',
                'Transfer-Encoding': 'chunked'
            };
            res.writeHead(200, headers);
            
            const file = fs.createReadStream(videoPath, { 
                highWaterMark: 128 * 1024,
                autoClose: true
            });
            
            file.pipe(res);

            res.on('close', () => {
                file.destroy();
            });
        }
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});  