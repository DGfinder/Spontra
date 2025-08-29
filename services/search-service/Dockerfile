FROM golang:1.22 AS builder
WORKDIR /app

# Cache deps first
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build static binary for Linux
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/bin/service ./

# Minimal runtime with certs
FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -H appuser
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
USER appuser
EXPOSE 8084
ENTRYPOINT ["/app/service"]


