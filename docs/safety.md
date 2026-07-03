# CookieDough Safety Model

CookieDough audits code and deployed apps that may be untrusted.

## Repo Execution

Docker is preferred for repo command execution. Host execution is allowed only when the user chooses `--docker auto` or `--docker off`, and reports state when host execution occurred.

If Docker is required but unavailable, CookieDough blocks repo command execution and records a blocker finding instead of silently falling back.

## Credentials

Credentials are read only for the current run. CookieDough extracts string values from the credential file, registers them as redaction patterns, and does not copy the credential file into report artifacts.

## Payment and Destructive Actions

Browser automation avoids payment submission and controls labeled as destructive, including delete, remove, purchase, checkout, pay, send money, and transfer.

## Evidence

Findings must point to evidence. Reports should also say what CookieDough did not verify so users do not confuse partial coverage with safety.
