document.addEventListener('DOMContentLoaded', function() {
    const photoForm = document.getElementById('photoForm');
    const videoForm = document.getElementById('videoForm');
    const photoError = document.getElementById('photoError');
    const videoError = document.getElementById('videoError');
    const photoInput = document.getElementById('photoInput');
    const videoInput = document.getElementById('videoInput');

    // 修改基础URL配置
    const API_BASE_URL = window.location.origin;

    photoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        photoError.textContent = '';
        
        const fileInput = this.querySelector('input[type="file"]');
        if (!fileInput.files || !fileInput.files[0]) {
            photoError.textContent = '请选择要上传的照片';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('photo', fileInput.files[0]);

            console.log('开始上传照片...');
            const response = await fetch('/api/upload/photo', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `上传失败 (${response.status})`);
            }

            const result = await response.json();
            if (result.success) {
                alert('照片上传成功！');
                location.reload();
            } else {
                throw new Error(result.error || '上传失败');
            }
        } catch (error) {
            console.error('上传错误:', error);
            photoError.textContent = `上传失败：${error.message}`;
        }
    });

    // 视频上传处理
    videoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        videoError.textContent = '';
        
        const fileInput = this.querySelector('input[type="file"]');
        if (!fileInput.files || !fileInput.files[0]) {
            videoError.textContent = '请选择要上传的视频';
            return;
        }

        const file = fileInput.files[0];
        console.log('准备上传视频:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // 检查文件类型
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            videoError.textContent = '只支持 MP4, WebM, MOV 格式的视频';
            return;
        }

        // 检查文件大小
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            videoError.textContent = '视频大小不能超过 500MB';
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        try {
            console.log('开始上传视频...');
            const response = await fetch('/api/upload/video', {
                method: 'POST',
                body: formData
            });

            console.log('服务器响应状态:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `上传失败 (${response.status})`);
            }

            const result = await response.json();
            console.log('上传结果:', result);

            if (result.success) {
                alert('视频上传成功！');
                location.reload();
            } else {
                throw new Error(result.error || '上传失败');
            }
        } catch (error) {
            console.error('上传错误:', error);
            videoError.textContent = `上传失败：${error.message}`;
        }
    });

    // Emoji 鼠标跟随效果
    const cursor = document.getElementById('cursor-emoji');
    const trails = document.querySelectorAll('.cursor-trail');
    const emojis = ['💖', '✨', '🎀', '💝', '💕', '💗', '💓', '💞', '🌸', '🎵', '🌟', '💫'];
    let currentEmoji = 0;
    let positions = [];
    const maxTrailLength = 20; // 增加轨迹长度

    // 鼠标移动时更新 emoji 位置
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            // 更新主光标位置
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            // 更新位置历史
            positions.unshift({ x: e.clientX, y: e.clientY });
            positions = positions.slice(0, maxTrailLength);

            // 更新残影显示
            trails.forEach((trail, index) => {
                const pos = positions[index * 2]; // 增加残影间距
                if (pos) {
                    trail.style.left = pos.x + 'px';
                    trail.style.top = pos.y + 'px';
                    trail.textContent = emojis[currentEmoji];
                    trail.style.opacity = 0.5 - (index * 0.1); // 降低透明度衰减速度
                    
                    // 添加缩放效果
                    const scale = 1 - (index * 0.1);
                    trail.style.transform = `translate(-50%, -50%) scale(${scale})`;
                }
            });

            // 根据移动速度切换表情
            if (positions.length > 1) {
                const dx = positions[0].x - positions[1].x;
                const dy = positions[0].y - positions[1].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) { // 降低切换阈值，使表情变化更频繁
                    currentEmoji = (currentEmoji + 1) % emojis.length;
                    cursor.textContent = emojis[currentEmoji];
                }
            }
        });
    });

    // 点击时的效果
    document.addEventListener('click', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        setTimeout(() => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
    });

    // 鼠标进入可点击元素时的效果
    document.querySelectorAll('a, button').forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.textContent = '💝';
            trails.forEach(trail => {
                trail.textContent = '💝';
            });
        });

        element.addEventListener('mouseleave', () => {
            cursor.textContent = emojis[currentEmoji];
            trails.forEach(trail => {
                trail.textContent = emojis[currentEmoji];
            });
        });
    });
});

// 轮播图功能
const slides = document.querySelector('.slides');
const slideItems = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentSlide = 0;
const totalSlides = slideItems.length;

function updateSlide() {
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlide();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlide();
}

setInterval(nextSlide, 5000);
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// 拖放上传功能
const uploadBoxes = document.querySelectorAll('.upload-box');

uploadBoxes.forEach(box => {
    box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.style.borderColor = '#ff69b4';
    });

    box.addEventListener('dragleave', () => {
        box.style.borderColor = '#ff69b4';
    });

    box.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        const input = box.querySelector('input');
        
        if (files.length > 0) {
            input.files = files;
            const fileType = input.accept.includes('image') ? '照片' : '视频';
            alert(`已选择 ${files.length} 个${fileType}文件`);
            // 这里添加上传到服务器的逻辑
        }
    });
});

// 添加测试照片
const photoGrid = document.querySelector('.photo-grid');
const testPhotos = [
    'http://book.lovejisoo.cn:8080/upload/thumbnails/2024/w1200/jisoo-1.jpg',
    'http://book.lovejisoo.cn:8080/upload/thumbnails/2024/w1200/IMG20240523195512.jpg',
    'http://book.lovejisoo.cn:8080/upload/thumbnails/2024/w1200/img-1717422493247c8b7012803d798af7ac11d621e8b3cded7742f8e61f45d8d86fed31d57e048c9.jpg',
];

testPhotos.forEach(photo => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <img src="${photo}" alt="照片">
    `;
    photoGrid.appendChild(photoItem);
});

// 动态加载照片
async function loadPhotos() {
    try {
        const response = await fetch('/api/photos');
        const photos = await response.json();
        
        const photoGrid = document.querySelector('.photo-grid');
        photoGrid.innerHTML = ''; // 清空现有内容

        photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.filepath}" alt="${photo.filename}">
                <div class="photo-overlay">
                    <div class="photo-actions">
                        <button class="delete-btn" data-id="${photo.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            // 添加删除功能
            const deleteBtn = photoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                if (confirm('确定要删除这张照片吗？')) {
                    try {
                        const response = await fetch(`/api/photos/${photo.id}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            photoItem.remove(); // 从DOM中移除
                        } else {
                            const error = await response.json();
                            alert('删除失败: ' + error.error);
                        }
                    } catch (error) {
                        console.error('删除错误:', error);
                        alert('删除失败');
                    }
                }
            });

            photoGrid.appendChild(photoItem);
        });
    } catch (error) {
        console.error('加载照片失败:', error);
    }
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', function() {
    loadPhotos();
});

// 动态加载视频
function loadVideos() {
    const videoGrid = document.querySelector('.video-grid');
    // 这里添加从服务器获取视频的逻辑
}

// 在上传前转换图片格式
async function convertImageBeforeUpload(file) {
    // 检查文件类型
    if (file.type === 'image/heif' || file.type === 'image/heic') {
        try {
            // 创建一个 canvas 元素
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 创建一个临时的 object URL
            const objectUrl = URL.createObjectURL(file);

            // 等待图片加载
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            // 设置 canvas 大小
            canvas.width = img.width;
            canvas.height = img.height;

            // 绘制图片
            ctx.drawImage(img, 0, 0);

            // 释放 object URL
            URL.revokeObjectURL(objectUrl);

            // 转换为 JPEG Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            });

            // 创建新的 File 对象
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
            });
        } catch (error) {
            console.error('图片转换失败:', error);
            return file; // 如果转换失败，返回原始文件
        }
    }
    return file;
}

// 文件预览功能
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const uploadPreviewArea = document.getElementById('uploadPreviewArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = fileInfo.querySelector('.file-name');
const fileSize = fileInfo.querySelector('.file-size');

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
}

photoInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            photoPreview.src = e.target.result;
            uploadPreviewArea.classList.add('has-image');
            updateFileInfo(file);
        }
        reader.readAsDataURL(file);
    }
});

// 拖放功能
uploadPreviewArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadPreviewArea.classList.add('drag-over');
});

uploadPreviewArea.addEventListener('dragleave', () => {
    uploadPreviewArea.classList.remove('drag-over');
});

uploadPreviewArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadPreviewArea.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        photoInput.files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.onload = function(e) {
            photoPreview.src = e.target.result;
            uploadPreviewArea.classList.add('has-image');
            updateFileInfo(file);
        }
        reader.readAsDataURL(file);
    }
});

// 点击预览区域触发文件选择
uploadPreviewArea.addEventListener('click', () => {
    photoInput.click();
});

// 上传进度显示
function updateProgress(percent) {
    const progressBar = document.querySelector('.progress-bar');
    const progressContainer = document.querySelector('.upload-progress');
    const progressText = document.querySelector('.progress-text');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

// 视频上传和预览功能
const videoInput = document.getElementById('videoInput');
const videoPreview = document.getElementById('videoPreview');
const videoPreviewArea = document.getElementById('videoPreviewArea');
const videoFileInfo = document.getElementById('videoFileInfo');
const videoFileName = videoFileInfo.querySelector('.file-name');
const videoFileSize = videoFileInfo.querySelector('.file-size');

videoInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (file) {
        const videoUrl = URL.createObjectURL(file);
        videoPreview.src = videoUrl;
        videoPreviewArea.classList.add('has-image');
        updateVideoFileInfo(file);
        
        // 视频加载完成后释放 URL
        videoPreview.onloadeddata = function() {
            URL.revokeObjectURL(videoUrl);
        };
    }
});

function updateVideoFileInfo(file) {
    videoFileName.textContent = file.name;
    videoFileSize.textContent = formatFileSize(file.size);
    videoFileInfo.style.display = 'flex';
}

// 视频拖放功能
videoPreviewArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    videoPreviewArea.classList.add('drag-over');
});

videoPreviewArea.addEventListener('dragleave', () => {
    videoPreviewArea.classList.remove('drag-over');
});

videoPreviewArea.addEventListener('drop', (e) => {
    e.preventDefault();
    videoPreviewArea.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
        videoInput.files = e.dataTransfer.files;
        const videoUrl = URL.createObjectURL(file);
        videoPreview.src = videoUrl;
        videoPreviewArea.classList.add('has-image');
        updateVideoFileInfo(file);
    }
});

// 点击预览区域触发视频选择
videoPreviewArea.addEventListener('click', () => {
    videoInput.click();
});

// 视频上传处理
videoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    videoError.textContent = '';
    
    const fileInput = this.querySelector('input[type="file"]');
    if (!fileInput.files || !fileInput.files[0]) {
        videoError.textContent = '请选择要上传的视频';
        return;
    }

    const file = fileInput.files[0];
    console.log('准备上传视频:', {
        name: file.name,
        size: file.size,
        type: file.type
    });

    // 检查文件类型
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
        videoError.textContent = '只支持 MP4, WebM, MOV 格式的视频';
        return;
    }

    // 检查文件大小
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        videoError.textContent = '视频大小不能超过 500MB';
        return;
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
        console.log('开始上传视频...');
        const response = await fetch('/api/upload/video', {
            method: 'POST',
            body: formData
        });

        console.log('服务器响应状态:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `上传失败 (${response.status})`);
        }

        const result = await response.json();
        console.log('上传结果:', result);

        if (result.success) {
            alert('视频上传成功！');
            location.reload();
        } else {
            throw new Error(result.error || '上传失败');
        }
    } catch (error) {
        console.error('上传错误:', error);
        videoError.textContent = `上传失败：${error.message}`;
    }
});
 