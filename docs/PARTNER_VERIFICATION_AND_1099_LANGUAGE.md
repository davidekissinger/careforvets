# CareForVets Partner Verification, W-9, and 1099 Operating Language
**Status:** BUILD v2 draft for legal/tax review  
**Date:** 2026-10-18

## Purpose

This document defines the operating language and workflow for the CareForVets automated Partner Verification Queue. It is not a substitute for legal or tax advice.

## 1. Relationship categories

CareForVets distinguishes among:
- unpaid resource/referral partner;
- employer;
- compensated vendor;
- individual independent contractor;
- clinical provider/entity;
- other relationship requiring manual review.

This distinction matters because collecting tax documents from every organization would create unnecessary sensitive data and does not reflect the purpose of Form W-9.

## 2. W-9 policy

A current Form W-9 is a **mandatory payment-activation requirement** for a compensated CareForVets partner, contracted vendor, independent contractor, or other relationship for which CareForVets expects to make reportable business payments.

An unpaid resource/referral partner does not submit a W-9 merely to be listed or verified in the network unless the relationship later becomes compensable.

The completed W-9 must be retained as a private tax document. Taxpayer identification numbers must not be copied into ordinary application/profile tables.

IRS source: https://www.irs.gov/forms-pubs/about-form-w-9

## 3. Independent-contractor classification

Draft acknowledgement:

> Where CareForVets engages a partner or individual as a nonemployee service provider, the parties acknowledge that the written agreement, method of payment, and any anticipated Form 1099 do not by themselves determine whether the relationship is properly classified as independent contracting. CareForVets may review the actual facts and circumstances of the relationship, including behavioral control, financial control, and the relationship of the parties, and may change the proposed engagement structure if the facts indicate an employment relationship or require further legal review.

The IRS states that a contract calling someone an independent contractor is not sufficient by itself; the substance of the relationship controls.

IRS sources:
- https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee
- https://www.irs.gov/businesses/small-businesses-self-employed/type-of-relationship

## 4. Contractor tax acknowledgement

Draft acknowledgement:

> If the engagement is properly treated as nonemployee compensation, the contractor/vendor is responsible for its own applicable federal, state, local, and self-employment tax obligations. CareForVets does not withhold employee payroll taxes or provide employee benefits for a bona fide independent-contractor engagement unless required by law or expressly stated in a separate written agreement. CareForVets may issue Form 1099-NEC or another information return when required by applicable law.

Do not use this language to convert an employee relationship into an independent-contractor relationship.

## 5. 1099 review rule

For payments made in calendar year 2026, the IRS generally uses a **$2,000 threshold** for reporting nonemployee compensation on Form 1099-NEC. Backup-withholding and other entity/payment-specific rules can create reporting obligations regardless of the ordinary threshold.

The platform should therefore use:
- `review_required`
- `potential_1099`
- `exempt`
- `reportable`
- `filed`

rather than automatically declaring that every W-9 recipient will receive a Form 1099-NEC.

IRS source:
https://www.irs.gov/businesses/small-businesses-self-employed/am-i-required-to-file-a-form-1099-or-other-information-return

## 6. Verification queue release gates

A compensated partner cannot be marked activation-ready unless:
1. W-9 status = accepted;
2. required contractor/vendor agreement status = signed;
3. when the relationship is an individual independent-contractor engagement, worker-classification status = contractor_supported;
4. no unresolved high-risk verification issue remains.

A resource/referral-only partner can proceed without W-9 when no payment is expected, subject to ordinary partner/service/provenance verification.

## 7. Data handling

W-9 documents belong in the private `partner-tax-documents` bucket. The ordinary database stores:
- whether a W-9 is required;
- document status;
- upload/review timestamps;
- reviewer identity;
- tax-review status.

It should not store SSNs or full EIN/TIN values copied from the form.

## 8. Production review

Before accepting real W-9s or activating paid contractors/vendors:
- employment counsel should review the contractor agreement and classification workflow;
- the organization's tax professional should review 1099 procedures and year-specific thresholds;
- production access controls and retention rules for tax documents should be approved.
