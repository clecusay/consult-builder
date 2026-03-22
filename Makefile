# ============================================================
# Makefile — Treatment Builder Dev Environment
# ============================================================
# Smart orchestration for local Supabase + dev servers.
#
# Usage:
#   make up        — Start everything (Supabase + dev servers)
#   make down      — Stop everything gracefully
#   make restart   — Full restart
#   make status    — Show what's running
#   make logs      — Tail dev server logs
#   make test      — Run all tests
#   make db-reset  — Reset DB with migrations + seed
#   make help      — Show all targets
#
# Supports both local Docker Supabase and remote deployments.
# Set USE_LOCAL_DB=0 to skip Docker/Supabase container management.
# ============================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# --------------- Configuration ---------------

# Web app port
WEB_PORT       ?= 3001
# Widget dev port
WIDGET_PORT    ?= 5173
# Set to 0 to use remote Supabase (skip Docker entirely)
USE_LOCAL_DB   ?= 1
# Supabase API port (from config.toml)
SUPA_API_PORT  ?= 54321
# PID files for background processes
PID_DIR        := .pids
DEV_PID        := $(PID_DIR)/dev.pid
LOG_DIR        := .logs
DEV_LOG        := $(LOG_DIR)/dev.log

# --------------- Helpers ---------------

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
CYAN   := \033[0;36m
BOLD   := \033[1m
RESET  := \033[0m

define log_info
	@printf "$(CYAN)▸$(RESET) %s\n" $(1)
endef

define log_ok
	@printf "$(GREEN)✓$(RESET) %s\n" $(1)
endef

define log_warn
	@printf "$(YELLOW)⚠$(RESET) %s\n" $(1)
endef

define log_err
	@printf "$(RED)✗$(RESET) %s\n" $(1)
endef

# --------------- Pre-flight checks ---------------

.PHONY: _ensure-dirs
_ensure-dirs:
	@mkdir -p $(PID_DIR) $(LOG_DIR)

.PHONY: _check-deps
_check-deps:
	@command -v pnpm  >/dev/null 2>&1 || { printf "$(RED)✗$(RESET) pnpm not found. Install: https://pnpm.io/installation\n"; exit 1; }
	@command -v node  >/dev/null 2>&1 || { printf "$(RED)✗$(RESET) node not found.\n"; exit 1; }
ifeq ($(USE_LOCAL_DB),1)
	@command -v docker   >/dev/null 2>&1 || { printf "$(RED)✗$(RESET) docker not found. Install Docker Desktop or: brew install docker\n"; exit 1; }
	@command -v supabase >/dev/null 2>&1 || { printf "$(RED)✗$(RESET) supabase CLI not found. Install: brew install supabase/tap/supabase\n"; exit 1; }
endif

# --------------- Docker / Supabase ---------------

# Check if Docker daemon is reachable
define docker_is_running
$(shell docker info >/dev/null 2>&1 && echo 1 || echo 0)
endef

# Check if Supabase API is responding
define supa_is_healthy
$(shell curl -sf http://127.0.0.1:$(SUPA_API_PORT)/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" >/dev/null 2>&1 && echo 1 || echo 0)
endef

# Check if Supabase containers exist (running or stopped)
define supa_containers_exist
$(shell docker ps -a --filter "name=supabase_db_treatment-builder" --format '{{.ID}}' 2>/dev/null | head -1 | grep -q . && echo 1 || echo 0)
endef

.PHONY: db-up
db-up: _check-deps
ifeq ($(USE_LOCAL_DB),1)
	@# --- Docker daemon check ---
	@if [ "$(call docker_is_running)" = "0" ]; then \
		printf "$(RED)✗$(RESET) Docker daemon is not running. Please start Docker Desktop.\n"; \
		exit 1; \
	fi
	@# --- Health check: is Supabase already healthy? ---
	@if [ "$(call supa_is_healthy)" = "1" ]; then \
		printf "$(GREEN)✓$(RESET) Supabase is already running and healthy on :$(SUPA_API_PORT)\n"; \
	elif [ "$(call supa_containers_exist)" = "1" ]; then \
		printf "$(YELLOW)⚠$(RESET) Supabase containers exist but are unhealthy. Restarting...\n"; \
		supabase stop 2>/dev/null || true; \
		supabase start; \
		printf "$(GREEN)✓$(RESET) Supabase restarted\n"; \
	else \
		printf "$(CYAN)▸$(RESET) Starting Supabase (first run may pull images)...\n"; \
		supabase start; \
		printf "$(GREEN)✓$(RESET) Supabase started\n"; \
	fi
else
	@printf "$(CYAN)▸$(RESET) USE_LOCAL_DB=0 — skipping local Supabase (using remote)\n"
endif

.PHONY: db-down
db-down:
ifeq ($(USE_LOCAL_DB),1)
	@if [ "$(call supa_containers_exist)" = "1" ]; then \
		printf "$(CYAN)▸$(RESET) Stopping Supabase...\n"; \
		supabase stop; \
		printf "$(GREEN)✓$(RESET) Supabase stopped\n"; \
	else \
		printf "$(CYAN)▸$(RESET) Supabase is not running\n"; \
	fi
else
	@printf "$(CYAN)▸$(RESET) USE_LOCAL_DB=0 — nothing to stop\n"
endif

.PHONY: db-reset
db-reset: db-up
ifeq ($(USE_LOCAL_DB),1)
	$(call log_info,"Resetting database (migrations + seed)...")
	@supabase db reset
	$(call log_ok,"Database reset complete")
else
	$(call log_warn,"USE_LOCAL_DB=0 — run migrations manually against your remote DB")
endif

# --------------- Dev Servers ---------------

# Check if dev server is already running (PID file + process alive + port responding)
define dev_is_running
$(shell [ -f $(DEV_PID) ] && kill -0 $$(cat $(DEV_PID)) 2>/dev/null && curl -sf http://localhost:$(WEB_PORT) >/dev/null 2>&1 && echo 1 || echo 0)
endef

# Check if something else is using our web port
define web_port_in_use
$(shell lsof -ti:$(WEB_PORT) >/dev/null 2>&1 && echo 1 || echo 0)
endef

.PHONY: dev-up
dev-up: _ensure-dirs _check-deps
	@# Single shell block so early-exit actually works
	@set -e; \
	if [ -f $(DEV_PID) ] && kill -0 $$(cat $(DEV_PID)) 2>/dev/null && curl -sf http://localhost:$(WEB_PORT) >/dev/null 2>&1; then \
		printf "$(GREEN)✓$(RESET) Dev servers already running (PID: $$(cat $(DEV_PID)))\n"; \
		exit 0; \
	fi; \
	if lsof -ti:$(WEB_PORT) >/dev/null 2>&1; then \
		PID=$$(lsof -ti:$(WEB_PORT) | head -1); \
		printf "$(YELLOW)⚠$(RESET) Port $(WEB_PORT) in use by PID $$PID. Killing...\n"; \
		lsof -ti:$(WEB_PORT) | xargs kill -9 2>/dev/null || true; \
		sleep 1; \
	fi; \
	rm -f $(DEV_PID); \
	printf "$(CYAN)▸$(RESET) Starting dev servers in background...\n"; \
	nohup pnpm dev > $(DEV_LOG) 2>&1 & echo $$! > $(DEV_PID); \
	printf "$(CYAN)▸$(RESET) Waiting for web server on :$(WEB_PORT)..."; \
	for i in $$(seq 1 30); do \
		if curl -sf http://localhost:$(WEB_PORT) >/dev/null 2>&1; then \
			printf " $(GREEN)ready$(RESET)\n"; \
			break; \
		fi; \
		printf "."; \
		sleep 1; \
		if [ $$i -eq 30 ]; then \
			printf " $(YELLOW)timeout$(RESET) (server may still be starting — check: make logs)\n"; \
		fi; \
	done; \
	printf "$(GREEN)✓$(RESET) Dev servers started (PID: $$(cat $(DEV_PID)))\n"; \
	printf "  $(BOLD)Web:$(RESET)    http://localhost:$(WEB_PORT)\n"; \
	printf "  $(BOLD)Widget:$(RESET) http://localhost:$(WIDGET_PORT)\n"; \
	if [ "$(USE_LOCAL_DB)" = "1" ]; then \
		printf "  $(BOLD)Studio:$(RESET) http://127.0.0.1:54323\n"; \
	fi

.PHONY: dev-down
dev-down:
	@if [ "$(call dev_is_running)" = "1" ]; then \
		PID=$$(cat $(DEV_PID)); \
		printf "$(CYAN)▸$(RESET) Stopping dev servers (PID: $$PID)...\n"; \
		kill -- -$$PID 2>/dev/null || kill $$PID 2>/dev/null || true; \
		sleep 1; \
		kill -0 $$PID 2>/dev/null && kill -9 $$PID 2>/dev/null || true; \
		rm -f $(DEV_PID); \
		printf "$(GREEN)✓$(RESET) Dev servers stopped\n"; \
	else \
		printf "$(CYAN)▸$(RESET) Dev servers not running\n"; \
		rm -f $(DEV_PID); \
	fi
	@# Cleanup any orphaned processes on our ports
	@lsof -ti:$(WEB_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(WIDGET_PORT) | xargs kill -9 2>/dev/null || true

# --------------- Orchestration ---------------

.PHONY: up
up: _ensure-dirs _check-deps db-up dev-up ## Start everything (Supabase + dev servers)
	@echo ""
	@printf "$(GREEN)$(BOLD)🚀 Environment ready$(RESET)\n"

.PHONY: down
down: dev-down db-down ## Stop everything gracefully
	@rm -rf $(PID_DIR)
	@echo ""
	@printf "$(GREEN)$(BOLD)🛑 Environment stopped$(RESET)\n"

.PHONY: restart
restart: down up ## Full restart

# --------------- Utilities ---------------

.PHONY: status
status: ## Show what's running
	@echo ""
	@printf "$(BOLD)═══ Environment Status ═══$(RESET)\n"
	@echo ""
	@# Docker
	@if [ "$(call docker_is_running)" = "1" ]; then \
		printf "  $(GREEN)●$(RESET) Docker          running\n"; \
	else \
		printf "  $(RED)●$(RESET) Docker          not running\n"; \
	fi
	@# Supabase
ifeq ($(USE_LOCAL_DB),1)
	@if [ "$(call supa_is_healthy)" = "1" ]; then \
		printf "  $(GREEN)●$(RESET) Supabase API    http://127.0.0.1:$(SUPA_API_PORT)\n"; \
	elif [ "$(call supa_containers_exist)" = "1" ]; then \
		printf "  $(YELLOW)●$(RESET) Supabase        containers exist but unhealthy\n"; \
	else \
		printf "  $(RED)●$(RESET) Supabase        not running\n"; \
	fi
else
	@printf "  $(CYAN)●$(RESET) Supabase        remote (USE_LOCAL_DB=0)\n"
endif
	@# Dev servers
	@if [ "$(call dev_is_running)" = "1" ]; then \
		printf "  $(GREEN)●$(RESET) Dev servers     PID $$(cat $(DEV_PID))\n"; \
		printf "           $(BOLD)Web:$(RESET)    http://localhost:$(WEB_PORT)\n"; \
		printf "           $(BOLD)Widget:$(RESET) http://localhost:$(WIDGET_PORT)\n"; \
	else \
		printf "  $(RED)●$(RESET) Dev servers     not running\n"; \
	fi
	@echo ""

.PHONY: logs
logs: ## Tail dev server logs
	@if [ -f $(DEV_LOG) ]; then \
		tail -f $(DEV_LOG); \
	else \
		printf "$(YELLOW)⚠$(RESET) No log file found. Start servers first: make up\n"; \
	fi

.PHONY: install
install: _check-deps ## Install dependencies
	$(call log_info,"Installing dependencies...")
	@pnpm install
	$(call log_ok,"Dependencies installed")

.PHONY: test
test: ## Run all tests (unit + integration)
	@pnpm test

.PHONY: test-unit
test-unit: ## Run unit tests only
	@pnpm test:unit

.PHONY: test-integration
test-integration: db-up ## Run integration tests (starts Supabase if needed)
	@pnpm test:integration

.PHONY: test-e2e
test-e2e: db-up ## Run E2E tests (starts Supabase if needed)
	@pnpm test:e2e

.PHONY: build
build: ## Production build
	@pnpm build

.PHONY: lint
lint: ## Run linters
	@pnpm lint

.PHONY: clean
clean: down ## Stop everything and clean build artifacts
	$(call log_info,"Cleaning build artifacts...")
	@rm -rf apps/web/.next apps/widget/dist
	@rm -rf $(PID_DIR) $(LOG_DIR)
	$(call log_ok,"Clean complete")

.PHONY: nuke
nuke: ## Full reset: stop everything, remove node_modules, reinstall
	@printf "$(RED)$(BOLD)This will stop all services, remove node_modules, and reinstall.$(RESET)\n"
	@printf "Continue? [y/N] "; read -r ans; [ "$$ans" = "y" ] || exit 1
	@$(MAKE) down
	$(call log_info,"Removing node_modules...")
	@rm -rf node_modules apps/web/node_modules apps/widget/node_modules packages/shared/node_modules
	@rm -rf $(PID_DIR) $(LOG_DIR)
	@$(MAKE) install
ifeq ($(USE_LOCAL_DB),1)
	@$(MAKE) db-reset
endif
	$(call log_ok,"Nuke complete. Run: make up")

# --------------- Help ---------------

.PHONY: help
help: ## Show this help
	@echo ""
	@printf "$(BOLD)Treatment Builder — Dev Commands$(RESET)\n"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)make %-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@printf "$(BOLD)Env vars:$(RESET)\n"
	@printf "  USE_LOCAL_DB=0    Skip Docker/Supabase (use remote DB)\n"
	@printf "  WEB_PORT=3001     Web app port\n"
	@printf "  WIDGET_PORT=5173  Widget dev port\n"
	@echo ""
