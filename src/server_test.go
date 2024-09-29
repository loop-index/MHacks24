package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInputHandlers(t *testing.T) {
	inputHandlers := map[string]func(w http.ResponseWriter, r *http.Request) {
		"/parse/image": imageHandler,
		"/parse/text": textHandler,
	}

	t.Run("TEST: REQUEST METHODS", func(t *testing.T) {
		invalidMethods := []string {
			http.MethodGet, http.MethodPatch,
			http.MethodPut, http.MethodDelete,
		}

		for endpoint, handler := range inputHandlers {
			for _, m := range invalidMethods {
				req, err := http.NewRequest(m, endpoint, nil)
				if err != nil {
					t.Fatal("Error creating request: ", err)
				}

				res := httptest.NewRecorder()
				handler(res, req)

				expected := http.StatusMethodNotAllowed
				actual := res.Result().StatusCode

				if actual != expected {
					t.Errorf("Testing method %s for %s: expected %d, got %d", m, endpoint, expected, actual)
				}
			}
		}
	})
}