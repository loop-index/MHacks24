import { showAlert, showConfirmModal, showExportModal } from './utils.js';
import { createEventNode, validateEvents } from './events.js'

$(document).ready(function() {
    var activeInput = 'text';
    var jobId = null;
    var currentFile = null;

    // Switch between text and image input
    setupInputSwitch();
    setupDropArea();
    setupParseButton();
    setupExportButton();

    function setupInputSwitch() {
        $('#text').on('change', function() {
            if (this.checked) {
                toggleInput('text');
            }
        });

        $('#image').on('change', function() {
            if (this.checked) {
                toggleInput('image');
            }
        });
    }

    function toggleInput(inputType) {
        if (inputType === 'text') {
            $('#schedule-text').removeClass('d-none');
            $('#file-drop').addClass('d-none');
        } else {
            $('#schedule-text').addClass('d-none');
            $('#file-drop').removeClass('d-none');
        }
        activeInput = inputType;
    }

    function setupDropArea() {
        $('#file-drop').on('click', function() {
            $('#schedule-image').click();
        });

        $('#schedule-image').on('change', function(event) {
            currentFile = event.target.files[0];
            $('#drop-text').text(currentFile.name);
        });

        $('#file-drop').on('dragover', function(event) {
            event.preventDefault();
        });

        $('#file-drop').on('drop', function(event) {
            event.preventDefault();
            if (event.originalEvent.dataTransfer.items) {
                for (let item of event.originalEvent.dataTransfer.items) {
                    if (item.kind === 'file') {
                        currentFile = item.getAsFile();
                        $('#drop-text').text(currentFile.name);
                        console.log('File:', currentFile);
                    }
                }
            }
        });
    }

    function setupParseButton() {
        $('#parse').on('click', async function() {
            if (jobId) {
                if (!(await showConfirmModal())) {
                    return;
                }
                clearJob();
                $("#result").empty();
            }

            const schedule = $(`#schedule-${activeInput}`).val();
            if (!validateInput(schedule)) {
                return;
            }

            var formData = new FormData();
            if (activeInput === 'text') {
                formData.append('text', schedule);
                await processTextSchedule(formData);
            } else {
                formData.append('file', currentFile);
                await processImageSchedule(formData);
            }

            if (jobId) {
                pollForResult(jobId);
            }
        });
    }

    function validateInput(schedule) {
        if (activeInput === 'text' && schedule === '') {
            showAlert('Please enter a schedule', 'warning');
            return false;
        } else if (activeInput === 'image' && currentFile === null) {
            showAlert('Please upload an image', 'warning');
            return false;
        }
        return true;
    }

    async function processTextSchedule(formData) {
        const result = await fetch('http://localhost:8080/parse/text', {
            method: 'POST',
            body: formData
        }).then(response => response.json());

        if (result.jobId) {
            jobId = result.jobId;
            showAlert(`Your job is position ${result.queueLength} in the queue. Please wait.`, 'info');
        }
    }

    async function processImageSchedule(formData) {
        const result = await fetch('http://localhost:8080/parse/image', {
            method: 'POST',
            body: formData
        }).then(response => response.json());

        if (result.jobId) {
            jobId = result.jobId;
            showAlert(`Your job is position ${result.queueLength} in the queue. Please wait.`, 'info');
        }
    }

    function pollForResult(jobId) {
        const interval = setInterval(async () => {
            const result = await fetch(`http://localhost:8080/result/${jobId}`)
                .then(response => response.json());

            if (result.status !== 'pending') {
                clearInterval(interval);
                handleResult(result);
            }
        }, 1000);
    }

    function handleResult(result) {
        if (result.status === 'error') {
            showAlert(result.payload.error, 'danger');
        } else {
            displayEvents(result.payload.events);
            $("#export").removeClass("d-none");
            showAlert('Schedule parsed successfully! Make edits and export.', 'success');
        }
    }

    function displayEvents(events) {
        const resultElement = $('#result');
        resultElement.empty();
        $("#export").addClass("d-none");
        for (const event of events) {
            resultElement.append(createEventNode(event));
        }
    }

    function setupExportButton() {
        $("#export").on("click", async function() {
            if (!validateEvents())
                return;

            if (! (await showExportModal())) {
                // Export
            }
        });
    }

    function clearJob() {
        jobId = null;
        $('#schedule-text').val('');
        $('#schedule-image').val('');
        currentFile = null;
    }
});
