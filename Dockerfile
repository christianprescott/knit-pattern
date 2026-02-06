FROM python:3.12-alpine

RUN apk --no-cache add curl

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY assets ./assets

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=10s \
 CMD curl http://localhost:8080/health

# Run the server
CMD ["python", "server.py"]
