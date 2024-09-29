package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
)

func testHandler(w http.ResponseWriter, r *http.Request) {
	jobId := "test-test-test"
	sendAcknowledgementResponse(w, jobId)
}

func imageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Receive image file from the client
	err := r.ParseMultipartForm(10 << 20) // 10 MB max size
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file: " + err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create a temporary file to store the image
	tempDir := os.TempDir()
	tempFile, err := os.CreateTemp(tempDir, "image-*.png")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tempFile.Close()

	// Write the image to the temporary file
	fileContent, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tempFile.Write(fileContent)

	// Add the file to the queue
	jobId := uuid.New().String()
	queue <- ParseRequest{reqType: "image", value: tempFile.Name(), jobId: jobId}
	addJob(jobId, ParseJob{status: "pending", payload: ResponseFormat{}})

	log.Printf("Added file %s to the queue\n", tempFile.Name())

	// Return the acknowledgement response as JSON
	sendAcknowledgementResponse(w, jobId)
}

func textHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10KB max size
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	log.Printf("Received %d values\n", len(r.MultipartForm.Value))
	for k, _ := range r.MultipartForm.Value {
		log.Println(k)
	}

	text := r.FormValue("text")
	if text == "" {
		http.Error(w, "Error retrieving text", http.StatusBadRequest)
	}

	// Add the request to the queue
	jobId := uuid.New().String()
	queue <- ParseRequest{reqType: "text", value: text, jobId: jobId}
	addJob(jobId, ParseJob{status: "pending", payload: ResponseFormat{}})

	log.Printf("Added text to the queue\n")

	// Return the acknowledgement response as JSON
	sendAcknowledgementResponse(w, jobId)
}

func resultHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	jobId := r.URL.Path[len("/result/"):]
	job, ok := getJob(jobId)
	if !ok {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	// Return the job status and payload as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	payloadBytes, err := json.Marshal(job.payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(`{"jobId": "` + jobId + `", "status": "` + job.status + `", "payload": ` + string(payloadBytes) + `}`))
}
