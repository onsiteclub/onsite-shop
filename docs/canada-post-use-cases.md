# Canada Post API — Use Cases & Workflows

> Source: Canada Post Developer Program — Use Cases for Web Services
> URL: https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/services/usecases.jsf#printing_labels

---

## E-commerce Shipping Workflow

```
1. Get rates for shipping services
2. Print shipping labels
3. Get Canada Post charges (optional)
4. Transmit shipments to receive a manifest (CONTRACT ONLY)
5. Track orders from your website
6. View signature image or Delivery Confirmation Certificate
```

## Print a Shipping Label (Plain Paper or Thermal)

When you create a shipment, you can specify:
- Labels in thermal or plain paper format
- PDF encoding for the label
- Email notification options for tracking

**IMPORTANT: For commercial/contract customers, shipment tracking events begin ONLY once the manifest has been transmitted.**

### Flow:
```
Your Application              Canada Post Web Services
─────────────────              ──────────────────────────
Assemble order details ──────→ Create Shipment
                        ←────── Shipment (XML + links)
Invoke provided link ─────────→ Get Artifact
                        ←────── Shipping Label (PDF)
```

## Ad Hoc vs Batch Patterns

### Ad hoc — one at a time (current implementation)
```
Assemble order → Create Shipment → Get label link → Get Artifact (PDF) → repeat
```

### Batch — store many, print all at once
```
Assemble order → Create Shipment → Store response → repeat
... then ...
Invoke stored label links → Get Artifact (PDF) → repeat
```

Shipment information is stored on Canada Post servers from the time you create it **until 90 days** after it is transmitted.

## Transmit Shipments to Receive a Manifest

> **CRITICAL for Contract Shipping**: After creating shipments, you MUST call
> "Transmit Shipments" to finalize them and receive a manifest (proof of payment).
> Without transmitting, tracking events will NOT begin.

### Performance Limitations
- Max 30 groups per manifest (30 group-ids in one Transmit Shipments request)
- Max 5,000 shipments in one group

### System Limitations (before Transmit)
- Max 50 groups per manifest (error 9109 if exceeded)
- Max 10,000 shipments in one group (error 9110 if exceeded)
- Max 10,000 shipments across multiple groups (error 9108 if exceeded)

### Transmit Flow:
```
Your Application                Canada Post Web Services
─────────────────                ──────────────────────────
Transmit before pick-off ──────→ Get Groups
                          ←────── Groups (XML)
Invoke transmit ──────────────→ Transmit Shipments
                          ←────── Manifests (XML + links)
Invoke manifest link ─────────→ Get Manifest
                          ←────── Manifest (XML + links)
Invoke artifact links ────────→ Get Artifact
                          ←────── Manifest (PDF)
```

## Retrieve Manifest Details

Manifest details are available as XML data. Links to the data are returned at the same time as links to the manifest document from a "Get Manifest" request.

If manifest links are lost or intentionally not stored, you can use the synchronization call "Get Manifests" with a date range of today's date to retrieve links for all manifests created by transmit requests.

## Track Orders From Your Website

```
Shopper enters tracking number ──→ Get Tracking Summary
Display most recent event ───────→ Get Tracking Details
Display all delivery events ←───── Detail (XML data)
```

## View Signature Image or Delivery Confirmation Certificate

```
Provide parcel PIN ────→ Get Signature Image ────→ Signature (XML + Base64 JPG)
              OR
Provide parcel PIN ────→ Get Delivery Confirmation Certificate ────→ Certificate (PDF)
```

---

## Key Takeaway for Our Implementation

Our current code does:
1. ✅ Create Shipment
2. ✅ Download label PDF (Get Artifact)
3. ✅ Store tracking pin + label URL

**What's MISSING for contract shipments:**
4. ❌ **Transmit Shipments** — needed to finalize the shipment and start tracking
5. ❌ **Get Manifest** — proof of payment / receipt

Without step 4, the label shows "MANIFEST REQ" and tracking may not activate.
For non-contract shipments, transmit/manifest is NOT required.
