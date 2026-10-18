# CareForVets Website v1.0

Static, responsive CareForVets public website built from the CareForVets Brand & Digital Style Guide v1.0.

## Deploy with GitHub + Netlify
1. Create a new GitHub repository.
2. Upload **the contents of this folder** to the repository root.
3. In Netlify, choose **Add new project → Import an existing project → GitHub**.
4. Select the repository.
5. Build command: leave blank. Publish directory: `.`
6. Connect `careforvets.com` in Netlify Domain Management.

The contact form uses Netlify Forms and will work once deployed through Netlify.

## GitHub Pages
The pages will render on GitHub Pages, but the contact form will not be processed there. Netlify is recommended for this version.

## Important content status
The site intentionally describes CareForVets home health as a **developing/future model** and does not claim current licensure, Medicare certification, VA affiliation, or VA network status. Update this language only when the corresponding approvals are actually in place.

## PHI
Do not use the website or contact form to collect protected health information.

## Brand tokens
- Navy `#3C3B6E`
- Red `#CD2838`
- White `#FFFFFF`
- Off White `#F7F5F3`
- Slate `#5D6272`
- Ink `#24233B`
- Display font: Georgia
- Interface/body: Aptos / Segoe UI fallback


## v1.1 update
- Header logo sizing adjusted so the full CareForVets logo remains visible on desktop and mobile.
- Contact form now posts to an absolute `/success.html` confirmation route.
- Removed the catch-all redirect that could intercept valid static pages; Netlify will use `404.html` automatically for missing routes.
- Refined the post-submission confirmation page.


## v1.2 update
- Reduced homepage hero top padding on desktop, tablet, and mobile so the headline begins closer to the navigation while preserving breathing room and the existing visual hierarchy.


## v1.3 update
- Added version query strings to CSS and JavaScript references so releases force a fresh browser request.
- Changed CSS and JavaScript cache headers to revalidate immediately instead of remaining immutable for one year.
- Images now use a one-day cache with revalidation.
