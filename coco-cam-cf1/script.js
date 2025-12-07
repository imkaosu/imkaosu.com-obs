const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'obs';

const controlPanel = document.getElementById('control-panel');
const obsDisplay = document.getElementById('obs-display');
const camStatus = document.getElementById('cam-status');
const micStatus = document.getElementById('mic-status');

const cameraSelect = document.getElementById('camera-select');
const micSelect = document.getElementById('mic-select');
const toggleCameraBtn = document.getElementById('toggle-camera');
const toggleMicBtn = document.getElementById('toggle-mic');
const previewVideo = document.getElementById('preview');

let stream = null;
let isCameraOn = false;
let isMicMuted = true;

if (mode === 'control') {
  controlPanel.classList.remove('hidden');
  obsDisplay.classList.add('hidden');
} else {
  controlPanel.classList.add('hidden');
  obsDisplay.classList.remove('hidden');
}

function updateStatus() {
  camStatus.textContent = isCameraOn ? '✅ Camera active' : 'Camera offline, please wait...';
  camStatus.style.color = isCameraOn ? '#0f0' : '#f00';

  micStatus.textContent = isMicMuted ? '🔇 Microphone muted' : '🎤 Microphone active';
  micStatus.style.color = isMicMuted ? '#f80' : '#0f0';
}

async function populateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');

    cameraSelect.innerHTML = '';
    videoDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${cameraSelect.children.length + 1}`;
      cameraSelect.appendChild(option);
    });

    micSelect.innerHTML = '';
    audioDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${micSelect.children.length + 1}`;
      micSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Device enumeration error:', err);
  }
}

async function updateStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: isCameraOn ? { deviceId: { exact: cameraSelect.value } } : false,
    audio: !isMicMuted ? { deviceId: { exact: micSelect.value } } : false
  };

  try {
    if (constraints.video || constraints.audio) {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (mode === 'control' && constraints.video) {
        previewVideo.srcObject = stream;
      }
    } else {
      stream = null;
      if (mode === 'control') previewVideo.srcObject = null;
    }
  } catch (err) {
    console.error('Media error:', err);
    alert('Failed to access camera/mic: ' + err.message);
  }

  updateStatus();
}

toggleCameraBtn.addEventListener('click', () => {
  isCameraOn = !isCameraOn;
  toggleCameraBtn.textContent = isCameraOn ? 'Turn Camera Off' : 'Turn Camera On';
  updateStream();
});

toggleMicBtn.addEventListener('click', () => {
  isMicMuted = !isMicMuted;
  toggleMicBtn.textContent = isMicMuted ? 'Unmute Microphone' : 'Mute Microphone';
  updateStream();
});

cameraSelect.addEventListener('change', updateStream);
micSelect.addEventListener('change', updateStream);

updateStatus();
populateDevices();
navigator.mediaDevices.addEventListener('devicechange', populateDevices);