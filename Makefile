.PHONY: start

.EXPORT_ALL_VARIABLES:

SHELL := /bin/bash
PORT := 0
ENV := development

all:	clear echo start ## Starts the dev server

clear:
	@clear

install: ## Runs 'pnpm' to install dependencies
	@echo 'Installing dependencies'
	pnpm install
	@echo ""; echo "-------------------------------"; echo ""

echo:
	@echo Starting ember-brand-manager

start:
	pnpm --filter @upfluence/ember-brand-manager exec ember serve --port $(PORT) --environment ${ENV}

build:
	pnpm --filter @upfluence/ember-brand-manager exec ember build --environment ${ENV}

test:
	pnpm test

clean: ## Cleans ./node_modules && ./dist
	@echo "Cleaning up workspace dependencies and build outputs"
	-rm -r ./node_modules
	-rm -r ./dist
	-rm -r ./packages/ember-brand-manager/node_modules
	-rm -r ./packages/ember-brand-manager/dist
	-rm -r ./packages/ember-brand-manager/tmp
	@echo ""; echo "-------------------------------"; echo ""

re:	clean install echo start ## Reinstalls dependencies & starts the dev server

help:	clear ## Displays the help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

h: help ## Displays the help message

version_patch: ## Creates & pushes a new patch tag
	./scripts/new-version-tag patch

version_minor: ## Creates & pushes a new minor tag
	./scripts/new-version-tag minor

version_major: ## Creates & pushes a new major tag
	./scripts/new-version-tag major

sonar-report: ## Runs a bunch of commands that will finally lead to a new report in sonarqube
	./scripts/generate_sonar_report
