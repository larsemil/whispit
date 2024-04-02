let recordingDiv = document.getElementById('recording')
let loadingDiv = document.getElementById('loading')
console.log(recordingDiv)
console.log(loadingDiv)
document.addEventListener('DOMContentLoaded', (event) => {
    let audioContext;
    let mediaRecorder;
    let audioChunks = [];

    const startRecording = () => {
        recordingDiv.classList.add('show')
        if (!audioContext) {
            audioContext = new AudioContext();
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                console.log('Starting to record...')

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = []; // Reset chunks for next recording

                    sendAudioToServer(audioBlob);
                });
            });
    };

    const stopRecording = () => {
        recordingDiv.classList.remove('show')
        if (mediaRecorder) {
            console.log('Stopping to record...')
            mediaRecorder.stop();
        }
    };

    const sendAudioToServer = (audioBlob) => {
        console.log('Sending data to server')
        loadingDiv.classList.add('show')
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        fetch("http://localhost:9999/transcribe", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log("Transcription Result:", data);
            sendData(data)
        })
        .catch(error => {
            console.error("Error sending audio to server:", error);
        });
    };

    document.addEventListener('keydown', (event) => {
        if (event.code === "Space" && mediaRecorder?.state !== "recording") {
            startRecording();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.code === "Space" && mediaRecorder?.state === "recording") {
            stopRecording();
        }
    });
});

async function sendData(text) {
    const response = await fetch('http://localhost:9999/classify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    });

    const data = await response.json();
    // Antag att `data` är den struktur som ditt svar har. Justera detta efter behov.
    generateRadarChart(data);
}


function generateRadarChart(data) {
    // Förutsätter att `data` är en array av objekt som du angav.
    data = data[0]; // Anpassa baserat på din datastruktur.

    const width = 700, height = 700, radius = (Math.min(width, height) / 2 ) - 100;
    const angleSlice = Math.PI * 2 / data.length;

    // Skapa en skala för radien
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, d3.max(data, d => d.score)]);

    const svg = d3.select("#radarChart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Rita upp axlarna
    const axisGrid = svg.append("g").attr("class", "axisWrapper");
    data.forEach((d, i) => {
        /*axisGrid.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(d3.max(data, d => d.score)) * Math.cos(angleSlice * i - Math.PI/2))
            .attr("y2", (d, i) => rScale(d3.max(data, d => d.score)) * Math.sin(angleSlice * i - Math.PI/2))
            .attr("class", "line")
            .style("stroke", "black")
            .style("stroke-width", "2px");
*/
        // Lägg till etiketter på varje axel
        axisGrid.append("text")
            .attr("class", "legend")
            .style("font-size", "12px")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d) => (rScale(d3.max(data, d => d.score < 0.10 ? d.score + 0.10:d.score)) + 10) * Math.cos(angleSlice * i - Math.PI/2))
            .attr("y", (d) => (rScale(d3.max(data, d => d.score < 0.10 ? d.score + 0.10:d.score)) + 10) * Math.sin(angleSlice * i - Math.PI/2))
            .text(d.label);
    });

    // Rita upp datalinjerna
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.score))
        .angle((d,i) => i * angleSlice);

    svg.append("path")
        .datum(data)
        .attr("d", radarLine)
        .style("stroke-width", "2px")
        .style("stroke", "#000")
        .style("fill", "rgba(0,0,100,0.8)");

    loadingDiv.classList.remove('show')
}