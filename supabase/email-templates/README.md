# Supabase Auth Email Setup

In Supabase Dashboard, open Authentication > Email Templates and paste the matching HTML file into each template.

Use these subjects:

- Confirm signup: Confirm your Campus Guide account
- Reset password: Reset your Campus Guide password
- Change email: Confirm your new Campus Guide email
- Magic link: Your secure Campus Guide login link

Under Authentication > URL Configuration:

- Set Site URL to the production student-app URL.
- Add the production URL plus /reset-password to Redirect URLs.
- Add http://localhost:5173/reset-password for local testing.

Under Project Settings > Authentication > SMTP Settings, enable custom SMTP and enter the credentials shown in SendByte:

- Host: smtp.sendbyte.africa
- Port: 587
- Username and password: copy the SMTP credentials from SendByte; do not commit them.
- Sender email: use an address on the verified domain.
- Sender name: Campus Guide

Keep signup email confirmation enabled. Test confirmation and recovery with a new address after the one-time account purge.
