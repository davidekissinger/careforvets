<!-- Source: CareForVets SEO Design Document v1.0, November 5, 2026. Converted from the delivered Word document; implementation status is in implementation.md. -->

# CareForVets SEO Design Document

Public website architecture and implementation specification

careforvets.com  |  Version 1.0  |  November 5 2026

Prepared for David E. Kissinger, BSHA, RN

### Purpose

Build a public website that helps military veterans and their families find useful care information, understand available support, and take an appropriate next step. Give healthcare careers and organizational participation their own clear paths. This specification translates the audience research into page requirements, content priorities, technical SEO rules, and release checks for the designer, developer, and content owner.

### Recommended direction

Lead the care offering with older veterans and family caregivers. Add focused disability and rehabilitation resources and a clearly organized mental health support pathway. Preserve a distinct careers section. Publish descriptions of direct services only when the operating model, geography, staffing, and access process support those descriptions.

Search themes and audience priorities are planning hypotheses. The audience previews identify relevant organizations and topics; they do not establish keyword demand, local market size, or a revenue forecast. This is a design specification, not a completed live-site SEO audit. Success means useful discovery and completed appropriate next steps, measured after a baseline is established.

### How to use this document

| Sections | Use |
| --- | --- |
| 1 to 3 | Strategy, audience evidence, navigation, and page ownership |
| 4 to 6 | Metadata, page layouts, editorial requirements, and initial content |
| 7 to 9 | Technical SEO, local discovery, and measurement |
| 10 and 11 | Delivery sequence and acceptance checklist |
| Appendices | Complete audience website matrix and source register |

## 1 Strategic direction

### Audience and service priorities

| Audience | Main task | Design response |
| --- | --- | --- |
| Older veterans and family caregivers | Find help at home and understand how to arrange support. | Lead with care navigation and a dedicated caregiver route. |
| Veterans living with disabilities | Find rehabilitation, accessibility, mobility, and support resources. | Provide a focused resource pathway that works across service eras. |
| Veterans seeking mental health support | Find a suitable entry point to routine care, peer support, or urgent help. | Present clearly differentiated external resources and access instructions. |
| Veterans exploring healthcare work | Understand job types and find genuine opportunities. | Use a separate careers section and only publish verified vacancies. |
| Employers and service organizations | Understand participation, responsibilities, and review criteria. | Explain the partner model before enabling operational intake. |

Family caregivers are a separate research audience across the care pathways. A veteran receiving care and a family member researching it can have different questions, terminology, and next steps. Public navigation should reflect those tasks rather than reproduce the wizard labels as the site taxonomy.

### Positioning and promise

Use the organization name CareForVets consistently and spell out military veterans in prominent copy to avoid ambiguity with veterinary services. Describe the current role in concrete terms: information, navigation, connections, and any services that are actually available. Planned home health belongs in clearly dated future-service information until operational readiness supports a service claim.

The main page should answer who the site helps, what help is available today, where it is available, how a visitor takes the next step, and who is responsible for the information. Veterans, caregivers, job seekers, and organizations should not all be sent into an identical generic form.

### Required business decisions before publication

- Confirm the present operating model and the exact distinction between CareForVets assistance and services provided by outside organizations.

- Confirm the service geography. Toledo and surrounding communities are a local planning option, not an established service area merely because the owner lives there.

- Confirm business contact methods, response capacity, any fees, and the availability of career and partner workflows.

- Identify the people responsible for clinical content review, benefits-source review, and ongoing resource verification. Credentials and review claims must reflect actual work.

## 2 Audience evidence and search hypotheses

Three SparkToro previews supplied the audience evidence: older Vietnam-era veterans needing care support, combat-wounded and disabled veterans, and veterans seeking confidential mental health support. The demographic values below are reported preview estimates. [A1-A3]

| Preview | Female | Male | Other | Reported age pattern |
| --- | --- | --- | --- | --- |
| Older veterans | 14.5% | 85.3% | 0.2% | 100% displayed as 66+ |
| Disability support | 23.9% | 75.8% | 0.3% | 88.5% ages 18 to 50; 3.9% ages 66+ |
| Mental health support | 25.8% | 73.9% | 0.3% | 90.3% ages 18 to 50; 3% ages 66+ |

The previews contain 30 displayed website rows and 25 distinct websites. DAV appears in the older-veteran and disability previews. Make the Connection, Wounded Warrior Project, Hope For The Warriors, and Veterans Inc. appear in both the disability and mental health previews. The displayed lists are samples; absent entries are not evidence of zero affinity.

Affinity is a relative score, not a percentage of veterans, a clinical quality score, or a conversion probability. Site visit estimates do not establish local prospects. The 100% older age result follows the chosen audience definition; the younger results do not establish the demographics of all disabled veterans or all veterans seeking mental health support. [S1-S2]

### Proposed search themes

| Theme | Examples to validate | Primary destination |
| --- | --- | --- |
| Care navigation | help finding care for veterans; veteran care navigation | /care-navigation/ |
| Family caregiving | caregiver resources for veterans; help caring for a veteran parent | /caregivers/ |
| Care at home | home care options for veterans; how to find veteran home support | /resources/care-at-home/ |
| Disability support | veteran rehabilitation resources; mobility support for veterans | /resources/disability-and-rehabilitation/ |
| Mental health resources | mental health support for veterans; veteran counseling resources | /resources/mental-health-support/ |
| Benefits information | where to get help with veteran care benefits | /resources/veterans-benefits/ |
| Healthcare careers | healthcare careers for veterans; military experience healthcare jobs | /careers/healthcare-careers/ |

These phrases are seed topics for research and content briefs. Validate intent in current search results and, after access is available, with Search Console and a keyword tool. Record the date, geography, wording, and source of any volume estimate. The previews contain no readable search or social rankings, search volumes, or difficulty measures.

## 3 Information architecture

Primary navigation: Find Care, For Caregivers, Careers, Resources, and Partners. Use About, Contact, editorial standards, privacy, accessibility, and terms in persistent secondary navigation or the footer. Make urgent support easy to find on relevant pages. Keep private account and document-review workflows outside the public content structure.

All routes below are proposed. Inventory existing canonical URLs and search performance before implementing them. Reuse suitable URLs and preserve established search value through individually mapped redirects when a change is necessary.

| Proposed path | Purpose and search ownership | Primary action |
| --- | --- | --- |
| / | Brand and orientation<br>Explain current role and route veterans, caregivers, job seekers, and organizations. | Explore care navigation<br>Core |
| /care-navigation/ | Care navigation offering<br>Explain available assistance, the process, boundaries, geography, and next steps. | Review contact options<br>Core |
| /caregivers/ | Family care coordination<br>Help people arranging care choose the right task and resource. | Choose a caregiving need<br>Core |
| /resources/ | Browse support information<br>Provide a useful curated resource library with clear categories. | Browse by need<br>Core |
| /resources/care-at-home/ | Care at home information<br>Explain types of home support and how to investigate access. | Explore access routes<br>Resource |
| /resources/disability-and-rehabilitation/ | Disability and rehabilitation<br>Organize mobility, rehabilitation, accessibility, and related caregiver resources. | Open a relevant resource<br>Resource |
| /resources/mental-health-support/ | Mental health navigation<br>Differentiate routine care, peer support, education, and urgent help. | Open appropriate support<br>Resource |
| /resources/veterans-benefits/ | Benefits information navigation<br>Lead to official information and qualified assistance. | Find official information<br>Resource |
| /careers/ | CareForVets employment offering<br>Describe the actual employment service and opportunity status. | Explore healthcare careers<br>Core |
| /careers/healthcare-careers/ | Healthcare career exploration<br>Explain clinical and nonclinical role families and next steps. | Explore a role family<br>Resource |
| /partners/ | Organizational participation<br>Explain intended partner types, responsibilities, and review criteria. | Review participation criteria<br>Conditional intake |
| /about/ | Organization and credibility<br>State ownership, purpose, verified background, and current operating model. | Understand the organization<br>Core |
| /contact/ | Correct contact route<br>Provide verified contact methods and realistic response expectations. | Choose contact route<br>Operational |
| /locations/toledo-oh/ | Verified local navigation<br>Describe genuine local availability and useful local access information. | View confirmed local options<br>Conditional local |

### Publication conditions

Core pages can be specified now. Publish them only with substantive content and working actions. Resource pages require current descriptions and sources. Partner intake, candidate submission, individual jobs, and local service pages require the underlying process or service to be ready. An informational partner page does not authorize external onboarding or changes to a private portal.

### Additional routes

Supporting pages include /editorial-standards/, /privacy/, /accessibility/, and /terms/. Use /careers/jobs/{job-slug}/ only for genuine individual openings. Use /resources/{article-slug}/ only when an article answers a distinct question beyond its parent hub. Utility states such as /thank-you/ and internal search results should not compete in search.

### Content ownership and internal links

The home page owns the brand; Care Navigation owns the organization offering; Care at Home owns education about support options; Caregivers owns the family coordination task. Careers explains the platform offering while Healthcare Careers explains role exploration. Each meaningful intent receives one primary destination. Consolidate overlapping drafts instead of creating pages for minor keyword variations.

Link the home page to each primary destination. Care Navigation and Caregivers should link to relevant resource pathways. Resource pages should return visitors to their parent category and, where useful, a related topic. Careers should link to guidance and genuine vacancies. Use descriptive anchor text and breadcrumbs on deeper pages; avoid sitewide lists of city keywords.

## 4 Page titles and search descriptions

Use these starting points after confirming page content and service availability. Give each page a distinct title and a visible H1 describing its purpose. Google may generate different title links and snippets from page content, so these fields guide presentation without guaranteeing it. [G2, G3]

/

Title: Veteran Care Navigation and Resources | CareForVets

H1: Find Care and Support for Military Veterans

Description: Explore care options, family caregiver resources, and healthcare career information for military veterans through CareForVets.

/care-navigation/

Title: Veteran Care Navigation | CareForVets

H1: Help Finding Care and Support for Veterans

Description: Understand veteran care options and how to find relevant services, community resources, and support for your next step.

/caregivers/

Title: Caregiver Resources for Veteran Families | CareForVets

H1: Support for People Caring for a Veteran

Description: Find practical resources for arranging care, exploring home support, and helping a veteran family member navigate available services.

/resources/

Title: Veteran Care and Support Resources | CareForVets

H1: Resources for Veterans and Their Families

Description: Browse veteran resources for care at home, caregiving, disability support, mental health, and benefits information.

/resources/care-at-home/

Title: Care at Home Options for Veterans | CareForVets

H1: Understanding Care at Home for Veterans

Description: Learn about types of care at home, questions to ask, and official resources for understanding access to veteran support services.

/resources/disability-and-rehabilitation/

Title: Veteran Disability and Rehabilitation Resources | CareForVets

H1: Disability and Rehabilitation Resources for Veterans

Description: Explore rehabilitation, mobility, accessibility, and caregiver resources for veterans living with disabilities.

/resources/mental-health-support/

Title: Mental Health Support for Veterans | CareForVets

H1: Finding Mental Health Support for Veterans

Description: Find verified starting points for veteran mental health information, counseling resources, peer support, and urgent help.

/resources/veterans-benefits/

Title: Veterans Benefits Information and Help | CareForVets

H1: Finding Reliable Veterans Benefits Information

Description: Find official veterans benefits information and starting points for qualified assistance with questions about care and support.

/careers/

Title: Veteran Healthcare Career Connections | CareForVets

H1: Explore Healthcare Careers Through CareForVets

Description: Explore the CareForVets career pathway and information about clinical, administrative, and support roles for military veterans.

/careers/healthcare-careers/

Title: Healthcare Careers for Veterans | CareForVets

H1: Healthcare Career Paths for Military Veterans

Description: Explore clinical and nonclinical healthcare roles, credential considerations, and practical next steps for veterans considering healthcare work.

/partners/

Title: Partner Information | CareForVets

H1: Working With CareForVets

Description: Learn about proposed participation for care providers, employers, and community organizations supporting veterans and their families.

/about/

Title: About CareForVets | Veteran Care Navigation

H1: About CareForVets

Description: Learn about the purpose, people, and approach behind CareForVets and its focus on military veterans and their families.

/contact/

Title: Contact CareForVets | Care Careers and Partners

H1: Contact CareForVets

Description: Find the appropriate CareForVets contact route for care-navigation questions, career information, or organizational inquiries.

/locations/toledo-oh/

Title: Veteran Care Resources in Toledo Ohio | CareForVets

H1: Veteran Care Resources in Toledo Ohio

Description: Explore verified veteran care resources in Toledo, Ohio, with local access information and practical next steps for veterans and caregivers.

Use concise titles and descriptions that communicate the actual page. Character counts are editorial checks, not hard Google limits or ranking factors. Avoid repeating locations, credentials, or services that the page cannot substantiate. The local-page example is conditional on the geographic publication criteria in Section 8.

## 5 Page layouts and user experience

### Home page layout

The first screen should identify CareForVets as a resource for military veterans, state its current role in one short paragraph, and offer a clear care-navigation action. A secondary action should serve someone helping a veteran. Keep careers and organizations visible in navigation without forcing all audiences through the same introduction.

| Order | Module | Required content |
| --- | --- | --- |
| 1 | Identity and orientation | Brand name, plain purpose statement, current operating role, and primary navigation. |
| 2 | Care and caregiver entry points | Short task descriptions and direct links to Find Care and For Caregivers. |
| 3 | How navigation works | A realistic sequence based on the actual assistance available. Describe the outcome of each action. |
| 4 | Resource pathways | Care at home, disability and rehabilitation, mental health support, and benefits information. |
| 5 | Careers and organizations | Distinct links to career guidance and partner information with accurate availability. |
| 6 | Trust and access | Verified identity, editorial standards, business contact, privacy, accessibility, and relevant support links. |

### Care Navigation and Caregivers layouts

Start each page with the user task and the assistance available. Explain who the page helps, how to use it, and where help is available. Present a short sequence of next steps, the relevant resource categories, and answers to practical questions. Show response expectations beside any contact action. Use a request form only when an actual person or service can receive and respond to it.

The caregiver page should organize choices around arranging care, understanding home support, preparing for transitions, finding transportation information, and locating caregiver support. Avoid requiring a visitor to identify a diagnosis before seeing useful information.

### Resource page layout

Use a brief answer-first introduction, a jump list for longer pages, a plain explanation of the available types of help, and curated resource records. Each record must state the organization, what it offers, who it serves, geographic or access limitations, how to access it, the official source, and the date checked. Record costs only when verified and material. Separate resource verification from any claim of partnership or endorsement.

Mental health pages should visibly distinguish routine clinical care, peer support, educational material, and urgent help. Keep immediate support links accessible without a form or account. A routine contact form must accurately describe its monitored hours and purpose. The Veterans Crisis Line is a verified external crisis-support resource; routine navigation is a different interaction. [R8]

### Careers and partner layouts

Careers should explain the current offering before collecting candidate information. Group guidance by clinical, therapy, social-work, scheduling, administrative, operations, and leadership roles. Describe civilian credentials accurately. A career interest form is not a job application unless a specific opportunity and process exist.

Partner information should state eligible organization types, participation criteria, review responsibilities, and the current participation process. Describe an organization as a verified partner only after the defined review is complete. Display logos, testimonials, or endorsements only with appropriate evidence and permission.

### Accessibility and visual requirements

Design for older adults, caregivers using mobile devices, and people with varied motor, sensory, and cognitive needs. Use plain language, readable type, generous spacing, descriptive links, and clear keyboard focus. Use semantic headings, visible form labels, and helpful error messages. Explain abbreviations on first use.

Set a project design target of 18 px body text and approximately 44 by 44 CSS px primary controls. These are design choices, not a claim that every WCAG AA control must be 44 px. Meet WCAG 2.2 AA requirements, including minimum text contrast of 4.5:1 for normal text and 3:1 for large text, usable resizing, and applicable target-size and spacing rules. Test narrow screens and keyboard navigation. [W1]

Use authentic, authorized imagery that reflects veterans and caregivers across ages, genders, and abilities. Write meaningful alternative text for informative images and empty alternative text for decoration. Keep information in text rather than embedding essential instructions in images. Avoid autoplay and unnecessary motion.

## 6 Content and editorial design

### Initial publishing sequence

| Priority | Content | Reader outcome |
| --- | --- | --- |
| 1 | Core navigation pages and organization information | Understand CareForVets, available assistance, and the correct next step. |
| 2 | Caregiver guide to arranging support | Identify care tasks, prepare questions, and find credible starting points. |
| 3 | Care at home explainer | Distinguish types of support and investigate the appropriate access route. |
| 4 | Disability and rehabilitation resource pathway | Find useful rehabilitation, mobility, and accessibility information. |
| 5 | Mental health resource pathway | Choose an appropriate type of support and understand how to access it. |
| 6 | Benefits information pathway | Locate official information and qualified assistance without promises of eligibility. |
| 7 | Healthcare career paths for veterans | Compare role families and identify real credential and application requirements. |

Complete the core pages before creating a high-volume blog schedule. Each article should solve a specific task, add original practical value, and link to the relevant parent page. Examples include questions to ask a home-care provider, organizing a care-transition conversation, and preparing to explore healthcare careers. Validate the actual questions before commissioning additional pages. [G1]

### Content brief fields

Every brief should identify the intended reader, the task to complete, the primary page that owns the topic, proposed search phrases, verified facts and sources, a clear outline, related internal links, the intended next step, the writer, the reviewer, and an update date. Establish depth by the question being answered; do not impose a universal word-count target.

### Trust and review

Publish a truthful About page and an editorial-standards page. Show the responsible author and an actual reviewer where appropriate, with a profile that supports the stated expertise. Use David E. Kissinger, BSHA, RN only in a role he actually performs. Clinical credentials do not establish authority to decide VA benefits or provide every specialty service.

Cite primary sources for clinical, benefits, eligibility, and program-access facts. Link close to the claim and display a genuine review date. Separate fact from interpretation. Google emphasizes clear authorship, evidence, useful original content, and trust for subjects affecting health and safety. [G1]

Use an internal review cadence of at least quarterly for routine resource records, with more frequent checks for urgent contact details, eligibility changes, and frequently changing services. Assign a specific owner and next-check date. A broken-link check is useful but does not verify program eligibility or capacity.

### Claims requiring evidence

- Availability: direct home health, clinical treatment, local coverage, response times, or same-day help must match actual capacity.

- Identity: government or VA affiliation, accreditation, approved provider status, and named partnerships require documented support.

- Results: avoid guaranteed rankings, guaranteed benefits, guaranteed placement, or universal care eligibility.

- Resource quality: SparkToro affinity and Domain Authority stay in internal research; they are not quality ratings for people seeking care.

## 7 Technical SEO requirements

Apply the requirements to the verified production framework and hosting setup. Public content should remain accessible without login and should not depend on the private portal or an authenticated database query for essential text. Prefer statically generated or server-rendered public pages where the framework supports them. Confirm what Google can render before choosing a migration.

### Discovery and indexation

| Area | Implementation requirement | Acceptance evidence |
| --- | --- | --- |
| Public content | Return a successful response with useful text, headings, links, and page metadata. Use crawlable anchor links and real URLs. | Fetch a representative page and inspect its rendered content with Search Console URL Inspection. |
| Canonical URLs | Choose one HTTPS hostname and a consistent path convention. Use self-referencing canonical tags on intended public canonical pages. | Internal links, redirects, canonical tags, and sitemap URLs agree. |
| Redirects | Map replaced URLs to the closest equivalent destination using permanent redirects. | No chains, loops, or blanket redirection of unrelated pages to the home page. |
| Sitemap | List only canonical, indexable, successful public URLs. Maintain lastmod only for substantive updates. | Valid XML; no login, portal, parameter, noindex, or error URLs. |
| Robots and noindex | Keep intended public content crawlable. Apply noindex to utility and preview content when crawl access is needed for the directive to be read. | No production-wide noindex; robots.txt does not prevent a crawler from seeing a required noindex directive. |
| Private areas | Protect accounts, documents, and operational records with actual authorization. | Unauthorized access fails. Robots directives are not used as access control. |
| Parameters and search | Prevent duplicate filter combinations and internal search results from becoming competing indexable pages. | Only selected substantive category destinations are indexable; filters have a documented URL policy. |
| Errors | Return genuine 404 or 410 status for removed content with no useful replacement. | Unknown paths do not return a generic 200 page or misleading home-page content. |

These requirements follow Google guidance on crawlable content, canonicalization, sitemaps, redirects, and index control. Canonical tags are signals rather than guaranteed selection; validate the chosen canonical in Search Console. [G4-G8]

### Metadata and structured data

Provide unique title and description fields, a descriptive H1, an absolute canonical URL, social-sharing title and image metadata, and stable language information. Generate these consistently across templates. Match structured data to the visible page and the actual organization. Validate supported markup, while recognizing that correct markup does not guarantee a rich result. [G2-G3, G9]

| Type | Use | Limits |
| --- | --- | --- |
| Organization | Organization identity on the home or About page. | Use verified name, URL, logo, and genuine profile links. Do not invent awards, ratings, addresses, or affiliations. |
| BreadcrumbList | Deeper resources, local pages, and job pages. | Match the visible hierarchy and canonical URLs. |
| Article or BlogPosting | Substantive authored educational articles. | Use genuine author, publisher, and meaningful published or modified dates. |
| JobPosting | Individual real and current job-detail pages. | Include required accurate fields and an expiry process. Do not mark up career hubs, hypothetical jobs, or candidate-interest pages. |
| FAQPage | Not required for the initial SEO implementation. | Google stopped showing FAQ rich results on May 7 2026. Keep useful visible questions and answers without promising a special search display. |
| LocalBusiness | Only when the actual business type and verified local operation justify it. | Do not describe a navigation site as a clinic or medical organization merely for search visibility. |

The detailed schema implementation should follow Google supported-type guidance. JobPosting requires a real individual job, and expired opportunities require prompt handling. Google discontinued FAQ rich results in May 2026 and removed the documentation in June; FAQ markup is not a launch requirement. [G9-G13]

### Performance and mobile behavior

Use Core Web Vitals as performance targets: Largest Contentful Paint at or below 2.5 seconds, Interaction to Next Paint at or below 200 milliseconds, and Cumulative Layout Shift at or below 0.1, assessed at the 75th percentile of field visits. Evaluate mobile and desktop separately. When traffic is insufficient for field data, use lab diagnostics and label them as provisional. [G14]

Compress and appropriately size images, reserve image dimensions, load below-the-fold media lazily, and keep the main image readily available. Limit unnecessary scripts, use efficient fonts, and avoid layouts that shift when banners or resources load. Treat an automated score as a diagnostic rather than proof of accessibility or ranking potential.

### CMS and reusable fields

The page model should support slug, page purpose, title, description, H1, canonical URL, index policy, content owner, reviewer, source links, last verified date, next review date, and a structured-data type. Resource records also need organization, official URL, help offered, intended users, geographic access, costs when verified, access instructions, and review status. Store partner status separately from resource verification.

## 8 Local discovery and external relationships

### Local search design

Publish a Toledo or regional page only after confirming the actual scope of assistance and assembling useful local access information. A local page should contain genuine local resources, how people can access them, service boundaries, and verified contact details. It should answer a locally distinct question rather than repeat the national page with city names changed.

Do not automatically create near-identical Toledo, Perrysburg, Lucas County, Wood County, Ohio, and Michigan pages. Consolidate neighboring areas when they share the same service and information. Add a separate page only when distinct services or local detail justify it. Google identifies doorway abuse and scaled low-value pages as spam risks. [G15]

Use a Google Business Profile only if the real business meets Google eligibility rules. Online-only brands and lead-generation operations should not be assumed eligible. Do not use a virtual office or a personal residence as an SEO shortcut. If a qualifying operation exists, keep the name, address or appropriate service area, contact details, and opening hours accurate. [G16]

### Resource and relationship priorities

| Candidate | Recommended role | Verification condition |
| --- | --- | --- |
| DAV and PVA | Investigate veteran service connections. PVA also has a career program with an explicit partner invitation. | Confirm actual fit, relevant local reach, and the specific participation process. |
| Hidden Heroes and Caregiver Action Network | Caregiver resources and community research. | Confirm the resource and permitted method of participation; do not imply an existing affiliation. |
| BIAA and MSKTC | Brain-injury and rehabilitation education. | Link to current original material and describe its use accurately. |
| Cohen Veterans Network, Give an Hour, Home Base | Mental health program research and appropriate referral resources. | Verify program eligibility, geographic access, and current intake information. |
| RallyPoint | Unverified outreach candidate. | Keep out of an active channel plan until current public availability is established. |
| Benefits firms in the previews | Signals about information needs. | Do not treat appearance in the preview as endorsement, accreditation, or partnership. |

PVA offers employment support and invites potential partners; Hidden Heroes and Caregiver Action Network offer caregiver resources; BIAA and MSKTC provide specialized information. These facts support research priorities, not existing CareForVets relationships. [R1-R5]

Cohen local coverage for Ohio and Michigan remains unconfirmed in the reviewed state listings. Veterans Inc. describes a regional footprint centered on New England with additional programs in Montana and North Dakota. Confirm usable access before listing a resource as local. [R6-R7]

### Earning relevant mentions

Develop useful original resources that organizations could reasonably reference, such as a maintained local access guide or a practical caregiver preparation checklist. Research relevant public resource directories, community publications, and educational opportunities. Record the purpose and relationship accurately. Avoid paid-link schemes, reciprocal-link requirements, and mass outreach built around search rankings. Any sponsorship should be disclosed and links handled appropriately. [G15]

## 9 Measurement design

Establish a baseline before assigning growth targets. Use Search Console to monitor discoverability and aggregate search performance, and use carefully configured measurement for appropriate public-site actions. Report search visibility, useful engagement, successful requests, and operational fit separately. A resource click is not a completed referral or evidence of clinical eligibility.

| Measure | Definition | Reporting use |
| --- | --- | --- |
| Index coverage | Intended canonical pages indexed, with reasons for exclusions. | Identify release errors and pages needing technical or content review. |
| Organic discovery | Search Console impressions, clicks, CTR, and page or query patterns. | Evaluate whether the intended subjects and pages are gaining relevant discovery. |
| Successful inquiry | Count confirmed successful public-form submissions. | Measure completed contact attempts without exposing submission content. |
| Career action | Aggregate actions on genuine public career opportunities. | Distinguish career engagement from care inquiries. |
| Partner interest | Count confirmed submissions only when the workflow is operational. | Evaluate interest without implying reviewed or approved partners. |
| Useful operational outcome | Internally reviewed aggregate counts of requests that fit current scope and geography. | Assess whether discovery is producing appropriate demand. |
| Resource freshness | Share of published resources reviewed by the internal due date. | Track the reliability of the information service. |

### Event and privacy rules

Proposed event names are inquiry_complete, career_action, and partner_interest_complete. Fire completion events only after confirmed success, not on a button click. Keep event parameters to an allowlist of non-sensitive technical values. Do not send names, email addresses, phone numbers, free-text messages, diagnoses, benefit status, selected health topics, private identifiers, or individual referral destinations to analytics.

Review automatic page-view collection, page titles, full URLs, query strings, referrers, enhanced measurement, and form capture. A generic event name does not prevent sensitive page context from being collected. Exclude private portal and intake pages from third-party behavioral tracking, and disable session replay. For sensitive support pages, prefer aggregate operational counts without visitor-level tracking and leave crisis-link use untracked by marketing systems. These are project design requirements. [G17]

Use query-parameter redaction as a backup rather than the sole control. Verify with a test submission and network inspection that neither user-entered content nor sensitive route context is transmitted. Google prohibits sending identifiable information to Analytics and warns about URLs, titles, search fields, and event dimensions. [G17]

### Reporting cadence and decisions

Review indexation and error signals weekly after release. Review content performance and appropriate inquiry outcomes monthly. Segment results by page purpose and brand versus nonbrand discovery where the available data supports it. Compare equivalent periods and annotate releases. Do not infer an individual health condition from browsing behavior.

After an initial 28-day measurement period, set realistic targets from the actual baseline and capacity. Investigate high impressions with low clicks, useful pages with weak internal discovery, and inquiries outside the available service area. Expansion decisions should follow verified user questions and useful outcomes rather than a fixed quota of new pages.

## 10 Implementation sequence

The sequence below is a proposed delivery plan measured from the start of implementation. It is not a commitment to publish services, activate partner onboarding, or release a private portal. Assign named owners when the project team accepts the work.

| Period | Work | Completion evidence | Suggested owner |
| --- | --- | --- | --- |
| Days 1 to 15 | Confirm operating scope, geography, public URL inventory, access to Search Console, and available contact workflows. Record the baseline. | Agreed page map, claim register, URL migration map if needed, and measurement specification. | Business owner with developer |
| Days 16 to 30 | Implement core layouts and accurate Home, Care Navigation, Caregivers, About, Contact, and Resources pages. | Content review, working navigation and contact routes, crawl and metadata checks. | Designer, developer, and content owner |
| Days 31 to 60 | Publish reviewed resource pathways and healthcare-career guidance. Add relevant internal links and resource verification dates. | Substantive pages, verified resource records, technical validation, and appropriate analytics. | Content owner and qualified reviewers |
| Days 61 to 90 | Review discovery and inquiry fit. Improve weak pages. Release conditional local or job pages only when justified. | Performance review, documented changes, current resource checks, and readiness evidence. | Business owner with SEO and operations support |

### Prioritized backlog

| Priority | Item | Why it matters |
| --- | --- | --- |
| P0 | Accurate operating claims and real contact routes | Visitors need to know what help is actually available. |
| P0 | Public crawlability and private access controls | Search engines need public content while operational information remains protected. |
| P0 | Caregiver and care-navigation paths | These express the initial audience and user task clearly. |
| P1 | Curated resource pathways and review dates | The site must add practical navigation value. |
| P1 | Unique metadata and internal linking | Each page needs a clear search role and discoverable relationships. |
| P1 | Performance, accessibility, and measurement checks | Visitors must be able to use the site, and results must be interpretable. |
| P2 | Conditional local pages, real vacancies, and partner intake | These depend on operational evidence and actual demand. |

Use the first performance review to select the next task. Strong visibility with inappropriate inquiries may indicate unclear service boundaries. Low visibility with well-used pages may call for better discovery and relevant mentions. A page attracting the wrong intent should be revised before producing more pages on the same theme.

## 11 Release acceptance criteria

Use this checklist for the public SEO release. Record the reviewer, date, evidence, and any remaining issue for each item. Passing a technical check does not establish rankings, clinical capability, or partnership status.

| Check | Evidence required |
| --- | --- |
| Scope and claims | Every service, location, credential, review statement, and partnership claim matches current evidence. |
| Audience routes | A veteran, caregiver, job seeker, and organization can each find an appropriate path without an account. |
| Core page completeness | Each published page has a distinct purpose, useful content, a working next step, and an assigned owner. |
| Resource accuracy | Published records have official sources, access information, geographic limitations where relevant, and a current check date. |
| Crawlability | Representative public URLs return useful content and crawlable links; essential assets can be rendered. |
| Canonical consistency | Host redirects, internal links, canonical tags, sitemap entries, and intended search URLs agree. |
| Index policy | No accidental production noindex; private access is enforced; utilities and duplicate filter routes follow the documented policy. |
| Metadata | Every indexable page has a meaningful title, description, and H1 consistent with its visible content. |
| Structured data | Supported markup matches visible facts; validation errors are resolved; jobs and local types are used only when justified. |
| Internal navigation | Primary pages are linked from navigation; deeper pages have descriptive links and breadcrumbs; no orphan release pages. |
| Mobile and accessibility | Keyboard, focus, labels, errors, contrast, text resizing, and narrow-screen layouts have been reviewed. |
| Performance | Lab checks identify no major avoidable issues; field targets are tracked when enough data exists. |
| Forms and analytics | Success states work; completion counts fire correctly; test traffic contains no submitted personal or sensitive information. |
| Error behavior | Unknown and removed URLs return appropriate status; redirects have no loops or unrelated targets. |
| Search setup | Search Console ownership and sitemap submission are complete where access is available; baseline and release date are recorded. |
| Maintenance | Content owners, resource review dates, job expiry handling, and the first performance review are assigned. |

## Appendix A Audience website evidence

O means older-veteran preview, D means disability preview, and M means mental-health preview. A dash means not displayed in that sample. Affinity is on a 0 to 100 scale. DA is the reported Domain Authority. Traffic values are estimates as pasted and have not been converted into audience counts. [A1-A3]

| Website | O | D | M | DA | Visits per month |
| --- | --- | --- | --- | --- | --- |
| dav.org | 74 | 74 | — | 64 | 98K |
| vfw.org | 73 | — | — | 75 | 67K |
| legion.org | 72 | — | — | 70 | 164K |
| amvets.org | 69 | — | — | 62 | 10K |
| moaa.org | 68 | — | — | 61 | 29K |
| hillandponton.com | 65 | — | — | 44 | 77K |
| vaclaimsinsider.com | 62 | — | — | 41 | 66K |
| vetfriends.com | 60 | — | — | 56 | 52K |
| caregiveraction.org | 49 | — | — | 59 | 11K |
| mobilityworks.com | 42 | — | — | 50 | 40K |
| pva.org | — | 74 | — | 59 | 9K |
| woundedwarriorproject.org | — | 72 | 71 | 67 | 61K |
| biausa.org | — | 71 | — | 61 | 22K |
| msktc.org | — | 70 | — | 56 | 33K |
| militaryonesource.mil | — | 68 | — | 72 | 519K |
| maketheconnection.net | — | 66 | 74 | 54 | <5K |
| hopeforthewarriors.org | — | 65 | 60 | 54 | <5K |
| veteransinc.org | — | 64 | 59 | 45 | <5 visits |
| independencefund.org | — | 62 | — | 49 | <5K |
| veteranscrisisline.net | — | — | 75 | 69 | 18K |
| cohenveteransnetwork.org | — | — | 72 | 47 | <5K |
| giveanhour.org | — | — | 69 | 56 | <5K |
| homebase.org | — | — | 68 | 44 | <5K |
| rallypoint.com | — | — | 63 | 58 | 13K |
| hiddenheroes.org | — | — | 61 | 49 | <5K |

Preserve the Veterans Inc. value of <5 visits as an unresolved display, transcription, or underlying-data issue. Do not silently substitute <5K. RallyPoint current public-community availability remains unverified; the displayed traffic is not confirmed current reach. National website traffic and affinity do not establish local reach or suitable advertising inventory.

### Complete reported age distributions

| Preview | 18 to 25 | 26 to 35 | 36 to 50 | 51 to 65 | 66 and older |
| --- | --- | --- | --- | --- | --- |
| Disability | 13% | 36% | 39.5% | 7.6% | 3.9% |
| Mental health | 17.9% | 38.2% | 34.2% | 6.7% | 3% |

The older-veteran preview displayed only the 66+ group at 100%. Each reported gender distribution and each fully displayed age distribution sums to 100%. None of these figures establishes a diagnosis or the composition of the entire veteran population.

## Appendix B Sources

Audience records A1 to A3 are the SparkToro previews supplied in this conversation. External references below support the factual descriptions and technical requirements, checked during preparation of this document. Proposed page structures, copy, priorities, and project targets are design decisions.

A1  SparkToro preview Older Vietnam era veterans needing care support. Report identifier 1feb0dafe78c. User supplied preview text.

A2  SparkToro preview Combat wounded and disabled US veterans. Report identifier ab3537dd17a1. User supplied preview text.

A3  SparkToro preview US veterans seeking confidential mental health support. Report identifier f9b8ec00369c. User supplied preview text.

S1  SparkToro affinity scores
https://sparktoro.com/support/faq/affinity-scores

S2  SparkToro accuracy and bias
https://sparktoro.com/support/faq/accuracy-and-bias

G1  Google helpful and reliable content
https://developers.google.com/search/docs/fundamentals/creating-helpful-content

G2  Google title links
https://developers.google.com/search/docs/appearance/title-link

G3  Google snippets and meta descriptions
https://developers.google.com/search/docs/appearance/snippet

G4  Google JavaScript SEO basics
https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

G5  Google canonical URLs
https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

G6  Google sitemaps
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

G7  Google noindex guidance
https://developers.google.com/search/docs/crawling-indexing/block-indexing

G8  Google redirects
https://developers.google.com/search/docs/crawling-indexing/301-redirects

G9  Google structured data policies
https://developers.google.com/search/docs/appearance/structured-data/sd-policies

G10  Google organization structured data
https://developers.google.com/search/docs/appearance/structured-data/organization

G11  Google breadcrumb structured data
https://developers.google.com/search/docs/appearance/structured-data/breadcrumb

G12  Google job posting structured data
https://developers.google.com/search/docs/appearance/structured-data/job-posting

G13  Google Search updates including FAQ rich result discontinuation
https://developers.google.com/search/updates

G14  Core Web Vitals
https://web.dev/articles/vitals

G15  Google spam policies
https://developers.google.com/search/docs/essentials/spam-policies

G16  Google Business Profile eligibility
https://support.google.com/business/answer/13763036

G17  Google Analytics guidance on personal information
https://support.google.com/analytics/answer/6366371

W1  Web Content Accessibility Guidelines version 2 point 2
https://www.w3.org/TR/WCAG22/

R1  PVA Veterans Career Program
https://pva.org/find-support/veterans-career-program/

R2  Hidden Heroes caregiver resources
https://hiddenheroes.org/

R3  Caregiver Action Network
https://www.caregiveraction.org/about/

R4  Brain Injury Association of America
https://biausa.org/

R5  Model Systems Knowledge Translation Center
https://msktc.org/

R6  Cohen Veterans Network clinics and state listings
https://www.cohenveteransnetwork.org/clinics/

R7  Veterans Inc programs and geography
https://www.veteransinc.org/

R8  Veterans Crisis Line
https://www.veteranscrisisline.net/

R9  Give an Hour military program
https://giveanhour.org/military/

R10  Home Base access to care
https://homebase.org/programs/get-care/
