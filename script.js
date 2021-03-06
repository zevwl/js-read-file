const filesElement = document.querySelector('#files');
const fileToBlobElement = document.querySelector('#file-to-blob');
const fileProgressElement = document.querySelector('#file-with-progress');
const fileReadAbortButton = document.querySelector('#cancel-read');
const dropZone = document.querySelector('#drop-zone');
const dropZoneText = dropZone.querySelector('#drop-zone span');
const outputElement = document.querySelector('#list');
const progressBar = document.querySelector('#progress-bar');
const progressPercent = document.querySelector('.percent');

let fileProgressReader;

// Check for the various File API support.
if (window.File
	&& window.FileReader
	&& window.FileList
	&& window.Blob) {
	
	filesElement.addEventListener('change', handleFileSelect, false);

	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('dragleave', handleDragLeave, false);
	dropZone.addEventListener('drop', handleDragLeave, false);
	dropZone.addEventListener('drop', handleFileDrop, false);

	document.querySelector('.read-bytes-buttons').addEventListener('click', function (event) {
		if (event.target.tagName.toLowerCase() == 'button') {
			let startByte = event.target.dataset.startbyte;
			let stopByte = event.target.dataset.endbyte;
			readBlob(startByte, stopByte);
		}
	}, false);

	fileProgressElement.addEventListener('change', handleFileWithProgress, false);
	fileReadAbortButton.addEventListener('click', cancelRead, false);

} else {
	showError('The File APIs are not fully supported in this broser.');
}

function showError(message) {
	outputElement.innerHTML = `<p style="color: red">${message}</p>`;
}

function cancelRead() {
	fileProgressReader.abort();
}

function errorHanlder(event) {
	let error = event.target.error;
	switch(error.code) {
		case error.NOT_FOUND_ERR:
			showError('file not found!');
			break;
		case error.NOT_READABLE_ERR:
			showError('File is not readable.');
			break;
		case error.ABORT_ERR:
			showError('File read cancelled.');
			break;
		default:
			showError('An error occurred reading file.');
	}
}

function updateProgress(event) {
	// event is an ProgressEvent
	if (event.lengthComputable) {
		let percentLoaded = Math.round((event.loaded / event.total) * 100);
		// Increase the progress bar length
		if (percentLoaded < 100) {
			progressPercent.style.width = percentLoaded + '%';
			progressPercent.textContent = percentLoaded + '%';
		}
	}
}

function handleFileWithProgress(event) {
	// Reset progress indicator on new file selection
	progressPercent.style.width = '0%';
	progressPercent.textContent = '0%';

	fileProgressReader = new FileReader();
	fileProgressReader.onerror = errorHanlder;
	fileProgressReader.onprogress = updateProgress;
	fileProgressReader.onloadstart = function (e) {
		progressBar.className = 'loading';
	};
	fileProgressReader.onload = function (e) {
		// Ensure that the progress bar displays 100% at the end.
		progressPercent.style.width = '100%';
		progressPercent.textContent = '100%';

		setTimeout('progressBar.className = "";', 2000);
	}

	fileProgressReader.readAsBinaryString(event.target.files[0]);
}

function readBlob(start, stop) {

	let files = fileToBlobElement.files;
	if (!files.length) {
		showError('Please select a file!');
		return;
	}

	let file = files[0];
	start = parseInt(start) || 0;
	stop = parseInt(stop) || file.size - 1;

	const reader = new FileReader();

	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function (event) {
		if (event.target.readyState === FileReader.DONE) {
			document.querySelector('#byte-content').textContent = `Read bytes: ${start + 1} - ${stop + 1} of ${file.size} byte file.`;
		} 
	}

	let blob = file.slice(start, stop + 1)
	reader.readAsBinaryString(blob);
}

function imageToThumbnail(files) {
	for (let file of files) {
		if (!file.type.match('image.*')) continue;

		const reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function (f) {
			return function (e) {
				// Render thumbnail.
				let span = document.createElement('span');
				span.innerHTML = `<img class="thumb" src="${e.target.result}" title="${f.name}">`;
				outputElement.insertBefore(span, null);
			};
		})(file);

		// Read the image file as a data URL.
		reader.readAsDataURL(file);
	}
}

function handleFileList(files) {

	imageToThumbnail(files);

	let output = [];
	for (let file of files) {
		output.push(`<li><strong>${file.name}</strong> (${file.type || 'n/a'}) - ${file.size} bytes, last modified: ${file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a'} </li>`);
	}
	outputElement.innerHTML = `<ul>${output.join('')}</ul>`;
}

function handleFileSelect(event) {
	//FileList object
	handleFileList(event.target.files);
}

function handleFileDrop(event) {
	event.stopPropagation();
	event.preventDefault();

	handleFileList(event.dataTransfer.files);
}

function handleDragOver(event) {
	event.stopPropagation();
	event.preventDefault();

	// Explicitly show this is a copy.
	event.dataTransfer.dropEffect = 'copy';
	dropZone.style.borderColor = '#000';
	dropZoneText.style.color = '#000';
}

function handleDragLeave(event) {
	event.stopPropagation();
	event.preventDefault();

	dropZone.style.borderColor = '';
	dropZoneText.style.color = '';
}

