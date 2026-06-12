# Baby Borrow — Business-For-Sale Website

A single-file website (`index.html`) presenting Baby Borrow to potential buyers:
the business, its partnerships with major Florida hotels, acquisition highlights,
financial summary, what's included in the sale, and an inquiry form.

## Before you publish — edit these

Open `index.html` in any text editor and search for the ✏️ comments:

1. **Stats bar** — years in business, number of hotel partners, rentals
   delivered, rating. Replace the sample numbers with your real ones.
2. **Financial Highlights table** — fill in revenue, owner's earnings,
   asking price, etc. (or leave "[Add figure]" / "Inquire" if you prefer to
   share only under NDA).
3. **Email address** — replace `owner@babyborrow.com` (appears twice: the
   inquiry form and the footer) with the email where you want inquiries.
4. **Testimonials** — swap the sample quotes for real reviews and concierge
   feedback.
5. **Hotel partners** — the site currently says partner names are disclosed
   under NDA (the safe default). If your hotel partners allow it, you can
   list their names/logos instead.

## How to view it

Just double-click `index.html` — it opens in any browser. No installation,
no build step.

## How to put it online (free options)

- **Netlify Drop**: go to https://app.netlify.com/drop and drag the
  `baby-borrow-site` folder onto the page. Done — you get a live link.
- **GitHub Pages**: in this repo's Settings → Pages, set the source to this
  branch and the `/baby-borrow-site` folder.
- **Vercel**: import the repo at https://vercel.com/new and set the root
  directory to `baby-borrow-site`.

## Tip for a stronger inquiry form

The form currently uses a `mailto:` link, which opens the buyer's email app.
For a form that emails you directly without that step, create a free account
at https://formspree.io, then replace the form's `action="mailto:..."` with
the Formspree URL they give you.
