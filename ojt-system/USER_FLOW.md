# OJT System — User Flows

This document describes the primary user flows for each role, the main screens involved, and the backend endpoints used. Keep this as a quick reference for developers and testers.

## Roles
- Student
- OJT Coordinator
- Company Supervisor
- Admin / Academic Office

---

## Student Flow

1. Register / Login
   - Screens: `Register`, `Login`
   - Endpoints: `POST /auth/register`, `POST /auth/login`

2. Verify Portal
   - Screens: `Dashboard` → `PortalVerifyWidget`
   - Endpoints: `POST /auth/verify-portal`, `GET /auth/me`

3. Apply for OJT
   - Screens: `Application`
   - Endpoints: `POST /applications`, `GET /applications` (own)
   - Preconditions: portal verified, eligible (no disqualifying grades)

4. View Placement
   - Screens: `Placement`, `Dashboard`
   - Endpoints: `GET /placements` (my placements), `GET /placements/{id}`

5. Log Hours (DTR)
   - Screens: `DTR` (Log form, History)
   - Endpoints: `POST /dtr`, `GET /dtr/{placement_id}`, `DELETE /dtr/{id}`
   - Rules: cannot log >12h/day, cannot exceed required hours

6. Weekly Reports
   - Screens: `WeeklyReports` (Submit + History)
   - Endpoints: `POST /weekly-reports`, `GET /weekly-reports/{placement_id}`

7. Portfolio & Grades
   - Screens: `Portfolio`, `Grades`
   - Endpoints: `POST /evaluations/portfolio`, `GET /evaluations/{placement_id}/grade`, `GET /evaluations/{placement_id}`

8. Requests
   - Transfer request: `POST /placements/{id}/transfer`

---

## OJT Coordinator Flow

1. Login & Dashboard
   - Screens: `Coordinator Dashboard`, `Monitoring`, `Applications`, `Placements`, `MOA`
   - Endpoints: `GET /monitoring/dashboard-stats`, `GET /applications`, `GET /placements` (all)

2. Review / Approve Applications
   - Screens: `Applications` (list, review)
   - Endpoints: `PUT /applications/{id}/review`

3. Assign Placements
   - Screens: `Placements` (assign form)
   - Endpoints: `POST /placements`

4. Monitor Students
   - Screens: `Monitoring` (section view, at-risk list)
   - Endpoints: `GET /placements`, `GET /dtr/{placement_id}`, `GET /weekly-reports/` (coordinator view)

5. Weekly Report Acknowledgement
   - Screens: `WeeklyReports` (queue)
   - Endpoints: `PUT /weekly-reports/{id}/acknowledge`

6. MOA Approval Workflow
   - Screens: `MOA` (request list, advance/reject)
   - Endpoints: `POST /moa`, `POST /moa/{id}/advance`, `POST /moa/{id}/reject`

7. Transfer Reviews
   - Screens: `Placements → Transfers`
   - Endpoints: `GET /placements/transfers/all`, `PUT /placements/transfers/{id}/review`

---

## Company Supervisor Flow

1. Login / View Interns
   - Screens: `Supervisor Dashboard`, `My Interns`
   - Endpoints: `GET /evaluations/my-interns`, `GET /placements` (filtered)

2. Submit Evaluations
   - Screens: `Evaluations` (form per intern)
   - Endpoints: `POST /evaluations`, `GET /evaluations/{placement_id}`

3. Verify / Comment on DTR or Reports (if allowed)
   - Screens: `DTR`, `WeeklyReports` (company-side if enabled)

---

## Admin / Academic Office Flow

1. User Management
   - Screens: `Admin → Users`
   - Endpoints: `POST /auth/admin/create-user`, `GET /auth/admin/users`, `PUT /auth/admin/users/{id}/toggle`

2. Company Management
   - Screens: `Admin → Companies`
   - Endpoints: `GET /companies`, `POST /companies`, `PUT /companies/{id}`, `POST /companies/{id}/accredit`

3. Reporting & Exports
   - Screens: `Reports` (exports, archives)
   - Endpoints: `GET /reports/overview`, `GET /reports/excel`, `GET /reports/certificate/{placement_id}`, `POST /reports/archive`

4. Full-system oversight: MOA approvals, placements, data exports

---


