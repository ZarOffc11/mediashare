// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const filePreview = document.getElementById('filePreview');
const previewContent = document.getElementById('previewContent');
const fileInfo = document.getElementById('fileInfo');
const mediaResult = document.getElementById('mediaResult');
const mediaLink = document.getElementById('mediaLink');
const copyMediaLink = document.getElementById('copyMediaLink');
const mediaHistory = document.getElementById('mediaHistory');

let selectedFile = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent-color)';
    uploadArea.style.backgroundColor = 'rgba(74, 111, 165, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
    }
});

convertBtn.addEventListener('click', uploadFile);

copyMediaLink.addEventListener('click', () => {
    navigator.clipboard.writeText(mediaLink.textContent);
    
    // Store original content
    const icon = copyMediaLink.querySelector('i');
    const text = copyMediaLink.querySelector('span');
    const originalIcon = icon.className;
    const originalText = text.textContent;
    
    // Update to success state
    icon.className = 'fas fa-check';
    text.textContent = 'Copied!';
    copyMediaLink.style.backgroundColor = 'var(--success-color)';
    
    // Revert after 2 seconds
    setTimeout(() => {
        icon.className = originalIcon;
        text.textContent = originalText;
        copyMediaLink.style.backgroundColor = 'var(--accent-color)';
    }, 2000);
});

// Functions
function handleFile(file) {
    selectedFile = file;
    convertBtn.disabled = false;
    filePreview.style.display = 'block';
    
    // Display file info
    fileInfo.innerHTML = `
        ${file.name}<br>
        ${formatFileSize(file.size)} · ${file.type}
    `;
    
    // Display preview if image or video
    previewContent.innerHTML = '';
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        previewContent.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        previewContent.appendChild(video);
    } else {
        previewContent.innerHTML = `<i class="fas fa-file" style="font-size: 3rem; color: var(--accent-color);"></i>`;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

async function uploadFile() {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Show loading state
    convertBtn.innerHTML = '<span class="spinner"></span> Uploading...';
    convertBtn.disabled = true;
    
    try {
        const response = await fetch('https://mediashare.zaroffc.xyz/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mediaLink.textContent = data.url;
            mediaResult.style.display = 'block';
            saveToHistory(selectedFile, data.url);
            createHistoryItem(selectedFile.name, data.url, selectedFile.type.split('/')[0]);
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Upload failed. Please try again.');
    } finally {
        // Reset button state
        convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Generate Shareable Link';
        convertBtn.disabled = false;
        
        // Reset file input
        selectedFile = null;
        fileInput.value = '';
        filePreview.style.display = 'none';
    }
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('mediaShareHistory')) || [];
    history.forEach(item => {
        createHistoryItem(item.fileName, item.url, item.type);
    });
}

function saveToHistory(file, url) {
    const history = JSON.parse(localStorage.getItem('mediaShareHistory')) || [];
    const fileType = file.type.split('/')[0];
    
    history.unshift({
        fileName: file.name,
        url: url,
        type: fileType,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last 20 items
    const limitedHistory = history.slice(0, 20);
    localStorage.setItem('mediaShareHistory', JSON.stringify(limitedHistory));
}

function createHistoryItem(fileName, url, fileType) {
    const ext = fileName.split('.').pop().toLowerCase();
    let badgeClass, icon;
    
    if (fileType === 'image') {
        badgeClass = 'badge-image';
        icon = '<i class="fas fa-image"></i>';
    } else if (fileType === 'video') {
        badgeClass = 'badge-video';
        icon = '<i class="fas fa-video"></i>';
    } else {
        badgeClass = 'badge-file';
        icon = '<i class="fas fa-file"></i>';
    }
    
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-item-content">
            ${icon} ${fileName}
            <span class="badge ${badgeClass}">${ext.toUpperCase()}</span>
        </div>
        <div class="history-item-actions">
            <button class="action-btn" title="Copy link">
                <i class="fas fa-copy"></i>
            </button>
            <a href="${url}" target="_blank" class="action-btn" title="Open">
                <i class="fas fa-external-link-alt"></i>
            </a>
            <button class="action-btn delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add click handler for copy button
    item.querySelector('.fa-copy').parentNode.addEventListener('click', () => {
        navigator.clipboard.writeText(url);
        const copyBtn = item.querySelector('.fa-copy');
        copyBtn.classList.remove('fa-copy');
        copyBtn.classList.add('fa-check');
        setTimeout(() => {
            copyBtn.classList.remove('fa-check');
            copyBtn.classList.add('fa-copy');
        }, 2000);
    });
    
    // Add click handler for delete button
    item.querySelector('.delete-btn').addEventListener('click', () => {
        removeFromHistory(url);
        item.remove();
    });
    
    mediaHistory.insertBefore(item, mediaHistory.firstChild);
}

function removeFromHistory(urlToRemove) {
    const history = JSON.parse(localStorage.getItem('mediaShareHistory')) || [];
    const updatedHistory = history.filter(item => item.url !== urlToRemove);
    localStorage.setItem('mediaShareHistory', JSON.stringify(updatedHistory));
}
