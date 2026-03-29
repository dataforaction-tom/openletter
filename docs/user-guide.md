# User Guide

This guide covers everything you need to know about using OpenLetter — from creating your first letter to managing signatures.

## Signing in

OpenLetter uses passwordless authentication. Enter your email address on the sign-in page and you'll receive a magic link. Click the link to sign in — it's valid for one hour.

If you don't have an account, one is created automatically when you first sign in.

In development mode (no email service configured), the magic link is printed to the terminal instead of being emailed.

## Creating a letter

1. From your dashboard, click **New letter**
2. Enter a title and write your content using the markdown editor
3. Click **Create draft** — this saves your letter and takes you to the full editor

Your letter starts as a draft and won't be visible to anyone else until you publish it.

## The editor

The editor has two main areas:

- **Left pane** — write your letter content in Markdown
- **Right pane** — see a live preview of how your letter will look

### Editor toolbar

Above the editor you'll find two buttons:

- **Preview** — toggle the preview panel on and off. When hidden, the editor takes the full width, giving you more room to write.
- **Syntax help** — opens a quick reference for Markdown formatting (bold, italic, headings, links, lists, and more).

### Autosave

Your work is saved automatically as you type. You'll see a brief "Saved" confirmation appear. You can also click **Save** manually at any time.

### Authors

Below the editor, you can add authors to your letter. Each author has a name and an optional organisation. Authors are displayed on the public letter page.

To add an author, type their name (and optionally their organisation), then click **Add author**. To remove one, click **Remove** next to their name.

## Publishing

When your letter is ready, click **Publish**. This makes your letter publicly accessible at its unique URL (shown on the settings page as the "slug").

You can **Unpublish** at any time to take the letter offline, and **Publish** again when ready.

Once published, a **View published letter** link appears on the editor page so you can see exactly what your readers see.

## Letter settings

Click the **Settings** tab on any letter to configure:

### Description

A brief summary of your letter. This is used in page metadata for search engines and social sharing.

### Signature form fields

Control which fields appear when someone signs your letter:

| Field | Options |
|-------|---------|
| Organisation | Required, Optional, or Hidden |
| Role | Required, Optional, or Hidden |
| Location | Required, Optional, or Hidden |
| Comment | Optional or Hidden |

Name and email are always required.

### Options

- **Require email verification** — when enabled, signatories must click a verification link sent to their email before their signature counts. When disabled, signatures are recorded immediately.
- **Show signature count** — display the total number of signatures on the public letter page.
- **Show view count** — display how many times the letter has been viewed.
- **Show signatories** — display the list of people who have signed.

### Closing date

Set an optional date after which the letter will no longer accept new signatures.

## Managing signatures

Click the **Signatures** tab to see everyone who has signed your letter.

### Overview

At the top you'll see three counts: total signatures, verified, and pending.

### Filtering

Use the filter tabs to view:
- **All** signatures
- **Verified** only — people who confirmed their email
- **Pending** — people who haven't yet verified

### Exporting

Click **Export CSV** to download all signatures as a spreadsheet. The export includes name, email, organisation, role, location, comment, verification status, and date.

### Removing signatures

Click the **×** button next to any signature to remove it. You'll be asked to confirm before it's deleted.

## The public letter page

When someone visits your published letter, they see:

- The letter title, authors, and publication date
- The full letter content, formatted with editorial typography
- A call to action to sign the letter (if still open)
- A list of verified signatories (if enabled in settings)

### Signing a letter

Visitors click **Add your name** to open the signing form. After submitting:

- **If email verification is on** — they'll see a "check your email" page and need to click the verification link.
- **If email verification is off** — they'll see a thank-you page with sharing options and a link back to the letter. The page automatically redirects after 15 seconds.

## Deleting a letter

On the editor page, click **Delete**. You'll be asked to confirm. This permanently removes the letter and all its signatures.
