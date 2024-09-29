package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/sashabaranov/go-openai"
)

var (
	port = ":8080"
	queue = make(chan ParseRequest, 20)

	ctx context.Context
	client *openai.Client
)

func main() {
	// Start the file processing routine
	for i := range(3) {
		go processRequests(i)
	}

	// Initialize the OpenAI client
	client, ctx = initClient()

	// Testing only
	testSetup(true)

	// Start the server
	// http.HandleFunc("/parse/image", imageHandler)
	// http.HandleFunc("/parse/text", textHandler)
	http.HandleFunc("/result/{jobId}", resultHandler)
	
	// Serve the static files
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})
	http.HandleFunc("/static/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	log.Println("Server started ", port)
	log.Fatal(http.ListenAndServe(port, nil))

	defer close(queue)
}

func sendAcknowledgementResponse(w http.ResponseWriter, jobId string) {
	// Get current position in the queue
	queueLength := len(queue)

	// Return the response
	log.Printf("Acknowledgement response: %s\n", jobId)
	log.Printf("Queue length: %d\n", queueLength)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"jobId": "` + jobId + `", "queueLength": ` + strconv.Itoa(queueLength) + `}`))
}

func processRequests(id int) {
	for req := range queue {
		log.Printf("Worker %d processing request ID %s\n", id, req.jobId)

		var part openai.ChatMessagePart

		// Build request from value
		switch req.reqType {
		case "image":
			part = buildImageMessagePart(req.value)
		case "text":
			part = buildTextMessagePart(req.value)
		default:
			log.Println("Error handling request. Skipping.")
		}

		// Run chat completion request
		result, err := processChatRequest(part)
		if err != nil {
			log.Printf("Error processing chat request: %s\n", err)
			updateJob(req.jobId, ParseJob{status: "error", payload: ResponseFormat{Error: err.Error()}})
		} else {
			updateJob(req.jobId, ParseJob{status: "completed", payload: result})
		}

		// Remove the file from the queue
		if req.reqType == "image" {
			err := os.Remove(req.value)
			if err != nil {
				log.Printf("Failed to remove file %s: %s\n", req.value, err)
			}
		}
	}
}

func testSetup(test bool) {
	if !test {
		return
	}

	http.HandleFunc("/parse/{type}", testHandler)

	// Load test file
	testFile := "test.json"
	testContent, err := os.ReadFile(testFile)
	if err != nil {
		log.Printf("Failed to read file %s: %s\n", testFile, err)
		return
	}

	// Unmarshal the test content
	var testReq ResponseFormat
	err = json.Unmarshal(testContent, &testReq)
	if err != nil {
		log.Printf("Failed to unmarshal test content: %s\n", err)
		return
	}

	addJob("test-test-test", ParseJob{status: "completed", payload: testReq})
}