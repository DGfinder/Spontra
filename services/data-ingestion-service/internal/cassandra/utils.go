package cassandra

import (
	"encoding/json"
	"fmt"
)

// serializeToJSON converts any struct to JSON string
func serializeToJSON(data interface{}) (string, error) {
	if data == nil {
		return "{}", nil
	}
	
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal to JSON: %w", err)
	}
	
	return string(jsonBytes), nil
}

// deserializeFromJSON converts JSON string to struct
func deserializeFromJSON(jsonStr string, target interface{}) error {
	if jsonStr == "" || jsonStr == "{}" {
		return nil
	}
	
	if err := json.Unmarshal([]byte(jsonStr), target); err != nil {
		return fmt.Errorf("failed to unmarshal from JSON: %w", err)
	}
	
	return nil
}