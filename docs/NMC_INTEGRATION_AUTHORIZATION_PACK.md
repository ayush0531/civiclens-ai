# CivicLens AI — NMC Integration Authorization Pack

**Purpose:** Request an official technical discussion and written permission for a pilot integration. This is a request template, not an executed agreement or evidence of NMC approval.

## 1. Requested decision from Nagpur Municipal Corporation

CivicLens AI requests that NMC:
1. Nominate an authorised nodal officer from the relevant grievance-redressal / IT department.
2. Confirm whether NMC has an approved API or other machine-to-machine intake channel for citizen road-damage complaints.
3. If available, provide the official API specification, sandbox, authentication method, allowed complaint categories, attachment limits, rate limits, and status callback mechanism.
4. If no API is available, consider written approval for a controlled email-forwarding pilot to an NMC-designated mailbox, including the responsible department and acknowledgement process.
5. Confirm data retention, privacy, security, consent, incident handling, and operational responsibilities in writing.

## 2. Proposed citizen journey

- A citizen submits a road-damage photo, location, description, and contact details to CivicLens AI.
- CivicLens AI validates the submission and provides an internal CivicLens reference.
- The citizen explicitly consents to sharing the report and attached personal data with NMC for grievance handling.
- Only after NMC grants written approval and supplies the official destination/protocol, CivicLens sends the complaint through that approved channel.
- CivicLens stores the external receipt/reference returned by NMC, if one is provided.
- Statuses are displayed separately: Received by CivicLens; Queued for authorised NMC forwarding; Forwarded to NMC (only after confirmed transmission); Acknowledged by NMC (only after a genuine NMC acknowledgement).

## 3. Proposed pilot scope

- Use case: potholes and road-surface damage within NMC jurisdiction.
- Pilot: limited ward(s), limited duration, and agreed daily submission volume.
- Human review: configurable pre-submission review for low-confidence or ambiguous reports.
- Duplicate detection: CivicLens may flag possible duplicates; NMC retains authority over case acceptance and assignment.
- Evidence: image, GPS coordinates, locality/landmark, description, submission timestamp, citizen consent record, and CivicLens reference.
- Feedback: NMC acknowledgement/reference and status updates only if NMC's approved channel supports them.

## 4. Security and privacy commitments proposed

- HTTPS/TLS in transit; encryption at rest where supported by the hosting environment.
- Least-privilege credentials stored only as deployment secrets; never in source control.
- No bypass of OTP, CAPTCHA, login, rate limits, or other NMC access controls.
- Explicit citizen consent before personal data or images are transmitted to NMC.
- Minimise data shared; define retention/deletion and access controls with NMC.
- Audit every outbound attempt, response, retry, and status update.
- Idempotency protection to prevent duplicate complaints.
- Disable outbound transmission immediately if credentials are revoked or an incident is suspected.

## 5. Items requiring NMC confirmation

| Item | NMC confirmation |
|---|---|
| Official API or designated email destination | Pending |
| Written authorisation / MOU / pilot approval | Pending |
| API specification or email-submission rules | Pending |
| Authentication and credential provisioning | Pending |
| Permitted complaint categories and jurisdiction rules | Pending |
| Acknowledgement/reference format | Pending |
| Status updates / webhook availability | Pending |
| Data protection, retention, and incident contacts | Pending |
| Pilot wards, limits, and operational owner | Pending |

## 6. Draft email requesting a meeting

**Subject:** Request for NMC guidance and authorisation for CivicLens AI road-damage complaint integration

To
The Municipal Commissioner / Designated Grievance Redressal and IT Officer
Nagpur Municipal Corporation
Nagpur, Maharashtra

Respected Sir/Madam,

We are developing CivicLens AI, an academic civic-technology project that helps citizens report potholes and road-surface damage with photographs, GPS location, and structured complaint details.

We request a technical meeting with the appropriate NMC grievance-redressal and IT representatives to understand the Corporation's approved process for receiving citizen road-damage complaints from an external application.

Our objective is to avoid creating a parallel complaint authority. We want CivicLens AI to act only as an authorised intake channel, if NMC permits it, while NMC remains the official authority for registration, assignment, action, and closure.

Kindly advise whether NMC can provide an approved API / sandbox and technical specification, or written permission and a designated official mailbox with prescribed email-submission and acknowledgement procedures for a limited pilot.

We will not transmit citizens' personal information or represent any report as an official NMC complaint unless the Corporation has approved the channel in writing. We are prepared to follow NMC's requirements for citizen consent, data security, retention, authentication, audit, and operational limits.

We would be grateful if you could nominate a nodal officer or share the appropriate department/contact for this request.

Yours faithfully,

Project Team — CivicLens AI
GH Raisoni College of Engineering, Nagpur
Project contact: [Add authorised student/faculty contact details]

---

## 7. Activation checklist — do not enable live transmission until complete

- [ ] Written NMC approval / MOU / pilot permission received and reviewed.
- [ ] Official API documentation or designated mailbox and submission rules received directly from NMC.
- [ ] NMC sandbox test completed successfully, if provided.
- [ ] Production endpoint and credentials provisioned by NMC.
- [ ] Citizen consent wording and privacy notice approved.
- [ ] Data retention, access, and incident process agreed.
- [ ] Idempotency, retry, audit, and acknowledgement handling tested.
- [ ] NMC confirms pilot start and operational owner.
- [ ] Production secrets configured outside GitHub.
- [ ] End-to-end test receipt independently verified with NMC.

**Current implementation state:** CivicLens contains an integration adapter scaffold. No NMC authorisation, endpoint, credentials, email destination, or live connection has been supplied. Demo transactions are local demonstrations and must not be treated as official NMC submissions.