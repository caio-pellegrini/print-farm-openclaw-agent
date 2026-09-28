# Stage 6 Report — Manual Production Workflow

**Date:** 2026-09-28  
**Assessment:** **PASSED for the manual-adapter scope**

## Implemented

Stage 6 adds a channel-neutral, persistent domain workflow after a print job and approval already exist. It reuses the Stage 4/5 SQLite jobs, orders, quotes, printers, users, roles, and event log.

The `PrinterAdapter` contract and `ManualPrinterAdapter` are first-class. A manual printer represents a person physically operating the configured machine and confirming each action. It makes no API call and claims no telemetry.

The workflow in `experiments/production_workflow.py` provides:

- `list_ready_jobs`: list only persisted jobs whose quote is `approved`, order is `approved` or `queued`, and job is `queued`.
- `mark_ready_for_production`: move a newly created job into the ready queue only when its quote and order are already approved.
- `inspect_production_job`: read persisted status for any staff job or only the caller's own customer job.
- `assign_printer`: assign an active configured printer to a ready job.
- `start_job`: require an assigned printer and record the operator-confirmed start.
- `finish_job`: record an operator-confirmed `COMPLETED` or `FAILED` result.

Every assignment and status change is recorded in `job_events` in the same SQLite transaction as the state update. Owner and Operator are authorized through the existing `job.read_any` and `job.status.update` capabilities. Customers cannot list the staff queue, assign printers, start or finish jobs, and cannot inspect another customer's job.

The existing `update_job_status` entry point now delegates to these validated transitions, so callers cannot skip printer assignment or quote approval with a direct `IN_PROGRESS` update.

The state flow is `created` → `READY_FOR_PRODUCTION` → printer assignment → `IN_PROGRESS` → `COMPLETED` or `FAILED`. The first transition is optional when an upstream workflow has already queued an approved job. For compatibility with the existing `print_jobs.status` constraint, `READY_FOR_PRODUCTION` is persisted as `queued`; the other public values map to existing lowercase database states. The order status is updated alongside the print job when it becomes ready, starts, or ends.

## Persistence change

Schema v10 adds `printers.adapter_id TEXT NOT NULL DEFAULT 'manual'`. This is an additive migration; all existing printer rows become manually operated records. There is no new assignment table because `print_jobs.printer_id` already stores the assignment and `job_events` stores its history.

The migration is exercised from a preexisting database fixture. A production job was assigned and started in one process, then read as `IN_PROGRESS` with its printer ID from a fresh Python process.

## Trust and scope boundaries

The workflow requires an already approved quote and approved/queued order. It does not create or approve a quote, change profile/material/business validation, or issue customer pricing. Existing Stage 4 digest and quote-readiness checks remain authoritative.

No Stage 5 WhatsApp intake, media correlation, reply deduplication, channel bridge, or public messaging code was changed. The production API is not wired into the public WhatsApp plugin. Stage 5 remains partially passed until live Gateway authorization proof for customer and staff identities is complete.

## Verification

`python3 -W ignore::ResourceWarning -m unittest discover -s tests`: **55 tests passed**. Coverage includes OWNER/OPERATOR actions, CUSTOMER denials and own-job reads, approved-quote gating, required transition order, completed and failed outcomes, adapter audit details, migration idempotence and v9 printer preservation, existing quote trust tests, intake regression tests, and subprocess restart persistence. The print-farm plugin's `npm test` also passed (11 tests).

## Deferred

Stage 6 is passed only for the manual adapter. OctoPrint, Moonraker, Bambu, and Creality connections; remote start/pause/cancel; live telemetry; printer state synchronization; automatic discovery; spool synchronization; and scheduling remain future work. Exposing production actions through a staff Gateway surface also awaits Stage 5's live authorization proof.
