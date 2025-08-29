FROM golang:1.22 AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Ensure module files reflect imports
RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/bin/service ./

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -H appuser
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
USER appuser
EXPOSE 8081
ENTRYPOINT ["/app/service"]


