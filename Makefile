# ECME Platform Makefile
# Type 'make' to start

.PHONY: all start stop clean help

all: start

start:
	@chmod +x setup.sh
	@./setup.sh

stop:
	@echo "Stopping ECME..."
	@pkill -f "node server.cjs" || true
	@pkill -f "npm run dev" || true
	@echo "ECME stopped"

clean:
	@chmod +x cleanup.sh
	@./cleanup.sh

help:
	@echo "ECME Platform Commands:"
	@echo "  make       - Start ECME"
	@echo "  make stop  - Stop ECME"
	@echo "  make clean - Remove dependencies"
	@echo "  make help  - Show this message"