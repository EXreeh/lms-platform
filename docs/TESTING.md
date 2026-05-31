# CognitiaX AI LMS — Testing Guide

All demo accounts use password: **`Password123!`**

| Role    | Email                   |
|---------|-------------------------|
| Teacher | `teacher@cognitiax.ai`  |
| Admin   | `admin@cognitiax.ai`    |
| Student | `student@cognitiax.ai`  |

Start the stack:

```bash
npm run db:migrate   # if needed
npm run db:seed      # optional demo data
npm run dev          # frontend :3000, backend :4000
```

---

## Authentication testing

| Step | Action | Expected |
|------|--------|----------|
| 1 | Register new student at `/register` | OTP modal opens; email sent or dev log |
| 2 | Enter valid OTP | Account created; redirect to student dashboard |
| 3 | Log out from navbar | Session cleared; redirect to `/login` |
| 4 | Log in with demo student | Redirect to `/dashboard/student` |
| 5 | Log in as teacher | Redirect to `/dashboard/teacher` |
| 6 | Log in as admin | Redirect to `/dashboard/admin` |
| 7 | Forgot password flow | OTP → reset token → new password works |
| 8 | Refresh page while logged in | Session persists (cookie + local storage) |
| 9 | Visit `/dashboard/admin` as student | Redirect to student dashboard |
| 10 | Visit protected learn URL logged out | Redirect to login with `redirect` param |

---

## Student testing

### Browse & enroll

1. Open `/courses` — catalog loads with filters (search, category, level).
2. Open an **approved** course detail page.
3. **Free course** (`price = 0`): click **Enroll now** → success toast → redirect to learn page.
4. **Paid course** (`price > 0`): **Buy now** opens Razorpay (if configured) or shows clear error if keys missing.
5. Already enrolled: sidebar shows **Continue learning**.

### Learning & progress

1. `/courses/[slug]/learn` — video, sidebar, progress bar visible.
2. **Mark as complete** on a lesson — progress updates; persists after refresh.
3. Dashboard stats match learn page progress (`completed / total lessons`).
4. Admin preview: admin can open learn without enrollment.

### Quizzes

1. Course must be **APPROVED** and student **enrolled**.
2. Lesson with quiz → **Start quiz** → submit → result page with score.
3. Failed attempt can be retried per quiz rules.

### Resources

1. Course-level resources appear in learn sidebar (if teacher added any).
2. Lesson resources appear under active lesson.
3. **Open** link opens URL in new tab.

### Certificates

1. Complete 100% lessons + pass all quizzes.
2. `/courses/[slug]/certificate` — eligibility checklist → **Generate certificate**.
3. Download PDF; verify code at `/verify/[code]`.
4. `/dashboard/student/certificates` lists earned certificates.

### Payments (if Razorpay configured)

1. `/dashboard/student/payments` — history after purchase.
2. Success → `/payment/success`; failure/cancel → `/payment/failed`.

---

## Teacher testing

### Course CRUD

1. **Create course** → `/dashboard/teacher/courses/new` (title, description, price, category).
2. **Edit course** → add modules, lessons, reorder via controls.
3. **Submit for review** — requires ≥1 active lesson; status `UNDER_REVIEW`; editing locked.
4. **Resources** — add course/lesson resources from edit page or `/dashboard/teacher/resources`.
5. **Request deletion** on course/module/lesson — pending admin approval.

### Quizzes

1. `/dashboard/teacher/quizzes/new` — select course + lesson.
2. Add questions (≥2 options, correct answer matches an option).
3. Edit/delete quiz; delete may require admin approval.
4. `/dashboard/teacher/quizzes` — list loads without API errors.

### Dashboard

1. `/dashboard/teacher` — course counts, enrollment stats, recent activity.
2. Navbar: Home, Dashboard, My Courses, Create Course, Quizzes, Resources, Marketplace.

---

## Admin testing

### Overview & counts

1. `/dashboard/admin` — student, teacher, course, enrollment, active user counts load.
2. Recent registrations and teacher ownership lists populate (with seed data).

### Review queue

1. `/dashboard/admin/review` — courses under review listed.
2. **Approve** → course `APPROVED`, visible in marketplace.
3. **Reject** → course `REJECTED`; teacher can edit and resubmit.
4. **Pending delete requests** — approve/deny for course, module, lesson, quiz.

### User management

1. `/dashboard/admin/users` — list, search, filter by role.
2. Create teacher account, change role, suspend, reset password.
3. Cannot modify admin accounts via panel.

### Moderation

1. `/dashboard/admin/courses` — all courses, archive, analytics link.
2. `/dashboard/admin/resources` — moderate teacher resources; remove/restore.
3. `/dashboard/admin/certificates` — issued list + verify by code.
4. `/dashboard/admin/activity` — activity feed filters work.

### Analytics

1. `/dashboard/admin/activity` — enrollment, login, course events.
2. `/dashboard/admin/payments` — revenue stats (if payments enabled).

---

## API protection testing

| Endpoint | Role | Expected |
|----------|------|----------|
| `POST /courses` | Teacher | 201 |
| `POST /courses` | Student | 403 |
| `GET /admin/users` | Admin | 200 |
| `GET /admin/users` | Teacher | 403 |
| `POST /learning/courses/:slug/enroll` | Student | 200 (free) / 400 (paid without payment) |
| `GET /learning/courses/:slug/progress` | Unenrolled student | 403 |
| `GET /learning/preview/:slug` | Admin | 200 |
| `PATCH /admin/courses/:id/approve` | Teacher | 403 |

Test with browser devtools or `curl` + JWT cookie.

---

## Mobile & responsive testing

1. **Navbar hamburger** (viewport &lt; 1024px) — all role links visible; menu closes on navigate.
2. **Dashboard** — sidebar stacks above content; tables scroll horizontally on small screens.
3. **Learn page** — mobile lesson drawer opens/closes.
4. **Auth forms** — usable on 375px width.
5. **Toast notifications** — visible above bottom safe area.
6. **Dark mode toggle** — persists across refresh.

---

## Layout & branding checklist

- [ ] Brand displays as **CognitiaX AI** (capital X) in navbar, footer, emails, certificates.
- [ ] Dashboard content uses full width (no excessive side margins on desktop).
- [ ] Landing page remains centered but not overly narrow.
- [ ] Active nav link highlighted for current page.

---

## Common errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| Submit review fails | No lessons | Add at least one lesson |
| Quiz create fails | No lesson / short title | Pick lesson; title ≥ 3 chars |
| Add question fails | Short question / bad options | Question ≥ 5 chars; 2+ options |
| Student can't see quiz | Course not approved | Admin approve course |
| Enroll fails on paid course | Payment required | Complete Razorpay checkout first |
| Delete not in admin queue | Already pending | Refresh review page |
| `Failed to load quizzes` | Middleware/API path | Ensure `/api` routes excluded in middleware |

---

## Quick smoke test (≈15 min)

1. **Teacher**: create course → module → lesson → resource → submit review  
2. **Admin**: approve course; check user/course counts on dashboard  
3. **Teacher**: create quiz → add 2 questions  
4. **Student**: enroll (free) → complete lesson → attempt quiz → check progress  
5. **Admin**: approve a delete request from review queue  
6. **All roles**: verify navbar links and mobile menu  
7. **Student**: certificate eligibility page loads for enrolled course  

---

## Backend debug logs

Server console lines prefixed with `[LMS]`:

| Action | Log key |
|--------|---------|
| Submit for review | `course.submit_review` |
| Delete request | `delete.request` |
| Quiz create | `quiz.create` |
| Lesson complete | `progress.lesson_complete` |
| Payment order | `[Payment] order created` |
| Payment verify | `[Payment] verified` |
