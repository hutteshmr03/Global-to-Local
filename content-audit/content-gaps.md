# Global to Local — Content Gaps & Conflicts Audit

Audited against the five project specifications and the live production website (https://gtl-khaki.vercel.app/).

## 1. Product Catalogue
- **Product Count:** Exactly 230 products extracted across all 13 shelves.
- **Shelf Counts:**
  - Chutneys & Spreads: 4
  - Farsaan: 16
  - Grains: 8
  - Hand-Crafted: 42
  - Kunbi: 8
  - Masala: 31
  - Oils & Vinegars: 14
  - Papads & Pickles: 27
  - Seafood: 5
  - Spices: 12
  - Sustainable Products: 15
  - Sweet: 28
  - Wellness: 20
  - **Total:** 230 products (100% complete match with live site).
- **Product Images:** All 230 primary product images and gallery images downloaded and verified on disk.

## 2. Media & Static Assets
- **Audio:** The live site references `/audio/fontainhas-street.wav` (not `.mp3`), which has been downloaded and verified (1.39 MB).
- **Videos & Posters:** All 9 video clips (`street`, `rice`, `kunbi`, `kokum`, `mitti`, `maker`, `hamper`, `patio`, `dusk`) and their companion poster images are captured and verified.

## 3. Policy & Static Pages
- All static pages audited from live HTML:
  - `/our-story` (Complete text extracted)
  - `/our-social-corner` (Complete text extracted)
  - `/in-the-news` (Complete text extracted)
  - `/contact` (Complete text, store location, Google Maps link, and all 19 FAQs extracted)
  - `/shipping-policy` (Complete text extracted)
  - `/return-and-exchange-policy` (Complete text extracted)
  - `/terms-and-conditions` (Complete text extracted)
  - `/privacy-policy` (Complete text extracted)

## 4. Discrepancies & Resolutions (Precedence Rules Applied)
1. **Audio format:** Live site uses `.wav` for `/audio/fontainhas-street.wav`; preserved as WAV with modern audio tag fallback.
2. **Hamper ordering stopgap on live site:** The live site states "this site cannot take a hamper order yet". In accordance with URS-23 and Backend Specification, the rebuilt site provides the working gift-hamper enquiry workflow that validates Goa pincodes (starting with 403) and saves enquiries to the database while keeping hamper checkout out of the first release.
3. **Contact form email stopgap:** Live site previously used a `mailto:` fallback; upgraded to an API-backed `/enquiries` endpoint with database storage, staff notification email, CAPTCHA, and rate limiting.
4. **"Loading the shelves..." text:** Replaced by accessible skeleton shimmer loaders that preserve layout geometry without changing the UI at rest.

## 5. Third-Party Credentials Required from Store Owner
- **Razorpay:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (test mode keys provided for local/dev).
- **Email Service (Resend / AWS SES):** `RESEND_API_KEY` or SMTP credentials for transactional emails.
- **SMS / OTP Provider:** For SMS one-time passcode delivery (mocked in dev environment).
- **Courier API (Shiprocket / Delhivery):** For live AWB creation and tracking webhooks.
