# As-is process map (bid to cash)

**Status:** Draft from verbal description. Confirm with operations before treating as official.  
**Related procedure hooks:** QP-01 through QP-06.

This is the current high-level flow, not the future-state quality system. Yellow items are natural quality control points.

```
Customer / GC
    |  Bid invitation, drawings, specs
    v
PM — review scope, takeoff
    v
PM — estimate labor hours and material cost
    v
PM — submit proposal / bid
    v
Customer review (questions, price, scope)
    |  dashed loop: revise estimate and resubmit
    v
WIN THE JOB?
    |-- No --> Mark LOST. Record reason. Close pursuit.
    v Yes
Receive signed contract or notice to proceed
    v
Accounting — enter job in Trimble Viewpoint Vista
             (job / work order number created)
    v
PM — allocate labor and crews; issue material POs from estimate
    v
WHERE DOES MATERIAL SHIP?
    |-- Direct to jobsite --> Field receives
    |                              |
    +-- To warehouse -------------+--> Tie material to job by
                                       WO / job number (Wire Tracker)
    v
Field — execute: pull wire, install gear, terminate, test
    v
Accounting — roll up labor and material into job cost
    v
Accounting / PM — bill customer (progress or final)
    v
Payment received; job closed (closeout package should complete here)
```

---

## Control points (what the QMS owns)

| Step | Control | Record |
| --- | --- | --- |
| Bid review and takeoff | Bid/no-bid and scope checklist | F-01 |
| Estimate | Peer review over a dollar threshold | Reviewed estimate, assumptions log |
| Contract award | Contract review: scope, schedule, spec, QA flow-down | F-02 |
| Vista job setup | Job number, cost codes, budget match estimate | Job setup checklist |
| Purchasing | Approved vendor; PO cites job/WO; submittal-approved product | PO, QP-02 |
| Receiving (warehouse or site) | Identity, count, damage, approved product | F-03 / Wire Tracker |
| Material tied to job | Every pull and return on job/WO | Wire Tracker |
| Installation | ITP per feature of work; NECA workmanship | Signed ITP, test reports |
| AHJ / owner inspection | First-pass tracking; NCR if fail | F-08, F-04 |
| Job costing | Actual vs estimated labor and material by cost code | Vista variance |
| Billing and closeout | Punchlist, as-builts, O&M, warranty | F-06, F-07 |

---

## Known gaps to confirm with PMs

Use this list in the walkthrough. Do not invent answers.

- [ ] Who marks a pursuit Lost, and where is the reason stored?
- [ ] Is there a written estimate review above $[amount]?
- [ ] Who creates the Vista job — accounting only, or PM request form?
- [ ] How are cost codes structured vs the estimate?
- [ ] Submittal process today (who logs, who tracks return, how field gets approved product)?
- [ ] Who is allowed to receive material at the jobsite?
- [ ] How returns to warehouse are handled today
- [ ] Current punchlist and closeout owner
- [ ] How change orders enter Vista and the field
- [ ] RFI log location
- [ ] Calibration of megger / torque tools — current practice
- [ ] Fire alarm / specialty licenses on file
