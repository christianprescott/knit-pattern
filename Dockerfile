FROM python:3.12-alpine

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY assets ./assets

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
