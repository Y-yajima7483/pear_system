# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker-based order management system (PEAR System) with:
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + React Hook Form + Zustand
- **Backend**: Laravel 10 (PHP 8.1) with Sanctum authentication
- **Database**: MySQL 8
- **Web Server**: nginx (reverse proxy)

The application appears to be an order/reservation/shipment management system with product varieties and pickup scheduling functionality.

## Claude Code Operational Rules

- When seeking user decisions, always use the `AskUserQuestion` tool
- Installing modules or packages is prohibited for security reasons
- Always review the plan file after creating it
- Use Sub agents as needed for reviews and web search information gathering
- Sub agent model selection:
  - **Simple tasks** (search, file exploration, pattern checking, light research) → use `model: "sonnet"` (Sonnet 4.6)
  - **Complex/advanced tasks** (architecture design, complex code analysis, implementation planning, advanced debugging) → use `model: "opus"` (Opus 4.6)