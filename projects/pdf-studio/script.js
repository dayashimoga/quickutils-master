// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const DOM = {
    cards: document.querySelectorAll('.tool-card'),
    workspace: document.getElementById('workspace'),
    closeBtn: document.querySelector('.close-workspace'),
    title: document.getElementById('workspace-title'),
    desc: document.getElementById('workspace-desc'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    optionsArea: document.getElementById('options-area'),
    processBtn: document.getElementById('process-btn'),
    loader: document.getElementById('loader')
};

let currentTool = null;
let files = [];

const toolsDetails = {
    'pdf-to-image': { title: 'PDF to Image', desc: 'Convert PDF pages to JPEGs.', accept: 'application/pdf', multiple: false },
    'image-to-pdf': { title: 'Image to PDF', desc: 'Combine multiple images into one PDF.', accept: 'image/*', multiple: true },
    'merge-pdfs': { title: 'Merge PDFs', desc: 'Combine multiple PDFs into a single file.', accept: 'application/pdf', multiple: true },
    'remove-pages': { title: 'Remove Pages', desc: 'Remove specific pages from a PDF. Enter comma-separated page numbers.', accept: 'application/pdf', multiple: false },
    'extract-text': { title: 'Extract Text', desc: 'Extract raw text from a PDF file.', accept: 'application/pdf', multiple: false }
};

// Event Listeners
DOM.cards.forEach(card => card.addEventListener('click', () => openWorkspace(card.dataset.tool)));
DOM.closeBtn.addEventListener('click', closeWorkspace);
DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('dragover'); });
DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('dragover'));
DOM.dropZone.addEventListener('drop', handleDrop);
DOM.fileInput.addEventListener('change', handleFileSelect);
DOM.processBtn.addEventListener('click', processRequest);

function openWorkspace(tool) {
    currentTool = tool;
    const details = toolsDetails[tool];
    DOM.title.textContent = details.title;
    DOM.desc.textContent = details.desc;
    DOM.fileInput.accept = details.accept;
    DOM.fileInput.multiple = details.multiple;
    files = [];
    renderFiles();
    renderOptions();
    DOM.workspace.classList.remove('hidden');
}

function closeWorkspace() {
    DOM.workspace.classList.add('hidden');
    currentTool = null;
    files = [];
}

function handleDrop(e) {
    e.preventDefault();
    DOM.dropZone.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    addFiles(e.target.files);
}

function addFiles(newFiles) {
    const details = toolsDetails[currentTool];
    Array.from(newFiles).forEach(file => {
        if (file.type.match(details.accept.replace('*', '.*'))) {
            if (!details.multiple) files = [file];
            else files.push(file);
        }
    });
    renderFiles();
    updateProcessBtn();
}

function renderFiles() {
    DOM.fileList.innerHTML = '';
    files.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span class="file-name">${file.name}</span>
            </div>
            <button class="remove-file" onclick="removeFile(${index})"><i class="fas fa-trash"></i></button>
        `;
        DOM.fileList.appendChild(div);
    });
}

window.removeFile = function(index) {
    files.splice(index, 1);
    renderFiles();
    updateProcessBtn();
}

function renderOptions() {
    DOM.optionsArea.innerHTML = '';
    if (currentTool === 'remove-pages') {
        DOM.optionsArea.innerHTML = `
            <label>Pages to remove (comma-separated, e.g., 1, 3, 5):</label>
            <input type="text" id="pages-input" placeholder="e.g. 1, 3, 5">
        `;
    }
}

function updateProcessBtn() {
    if (files.length > 0) {
        DOM.processBtn.classList.remove('disabled');
    } else {
        DOM.processBtn.classList.add('disabled');
    }
}

async function processRequest() {
    if (files.length === 0 || DOM.processBtn.classList.contains('disabled')) return;
    
    setLoading(true);
    try {
        if (currentTool === 'merge-pdfs') await mergePDFs();
        else if (currentTool === 'image-to-pdf') await imageToPDF();
        else if (currentTool === 'pdf-to-image') await pdfToImage();
        else if (currentTool === 'remove-pages') await removePages();
        else if (currentTool === 'extract-text') await extractText();
    } catch (err) {
        alert('Error processing file: ' + err.message);
        console.error(err);
    }
    setLoading(false);
}

function setLoading(isLoading) {
    if (isLoading) {
        DOM.processBtn.classList.add('hidden');
        DOM.loader.classList.remove('hidden');
    } else {
        DOM.processBtn.classList.remove('hidden');
        DOM.loader.classList.add('hidden');
    }
}

// Implementations using pdf-lib and pdfjs
async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function mergePDFs() {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged.pdf');
}

async function imageToPDF() {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    for (const file of files) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        let image;
        if (file.type === 'image/jpeg') image = await pdfDoc.embedJpg(arrayBuffer);
        else if (file.type === 'image/png') image = await pdfDoc.embedPng(arrayBuffer);
        else continue;
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    
    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf');
}

async function removePages() {
    const { PDFDocument } = PDFLib;
    const input = document.getElementById('pages-input').value;
    const toRemove = input.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n));
    
    const arrayBuffer = await readFileAsArrayBuffer(files[0]);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    toRemove.sort((a,b) => b - a).forEach(index => {
        if (index >= 0 && index < pdfDoc.getPageCount()) {
            pdfDoc.removePage(index);
        }
    });

    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'modified.pdf');
}

async function pdfToImage() {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Convert only the first page for simplicity
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    canvas.toBlob((blob) => {
        downloadBlob(blob, 'page-1.jpg');
    }, 'image/jpeg');
}

async function extractText() {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    const blob = new Blob([fullText], { type: 'text/plain' });
    downloadBlob(blob, 'extracted-text.txt');
}
