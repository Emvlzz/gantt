const inputContainer = document.getElementById('input-container');
const algorithmSelect = document.getElementById('algorithm');
let ganttChart = null; // gráfico global

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
  const bursts = burstInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

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
  const ctx = document.getElementById('ganttChart').getContext('2d');

  // calcular posiciones acumuladas
  let currentTime = 0;
  const data = [];
  const backgroundColors = [];
  const labels = [];

  sequence.forEach(p => {
    data.push({ x: [currentTime, currentTime + p.time], y: p.pid });
    labels.push(currentTime); // guardar tiempo de inicio
    currentTime += p.time;
    backgroundColors.push(getColor(p.pid));
  });
  labels.push(currentTime); // tiempo final

  if (ganttChart) {
    ganttChart.destroy();
  }

  ganttChart = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: '#333',
        borderWidth: 1,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          title: { display: true, text: 'Tiempo (ms)' },
          stacked: true
        },
        y: {
          title: { display: true, text: 'Procesos' },
          stacked: true
        }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Diagrama de Gantt - ${algorithmSelect.value.toUpperCase()}`
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          formatter: function(value, context) {
            // mostrar tiempo inicial y final
            const [start, end] = value.x;
            return `${start} - ${end}`;
          },
          color: '#000',
          font: { weight: 'bold' }
        }
      }
    },
    plugins: [ChartDataLabels]
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
  html2canvas(document.getElementById("ganttChart")).then(canvas => {
    const link = document.createElement('a');
    link.download = 'diagrama_gantt.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}
