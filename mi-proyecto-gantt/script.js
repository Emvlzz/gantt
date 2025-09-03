// Inicializar Gantt
gantt.config.date_format = "%Y-%m-%d";
gantt.init("gantt_here");

// Variables
let processCount = 0;

// Función para agregar un proceso en la interfaz
document.getElementById("add-process").addEventListener("click", () => {
    processCount++;
    const div = document.createElement("div");
    div.className = "process-item";
    div.id = `process-${processCount}`;
    div.innerHTML = `
        <input placeholder="Nombre" class="p-name">
        <input placeholder="Llegada" type="number" class="p-arrival" min="0">
        <input placeholder="Duración" type="number" class="p-burst" min="1">
        <button onclick="removeProcess(${processCount})">X</button>
    `;
    document.getElementById("process-list").appendChild(div);
});

function removeProcess(id) {
    const elem = document.getElementById(`process-${id}`);
    elem.remove();
}

// Mostrar quantum solo si Round Robin
document.getElementById("algorithm").addEventListener("change", (e) => {
    if(e.target.value === "RR") {
        document.getElementById("quantum-container").style.display = "block";
    } else {
        document.getElementById("quantum-container").style.display = "none";
    }
});

// Función para generar Gantt
document.getElementById("generate-gantt").addEventListener("click", () => {
    const processes = [];
    document.querySelectorAll(".process-item").forEach(item => {
        const name = item.querySelector(".p-name").value;
        const arrival = parseInt(item.querySelector(".p-arrival").value);
        const burst = parseInt(item.querySelector(".p-burst").value);
        if(name && !isNaN(arrival) && !isNaN(burst)) {
            processes.push({name, arrival, burst});
        }
    });

    const algorithm = document.getElementById("algorithm").value;
    let tasks = [];

    if(algorithm === "FIFO") tasks = generateFIFO(processes);
    else if(algorithm === "SJF") tasks = generateSJF(processes);
    else if(algorithm === "RR") {
        const quantum = parseInt(document.getElementById("quantum").value);
        tasks = generateRR(processes, quantum);
    }

    gantt.clearAll();
    gantt.parse({data: tasks, links: []});
});

// Algoritmo FIFO
function generateFIFO(processes) {
    processes.sort((a,b) => a.arrival - b.arrival);
    let time = 0;
    const tasks = [];
    processes.forEach((p,i) => {
        if(time < p.arrival) time = p.arrival;
        tasks.push({
            id: i+1,
            text: p.name,
            start_date: addDays(new Date(), time),
            duration: p.burst,
            progress: 1
        });
        time += p.burst;
    });
    return tasks;
}

// Algoritmo SJF
function generateSJF(processes) {
    let time = 0;
    const tasks = [];
    const remaining = [...processes];
    let idCounter = 1;

    while(remaining.length > 0) {
        const available = remaining.filter(p => p.arrival <= time);
        if(available.length === 0) {
            time++;
            continue;
        }
        available.sort((a,b) => a.burst - b.burst);
        const p = available[0];
        tasks.push({
            id: idCounter++,
            text: p.name,
            start_date: addDays(new Date(), time),
            duration: p.burst,
            progress: 1
        });
        time += p.burst;
        remaining.splice(remaining.indexOf(p),1);
    }
    return tasks;
}

// Algoritmo Round Robin
function generateRR(processes, quantum) {
    let time = 0;
    const tasks = [];
    const queue = processes.map((p,i) => ({...p, remaining: p.burst, id:i+1}));
    const rrQueue = [];
    let idCounter = 1;

    while(queue.length > 0 || rrQueue.length > 0) {
        queue.filter(p => p.arrival <= time).forEach(p => {
            if(!rrQueue.includes(p)) rrQueue.push(p);
        });
        queue = queue.filter(p => p.arrival > time);

        if(rrQueue.length === 0) { time++; continue; }

        const current = rrQueue.shift();
        const runTime = Math.min(quantum, current.remaining);
        tasks.push({
            id: idCounter++,
            text: current.name,
            start_date: addDays(new Date(), time),
            duration: runTime,
            progress: 1
        });
        time += runTime;
        current.remaining -= runTime;
        if(current.remaining > 0) rrQueue.push(current);
    }

    return tasks;
}

// Función para sumar días a la fecha (necesario para Gantt)
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
