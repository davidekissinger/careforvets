# CareForVets Design Document Template

Use this template for every material v2 feature, integration, or schema change.

## Document Control
- **Feature / system:**
- **Owner:**
- **Version:**
- **Status:** Draft / Review / Approved / Implemented
- **Target release:**
- **Related issue/PR:**

## 1. Problem
What user or operating problem are we solving?

## 2. Users
Who uses this?
- Veteran
- Candidate
- Employer
- Partner
- CareForVets staff/admin
- Public visitor
- Other

## 3. Scope
### In scope
- 

### Out of scope
- 

## 4. User Stories
- As a ___, I need ___ so that ___.

## 5. Workflow
Document the happy path and material exception paths.

```text
Start → Step → Decision → Step → Outcome
```

## 6. Data Model
For every new/changed entity:
- table/entity name
- fields
- required vs optional
- foreign keys
- uniqueness constraints
- status model
- retention
- PII/PHI classification

## 7. Authorization
Document:
- public permissions
- authenticated-user permissions
- organization-scoped permissions
- staff/admin permissions
- RLS policies
- storage policies

## 8. UI / Routes
- route/screen
- purpose
- inputs
- outputs
- empty state
- error state
- mobile behavior
- accessibility considerations

## 9. API / Functions
For every server-side operation:
- endpoint/function
- auth requirement
- request
- response
- secrets used
- retries
- idempotency
- audit event
- failure handling

## 10. Evidence / Provenance
If the feature presents a verification, referral, resource, credential, or status:
- source
- who verified
- when verified
- evidence retained
- expiration/re-review date
- what the status actually means
- what the status must not imply

## 11. Notifications
- trigger
- audience
- channel
- template
- opt-out rules
- failure path

## 12. Security & Privacy
- sensitive data
- encryption expectations
- RLS
- document access
- public exposure
- logging
- rate limits
- abuse controls
- PHI boundary

## 13. Accessibility
- keyboard
- focus
- labels
- screen-reader behavior
- contrast
- status/error announcements

## 14. Analytics
Define only measures that can be supported by actual events.
- event
- properties
- business meaning
- retention

## 15. Test Plan
- unit tests
- integration tests
- RLS tests
- role/permission tests
- accessibility checks
- browser/mobile checks
- negative/security cases

## 16. Migration / Rollout
- database migration
- seed/backfill
- feature flag
- rollout sequence
- rollback

## 17. Release Gates
What must be true before production?

## 18. Open Questions
- 

## 19. Decision Log
| Date | Decision | Reason | Owner |
|---|---|---|---|
