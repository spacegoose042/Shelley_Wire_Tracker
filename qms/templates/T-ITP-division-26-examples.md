# T-ITP-26 Example Inspection and Test Plans (Division 26)

**Shelley Electric, Inc.**  
**How to use:** These are **examples**, not a substitute for the project specification. Copy a section into T-ITP, then add or delete lines to match the spec, drawings, and AHJ.

Acceptance criteria should always cite the **project spec section** first, then NEC article, then manufacturer.

Hold (H) / Witness (W) / Surveillance (S) / Record (R) — see T-ITP-master.

---

## Example A — Underground, ductbank, and direct-buried conduit

**Typical spec:** 26 05 33, 26 05 43 (confirm)

| # | Activity | Acceptance criteria (edit to spec) | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Preparatory: routing vs civil/electrical drawings; locates complete; bedding material approved | Current drawings; 811 locates | H | GF |
| 2 | Trench depth, width, slope, and clearances from other utilities | Drawings; NEC 300.5; spec | H | GF [AHJ if required] |
| 3 | Conduit type, size, bends, spacers, and concrete envelope if specified | Submittal; drawings | S | GF |
| 4 | Bell ends, bushings, mandrel / swab, pull line left in spare | Spec | S | Crew / GF |
| 5 | Warning tape / detectable tape at specified depth | Spec | S | Crew |
| 6 | **Hold: inspect before backfill** | AHJ / GC / owner as required | H | GF + [AHJ] |
| 7 | Photo record of each run before cover | Company / spec | R | GF |
| 8 | Backfill lift thickness and compaction if specified | Spec / civil | S | GF |
| 9 | As-built dimensions (depth, offsets) on redlines | Closeout | R | GF |

**Common failures:** shallow cover, missing warning tape, no inspect-before-cover, wrong conduit type in corrosive soil, radius too tight for cable.

---

## Example B — Rough-in (branch, boxes, homeruns)

**Typical spec:** 26 05 19, 26 05 33, 26 27 26

| # | Activity | Acceptance criteria | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Preparatory: approved lighting/power drawings; box fill calculated for multi-gang; fire-rated walls identified | Drawings; NEC 314 | H | GF |
| 2 | Box type and support; height per architectural/ADA | Drawings; ADA where required | S | Crew / GF |
| 3 | Conduit fill, support spacing, connectors, bushings | NEC 342–358 as applicable; NEIS | S | GF |
| 4 | MC/AC/NM method as specified (do not substitute methods) | Spec | S | GF |
| 5 | Firestop / fire-rated penetrations | Spec 07 84 00 / UL system | H | GF [AHJ] |
| 6 | Conductor type, color, size; dedicated neutrals if specified | Spec; NEC 210/215 | S | GF |
| 7 | **Rough-in inspection before cover / insulation / drywall** | AHJ | H | AHJ + GF |
| 8 | Pull tensions / lube on large feeders if applicable | Manufacturer / spec | S | GF |

**Common failures:** box fill, unsupported MC, missing firestop, wrong height, homeruns not matching panel schedule.

---

## Example C — Switchgear, panelboards, transformers (gear)

**Typical spec:** 26 24 13, 26 24 16, 26 22 00

| # | Activity | Acceptance criteria | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Preparatory: approved shop drawings; pad/housekeeping; seismic if specified; clearances | NEC 110.26; submittal | H | GF + PM |
| 2 | Receiving: no damage, accessories, keys, correct AIC / ratings | F-03; nameplate vs spec | H | Receiver |
| 3 | Setting, anchoring, leveling, grout if specified | Mfr; spec | S | GF |
| 4 | Torque all lugs to mfr values; mark torque | Mfr torque chart | H | JW + GF |
| 5 | Grounding / bonding of enclosure and neutrals per service type | NEC 250 | H | GF |
| 6 | Breaker sizes vs panel schedule; spare provisions | Drawings | S | GF |
| 7 | Labels, directory, arc-flash labels if specified | Spec; NEC 110.16 | S | GF |
| 8 | Transformer ventilation, clearances, tap setting | Mfr; NEC 450 | S | GF |
| 9 | Pre-energization inspection; insulation resistance on feeders | Spec; megger values | H | GF [Cx/AHJ] |
| 10 | Energization with GC/owner outage plan | Safety program; T-PQP | H | PM + GF |

**Common failures:** working clearances, incoming lug torque, wrong breaker, missing grounding electrode conductor, directory not updated.

---

## Example D — Lighting and lighting controls

**Typical spec:** 26 51 00, 26 09 23

| # | Activity | Acceptance criteria | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Fixtures vs approved submittal (catalog, CCT, driver, emergency) | Submittal | S | GF |
| 2 | Supports, seismic, ceilings coordination | Spec; drawings | S | Crew |
| 3 | Emergency / night-light circuiting per drawings | NEC 700/701/702 as applicable | H | GF |
| 4 | Controls: occupancy, daylight, BAS interface as specified | Spec; sequence of operations | W | GF [Cx] |
| 5 | Aiming (if specified) and punch of lamps/drivers | Spec | S | GF |
| 6 | Owner training on controls if specified | Spec | R | PM |

**Common failures:** wrong CCT, emergency fixtures on wrong circuit, controls not programmed, fixtures used as junction boxes contrary to listing.

---

## Example E — Fire alarm (high level)

**Typical spec:** 28 31 00 (or Division 26 if combined). **License:** alarm contractor / technician as required by MABCD and Kansas Fire Marshal.

Fire alarm is a **separate controlled process**. Do not treat it like lighting.

| # | Activity | Acceptance criteria | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Preparatory: shop drawings approved by AHJ if required; programming vendor identified | NFPA 72; spec | H | PM + alarm tech |
| 2 | Cable type (FPL/FPLP etc.), support, separation from power | NFPA 72; NEC 760 | S | Tech |
| 3 | Device locations vs drawings and NFPA 72 spacing | Approved drawings | S | Tech |
| 4 | Pre-test 100% (or spec %) before AHJ | Spec / NFPA 72 | H | Tech |
| 5 | AHJ / Fire Marshal acceptance test | AHJ | H | AHJ + Tech |
| 6 | Record of completion; as-builts; codes/passwords | NFPA 72 | R | PM |

**Common failures:** installing before shop drawing approval, wrong cable, devices moved by other trades, no pre-test.

---

## Example F — Testing, megger, and energization

**Typical spec:** 26 05 00, 26 08 00, or commissioning spec. May require NETA ATS/ATS-2017 (or current) for gear.

| # | Activity | Acceptance criteria | Type | By |
| --- | --- | --- | --- | --- |
| 1 | Test plan issued (what, values, who witnesses) | Spec | H | PM |
| 2 | Continuity and insulation resistance of feeders / motors as specified | Minimum megohm values in spec | H | JW |
| 3 | Grounding electrode / system resistance if specified | Spec ohms | W | GF [Cx] |
| 4 | Functional test of ATS / generator / UPS | Spec; manufacturer | W | GF + vendor |
| 5 | Phase rotation | Nameplates / motors | H | JW |
| 6 | Energization authorization | Outage plan; GC | H | PM |
| 7 | Test reports in closeout | Spec format | R | PM |

**Record instrument ID on every recorded test.**

---

## How a new-to-the-industry PM should tailor these

1. Open the spec table of contents. Highlight Division 26 (and 27/28).  
2. For each spec section you will actually install, copy the closest example above.  
3. Add any **testing table** from the spec (they often list exact megger voltages).  
4. Ask the GF: “What does the inspector fail us on in this city?” Add that as a hold point.  
5. Delete rows that are not in scope.
