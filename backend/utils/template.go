package utils

import (
	"bytes"
	"text/template"
)

func ParseTemplate(templateStr string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("message").Parse(templateStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}
