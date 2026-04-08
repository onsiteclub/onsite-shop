# Canada Post API — Error Codes & Reference Tables

> Source: Canada Post Developer Program — Messages and Code Tables
> URL: https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/messagescodetables.jsf
> Referenced from: `lib/canada-post/shipment.ts`

---

## Error Messages & Mitigation

### Authentication & Platform Errors

| Code | Description | Meaning & Mitigation |
|------|-------------|---------------------|
| Server | Rejected by SLM Monitor | Throttle limit for API key. Blocked for up to 1 minute. Request limit increase via "Increase Limits" link. |
| AA01 | User ID deactivated | Re-join from the Developer Program website. |
| AA02 | Username/password don't match endpoint | Merchant requests cannot be sent to development environment. Dev key → sandbox, prod key → production. |
| AA03 | API key doesn't match customer number | Verify your data. Authorization header must match the customer number in the request. |
| AA04 | Cannot mail on behalf of requested customer | — |
| AA05 | Platform ID not specified | The platform-id header variable is empty or not present in the URL. Only during platform development. |
| AA06 | Platform not authorized | The platform-id is incorrect or the merchant subsequently came to Canada Post and revoked permission. |
| AA07 | Platform not active | You must use Get Merchant Registration Token; your application to become an e-commerce platform is still pending. |
| AA08 | Unauthorized Platform | You are attempting to use Get Merchant Registration Token but have not applied to become a platform. Sign in to Developer Program and select Become a Platform. |
| AA09 | Key type not valid for platform-id | If a key other than a merchant key is used to authenticate a transaction, the platform-id field must not be specified. |

### HTTP Status Codes

| Code | Description | Meaning |
|------|-------------|---------|
| E002 | AAA Authentication Failure | API key is invalid. Double check your inputs. |
| 200 | Success | Process the details in the message body. |
| 300 | Resource not yet available | Submit again at regular intervals (e.g. every second). For thousands of shipments, poll for a few minutes. |
| 304 | Success (not modified) | Use the stored version of the data. Used with ETag and If-None-Match headers. |
| 400 | Error | Request failed validation. Description contains details. Fix during development; can be corrected by end-user or developer with logical selections/validations. |
| 401 | Error | Correct the API key in the "Authorization" header. See Errors AA01–AA04. |
| 403 | Forbidden | See Errors AA01–AA04. |
| 404 | Not Found | Resource path is incorrect or resource is no longer available. |
| 406 | Error | Interface version not expected. Change the "Accept" header variable. |
| 412 | Error | Unexpected pre-condition error for a create shipment. |
| 415 | Error | Interface version declared in request is invalid or not supported. Change the "Content-Type" header variable. |
| 500 | Error | Correct the XML; schema error as per the detailed message. |

### Shipment Creation Errors

| Code | Description | Meaning & Mitigation |
|------|-------------|---------------------|
| 1156 | Address Line 1 is mandatory | Missing required sender/recipient address line 1. |
| 1157 | City is mandatory for Canada or USA | Missing city for domestic or US shipments. |
| 1159 | Province/State is mandatory for Canada/USA | Missing province (Canada) or state (USA). |
| 1162 | **Transaction could not be authorized** | **Credit card issue.** Due to an issue with the default credit card on file with Canada Post, unable to authorize. Please sign in to Canada Post website and edit your business profile to update credit card information. |
| 1164 | COD Collection is mandatory when COD option selected | See the code table for valid collection-qualified values. |
| 1459 | Reason for Export code not valid | Enter a valid reason for export: DOC, SAM, REP, SOG, OTH. |
| 1622 | Expected mailing date must not be in past | The requested-mailing-date must not be in the past. Remove this element from the request if unsure. |
| 1653 | **Method of payment "Account" not available** | **You must be a commercial customer with a parcel agreement and have an account in good standing. If you are a Solutions for Small Business customer, returns web services are not available.** |
| 1702 | Contract Number not associated to MOBO Customer | — |
| 1711 | **Invalid Method of Payment** | Valid methods of payment are by "creditcard" or "account". |
| 2500 | Contract number not valid | This error occurs when a rating request is made with a non-numeric value for the contract parameter. |
| 2506 | Contract Number is a required field | For a Create Shipment request, a value for customer-id within <settlement-info> must be provided. Billed-of-customers without a contract cannot use Create Shipment. |
| 2550 | Contract-id not valid | The contract-id provided is not a valid contract number. Check your number and try again. |
| 2553 | COD amount cannot exceed $5,000 | The value in <option-amount> must be reduced. Note: $1,000 max for Solutions for Small Business, $5,000 for commercial. |
| 2700 | Total Customs Weight must not be greater than item weight | The value in <weight> within <parcel-characteristics> cannot be less than the sum of <unit-weight> × <number-of-units> within each <item>. |
| 3000 | Selected service not available for country/contract | The <service-code> and <country-code> within <destination> need to be valid pairings. |

### Label & Group Errors

| Code | Description | Meaning & Mitigation |
|------|-------------|---------------------|
| 8034 | Shipment already PROCESSED or PRINTED | The shipment has already been transmitted. A refund must be requested. |
| 8534 | Valid destination country must be supplied | The destination country must be provided; see Codes for valid values. |
| 8718 | Valid value for Non-Delivery Handling required | For some delivery services, mandatory to make a declaration regarding what should be done with undeliverable shipments. |
| 9105 | Required query parameter not provided | Add the required query parameter to the request. |
| 9108 | Max labels (10,000) reached | Must transmit before next shipment is created. Make a Transmit Shipments request. |
| 9109 | Max groups (9,999) reached | Must transmit before continuing. |
| 9110 | Max shipments in group (5,000) reached | Must transmit before continuing. |
| 9111 | **No services appropriate for shipment** | A Get Rates request was unable to return any price quotes. Validate parcel criteria against product specifications (weight, dimensions). |
| 9112 | **Credit card authorization failed** | Please specify your customer number and contract number and contract number to receive a "commercial" rate quote. You can also specify a <quote-type> of "counter" to get consumer rates. |
| 9113 | Please specify customer number | A Get Rates request was made with <quote-type> omitted or with the value of "commercial" and without the <customer-number> element. For commercial rates, a contract number should also be provided. |
| 9114 | To get "courier" rates, remove "commercial" elements | A Get Rates request was made with <quote-type> of "counter" and <customer-number> or <contract-id> elements were present. Remove them or change to "commercial" quote type. |
| 9120 | Return service code not valid | The return service code is not valid. Get Service request in advance to determine services for <service-code>. |
| 9122 | All groups empty or excluded | A Get Groups call can be made to see what groups are candidates for transmit. Groups are only deleted by the system after 24 hours. |

### Payment & Account Errors

| Code | Description | Meaning & Mitigation |
|------|-------------|---------------------|
| 9173 | **Commercial customer with parcel agreement must use Contract Shipping** | The customer number provided in the request belongs to a commercial customer. The Contract Shipping set of services must be used rather than Non-Contract Shipping. |
| 9174 | **To pay by credit card, default payment card must be in profile** | This error appears when a Create Non-Contract Shipment request is made but no default credit card is on file with Canada Post. Please sign in to Canada Post website and update your business profile to select or add a default credit card. |

### System & Format Errors

| Code | Description | Meaning & Mitigation |
|------|-------------|---------------------|
| 9128 | Set appropriate customs defaults for documentary service | — |
| 9134 | BF/LP and D2PO mutually exclusive | Please select only one. |
| 9150 | System error | Unable to render a PDF. Canada Post internal error. |
| 9151 | System error | Unable to render a PDF. Canada Post internal error. |
| 9152 | Customer number format incorrect | This error is returned if the request has a mailed on behalf of customer part of the URL which is formatted incorrectly. |
| 9153 | Transmit process not completed | A Get Manifest request was made too soon after Transmit Shipments. A delay of 350ms per shipment is recommended. |
| 9154 | System error | You will receive this error if you are attempting to use Get Manifest (Artifact ID) service but the previous Transmit Shipments almost failed. Shipments are maintained asynchronously hence the error. Common cause: transit failure in missing default credit card. |
| 9155 | System error | Unable to render a PDF due to a problem with the server. |
| 9159 | No labels remain for template | A Retrieve Next Open Return request was made but total labels in template already retrieved. Issue another Create Open Return Template request. |
| 9162 | Length, Height and Width mandatory when document flag is false | Unless sending a document, values must be provided for length, width and height. |
| 9164 | Max open return templates reached | A Create Open Return Template request was made but max allowed number of templates already exists. |
| 9165 | Max unused open return receipts reached | There is a limit to the number of labels that can be requested by all open templates combined. |
| 9182 | Message Type invalid | The message type must always be SO (for scheduled outage). |
| 9186 | Only one of shipping-point-id or requested-shipping-point allowed | Provide either requested-shipping-point or shipping-point-id, but not both. |
| 9188 | shipping-point-id not valid | — |
| 9189 | shipping-point-id and requested-shipping-point mutually exclusive | — |
| 9191 | ZPL is for thermal printers only | You can only use 4x6 with thermal paper. Change output-format to 4x6 if you want to print thermal labels. |
| 9192 | 3x4 return labels not available anymore | Use 4x6 on plain paper; change the encoding element to pdf. |
| 9196 | Only one of date/tracking PIN may be provided | You can use either for statements using a date range or a tracking PIN, but not both. |
| 9208 | Public labels only in 8.5x11 PDF | Set the output-format element to 8.5x11 and the encoding element to PDF. |
| 10028 | Invalid Product Service ID specified | The <service-code> value used does not match any valid service codes. Use Discover Services request. |
| 10033 | Invalid Country code in destination | The <country-code> within <destination> is not a valid country code. |

---

## Service Codes

| Code | Description |
|------|-------------|
| DOM.EP | Expedited Parcel |
| DOM.PC | Priority |
| DOM.RP | Regular Parcel |
| DOM.XP | Xpresspost |
| DOM.XP.CERT | Xpresspost Certified |
| INT.IP.AIR | International Parcel Air |
| INT.IP.SURF | International Parcel Surface |
| INT.SP.AIR | Small Packet International Air |
| INT.SP.SURF | Small Packet International Surface |
| INT.TP | Tracked Packet — International |
| INT.XP | Xpresspost International |
| USA.EP | Expedited Parcel USA |
| USA.SP.AIR | Small Packet USA Air |
| USA.TP | Tracked Packet — USA |
| USA.TP.LVM | Tracked Packet — USA (Large Volume Mailers) |

## Option Codes

### Service Features (`<option-class>` = FEAT)

| Option | Code | Notes |
|--------|------|-------|
| Coverage (insurance) | COV | Requires `<option-amount>`. Prerequisite: DC |
| Collect on Delivery | COD | Requires `<option-amount>`. Conflicts with D2PO, LAD |
| Delivery Confirmation | DC | System generated |
| Signature Option | SO | Prerequisite: DC. Conflicts with LAD |
| Deliver to Post Office | D2PO | Requires `<option-qualifier-2>` (office ID). Conflicts with HFP, COD, LAD, DNS |

### Non-Delivery Handling (`<option-class>` = NDI)

| Option | Code |
|--------|------|
| Do not safe drop | DNS |
| Card for pickup | HFP |
| Leave at door – do not card | LAD |
| Return at sender's expense | RASE |
| Abandon | ABAN |
| Return to sender | RTS |
| Proof of age required (18 years) | PA18 |
| Proof of age required (19 years) | PA19 |

## Payment Methods

| Value | Description |
|-------|-------------|
| `CreditCard` | Charge the default credit card on file in Canada Post profile |
| `Account` | Invoice billing — requires commercial customer with parcel agreement and good standing |

## Adjustment Codes

| Code | Description |
|------|-------------|
| AUTDISC | Automation discount |
| FUELSC | Fuel surcharge |
| V1DISC | Solutions for Small Business discount |
| PROMODISC | Promotional discount (if promo code is invalid/expired, amount shows as zero) |
| PURFEE | Fee charged for using a label before it was paid for |

## Credit Card Types

| Code | Description |
|------|-------------|
| MC | MasterCard |
| VIS | Visa |
| AME | American Express |

## Taxes

| Code | Description |
|------|-------------|
| GST | Goods and Services Tax |
| PST | Provincial Sales Tax |
| HST | Harmonized Sales Tax |
