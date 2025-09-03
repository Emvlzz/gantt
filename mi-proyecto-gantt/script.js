const inputContainer = document.getElementById('input-container');
const algorithmSelect = document.getElementById('algorithm');

algorithmSelect.addEventListener('change', () => {
  const algo = algorithmSelect.value;
  inputContainer.innerHTML = '';

  let html = '<label for="burstTimes">Tiempos de ráfaga (separados por coma):</label><br>';
  html += '<input type="text" id="burstTimes" placeholder="Ej: 5,3,8"><br>';

  if (algo === 'rr') {
    html += '<label for="quantum">Quantum:</label><br>';
    html += '<input type="number" id="quantum" value="2"><br>';
  }

  inputContainer.innerHTML = html;
});

function generateGantt() {
  const algo = algorithmSelect.value;
  const burstInput = document.getElementById('burstTimes').value;
  const bursts = burstInput.split(',').map(n => parseInt(n.trim()));

  let quantum = 0;
  if (algo === 'rr') {
    quantum = parseInt(document.getElementById('quantum').value);
  }

  let sequence = [];

  if (algo === 'fcfs') {
    bursts.forEach((bt, i) => {
      sequence.push({ pid: `P${i+1}`, time: bt });
    });
  }

  if (algo === 'sjf') {
    bursts
      .map((bt, i) => ({ pid: `P${i+1}`, time: bt }))
      .sort((a, b) => a.time - b.time)
      .forEach(p => sequence.push(p));
  }

  if (algo === 'rr') {
    let queue = bursts.map((bt, i) => ({ pid: `P${i+1}`, time: bt }));
    let timeLeft = [...bursts];
    let t = 0;

    while (queue.some(p => p.time > 0)) {
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].time > 0) {
          const used = Math.min(queue[i].time, quantum);
          sequence.push({ pid: queue[i].pid, time: used });
          queue[i].time -= used;
          t += used;
        }
      }
    }
  }

  renderGantt(sequence);
}

function renderGantt(sequence) {
  const container = document.getElementById('gantt-container');
  container.innerHTML = '';
  sequence.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bar';
    div.style.width = `${p.time * 40}px`;
    div.style.backgroundColor = getColor(p.pid);
    div.textContent = p.pid;
    container.appendChild(div);
  });
}

function getColor(pid) {
  const colors = {
    P1: '#4caf50',
    P2: '#2196f3',
    P3: '#ff9800',
    P4: '#e91e63',
    P5: '#9c27b0'
  };
  return colors[pid] || '#607d8b';
}

function downloadImage() {
  html2canvas(document.getElementById("gantt-container")).then(canvas => {
    const link = document.createElement('a');
    link.download = 'diagrama_gantt.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}