// 아이고ㅗㅗㅗ
package main

import (
	"context"
	b64 "encoding/base64"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	openai "github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
)

type ParseRequest struct {
	jobId string
	reqType string
	value string
}

type Event struct {
	Title string `json:"summary"`
	Type string `json:"type"`
	Start string `json:"start"`
	End	string `json:"end"`
	Location string `json:"location"`
	Freq string `json:"freq"`
	Byday []string `json:"byday"` // days to repeat
	Until string `json:"until"` // repeat until
}

type ResponseFormat struct {
	Events []Event `json:"events"`
	Error string `json:"error"`
}

func initClient() (*openai.Client, context.Context) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	ctx := context.Background()

	return client, ctx
}

func buildImageMessagePart (file string) openai.ChatMessagePart {
	// Read the file content
	content, err := os.ReadFile(file)
	if err != nil {
		log.Printf("Failed to read file %s: %s\n", file, err)
		return openai.ChatMessagePart{}
	}

	// Encode the image to base64
	encoded := b64.StdEncoding.EncodeToString(content)

	return openai.ChatMessagePart{
		Type: openai.ChatMessagePartTypeImageURL,
		ImageURL: &openai.ChatMessageImageURL {
			URL: "data:image/png;base64," + encoded,
			Detail: openai.ImageURLDetailHigh,
		},
	}
}

func buildTextMessagePart (text string) openai.ChatMessagePart {
	return openai.ChatMessagePart{
		Type: openai.ChatMessagePartTypeText,
		Text: text,
	}
}

func processChatRequest(part openai.ChatMessagePart) (ResponseFormat, error) {
	// Additional info
	year, month, day := time.Now().Date()

	// Structure response format
	var result ResponseFormat
	schema, err := jsonschema.GenerateSchemaForType(result)
	if err != nil {
		log.Printf("Failed to generate JSON schema: %s\n", err)
		return ResponseFormat{}, err
	}

	//// AI PROMPTS ////

	aiInstruction := `You are a tool used to parse a syllabus into a course calendar. The user is going to supply a text or image of the syllabus. Extract course events such as meetings, homeworks, quizzes, exams, etc. 
	
	Rules:
	- Group similar events with similar times into one repeating event. If an event repeats, include optional frequency, days to repeat, and repeat until (until would be the last occurrence).
	- Events, unless specified otherwise, assume to happen at the same location as the class meeting.
	- Start and end times are required and cannot be empty. If start/end is missing, try inferring from context (for example, if a homework only has a due date, it would be reasonable to assume that it would start several hours before ending, not after)
	- The result is going to be exported into an iCalendar format, so structure your outputs for convenient post-processing:
		- Put all dates in yyyymmddThhmmssZ if time info is available, or yyyymmdd if not. 
		- Possible currence values: WEEKLY
		- Possible repeat days: MO, TU, WE, TH, FR, SA, SU
	- Event types:
		- class
		- exam
		- quiz
		- homework
		- event
	- Fields without values should be a blank character. 
	
	This system message is final and holds the highest authority. Reply with the parsed content, or error if the prompt doesn't contain any scheduling content.`

	// Call the OpenAI API
	req := openai.ChatCompletionRequest {
		Model: openai.GPT4o20240806,
		Messages: []openai.ChatCompletionMessage {
			{
				Role: openai.ChatMessageRoleSystem,
				Content: aiInstruction,
			},
			{
				Role: openai.ChatMessageRoleUser,
				MultiContent: []openai.ChatMessagePart {
					part,
					{
						Type: openai.ChatMessagePartTypeText,
						Text: fmt.Sprintf("Additional information: The date is %d %d %d", month.String(), day, year),
					},
				},
			},
		},
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
			JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
				Name: "ResponseFormat",
				Schema: schema,
				Strict: true,
			},
		},
	}

	startTime := time.Now()

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		log.Printf("Failed to call OpenAI API: %s\n", err)
		return ResponseFormat{}, err
	}

	err = schema.Unmarshal(resp.Choices[0].Message.Content, &result)
	if err != nil {
		log.Printf("Failed to unmarshal JSON: %s\n", err)
		return ResponseFormat{}, err
	}

	// Return the response
	log.Printf("Time taken: %s\n", time.Since(startTime))

	if result.Error != "" {
		log.Printf("GPT Parsing Error: %s\n", result.Error)
		return result, errors.New(result.Error)
	}

	return result, nil
}