# Sales Actions Log

## 2026-05-23

### Confirmed Submissions

- Zearches: submitted earlier; page showed `Website submitted`.
- FindAIDir: submitted AEO Snapshot for review; page showed `Submission received. We will review it.`
- AIToolsIndex: submitted AEO Snapshot; page showed `Successfully Submitted` and review queue within 24-48 hours.
- AI Journal: submitted AEO Snapshot; page showed `Submission Successful` and review within 2-3 business days.
- The Next AI: submitted the free listing through the site's public form endpoint; API returned
  `{"success":true}` and the temporary inbox received a submission-received email.
- Launching Next: submitted the free startup listing; the site redirected to
  `Submission Received`.
- ToolNova: submitted the free AI-tool listing with the site favicon as logo; the form endpoint
  returned `code: OK`.

### Attempted But Not Confirmed

- SubmitAItools: stopped at human verification before form.
- GrowDR: form requires screenshot upload; current in-app browser does not support file upload for that form. Product screenshot saved locally at `/tmp/aeo-snapshot-growdr.png`.
- SaaSHub: skipped because current GitHub Pages URL is a free subdomain and their guidelines reject free subdomains.
- JustHunt: product draft auto-filled and saved, but final submission requires sign-in.
- JustHunt follow-up: sign-up currently only supports Google OAuth, so a temporary inbox does not help.
- TheToolBus: browser form had UI interaction issues; direct form action POST did not return a visible success state.
- ToolVerse: form reset after submit, but no visible success or error confirmation.
- Coda One: skipped because the current page requires paid listing selection ($19+).
- Hacker News Show HN: skipped because account creation returned `Sorry, account creation disabled.`
- GrowthHackers: application form requires a real LinkedIn profile; skipped rather than inventing identity data.
- Online Geniuses: temporary email passed the first sign-up step, but profile completion requires LinkedIn URL and company email; skipped rather than inventing identity data.
- BetterLaunch: submit path redirects to Clerk sign-in; kept as a later option if account creation
  is worthwhile.
- Future Tools and Dang.ai: relevant AI directories, but their forms depend on CAPTCHA/reCAPTCHA;
  not forced through automation.
- AIToolSync: submit page advertises 100,000+ monthly visitors and free/paid plans, but the visible
  action path is pricing-led; skipped for now in favor of confirmed free forms.

### Local Accounts And Inboxes

- A temporary mail.tm inbox was created for lightweight directory/community sign-ups.
- Credentials and tokens are stored only in ignored `.local/accounts.json`.
- Do not commit temporary inbox credentials or use them for KYC/payment marketplaces.
- `scripts/feedback_monitor.py --reply` now checks the temporary inbox and reports new directory
  emails alongside Telegram outreach and bot updates.

### Current Feedback

- Outreach batch: 5 ignored.
- One reply: `Мне некому это продавать, тем более за 149$`.
- Bot updates: none since last checked.
- Temporary inbox: The Next AI receipt, ToolNova form receipt, and Launching Next queue receipt.
- Confirmed free listing submissions now: 7.

### Next Sales Move

The fastest remaining buyer-intent route is an account-based marketplace listing:

- Fiverr gig using `sales/marketplace_listing.md`.
- Upwork Project Catalog using `sales/marketplace_listing.md`.

Both likely require account/profile verification and platform-native payments.

### Conversion Asset Added

- Public sample report deployed and verified on GitHub Pages:
  https://ilyayden.github.io/aeo-snapshot/sample-audit.html
- Use it in marketplace listings and public posts to show the concrete deliverable before asking for
  $149.
