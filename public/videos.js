document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.getElementById('videoGrid');
    const modal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const closeBtn = document.querySelector('.close-modal');

    // 加载视频
    async function loadVideos() {
        try {
            const response = await fetch('/api/videos');
            const videos = await response.json();
            console.log('加载到的视频:', videos);
            
            videoGrid.innerHTML = ''; // 清空现有内容
            
            videos.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';
                videoItem.innerHTML = `
                    <video class="video-thumbnail" preload="metadata">
                        <source src="${video.filepath}" type="video/mp4">
                    </video>
                    <div class="video-overlay">
                        <i class="fas fa-play-circle play-button"></i>
                        <button class="delete-btn" data-id="${video.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${video.filename}</h3>
                        <div class="video-stats">
                            <span class="views"><i class="fas fa-eye"></i> ${video.views || 0}</span>
                            <span class="likes"><i class="fas fa-heart"></i> ${video.likes || 0}</span>
                        </div>
                    </div>
                `;
                
                // 点击播放视频
                videoItem.addEventListener('click', () => {
                    modal.style.display = 'block';
                    modalVideo.src = video.filepath;
                    
                    // 添加预加载和缓冲设置
                    modalVideo.preload = 'auto';
                    modalVideo.setAttribute('playsinline', '');
                    modalVideo.setAttribute('controls', '');
                    
                    // 设置视频质量
                    modalVideo.addEventListener('loadedmetadata', () => {
                        // 如果视频分辨率过高，可以降低播放质量
                        if (modalVideo.videoHeight > 720) {
                            modalVideo.style.width = '720p';
                        }
                    });

                    // 添加缓冲提示
                    modalVideo.addEventListener('waiting', () => {
                        console.log('视频缓冲中...');
                    });

                    // 添加错误处理
                    modalVideo.addEventListener('error', (e) => {
                        console.error('视频加载错误:', e);
                    });

                    modalVideo.play().catch(error => {
                        console.error('播放失败:', error);
                    });
                });
                
                // 添加删除事件监听
                const deleteBtn = videoItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 阻止事件冒泡，防止触发视频播放
                    if (confirm('确定要删除这个视频吗？')) {
                        try {
                            const response = await fetch(`/api/videos/${video.id}`, {
                                method: 'DELETE'
                            });

                            if (response.ok) {
                                videoItem.remove(); // 从DOM中移除
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
                
                videoGrid.appendChild(videoItem);
            });
        } catch (error) {
            console.error('加载视频失败:', error);
        }
    }

    // 关闭模态框时停止视频加载
    closeBtn.addEventListener('click', () => {
        modalVideo.pause();
        modalVideo.removeAttribute('src'); // 移除视频源
        modalVideo.load(); // 重置视频元素
        modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalVideo.pause();
            modalVideo.src = '';
        }
    });

    // 初始加载
    loadVideos();
}); 