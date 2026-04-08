# Canada Post API — E-commerce Platform Web Services

> Source: Canada Post Developer Program — E-commerce Platform Web Services
> URL: https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/services/ecomplatforms/default.jsf
> NOTE: This doc is for platforms registering merchants. Our app is a direct merchant, not a platform.

---

## Overview

E-commerce platforms can integrate Canada Post web services and offer them to their merchant customers. Only platforms approved by Canada Post can make these calls.

To become a platform: sign in to Developer Program → select "Become a Platform".

## Registering a Merchant with Canada Post

```
Merchant requests         Canada Post               Canada Post stores        Platform retrieves
shipping from ──→ redirects to CP ──→ authenticates/ ──→ merchant credit ──→ merchant API keys,
platform             sign-up page      creates customer    card for shipping     customer number, etc.
```

### Platform API Calls:

| Call | Description |
|------|-------------|
| **Get Merchant Registration Token** | Get a unique token (token-id) to launch merchant into the Canada Post sign-up process |
| **Get Merchant Registration Info** | Returns merchant info: customer number, username, password for web services |

## Merchant Registration Flow

1. Call `Get Merchant Registration Token` using your platform's authenticated browser session
   - REST: `POST https://soa-gw.canadapost.ca/ot/token`
   - SOAP: `https://soa-gw.canadapost.ca/ol/soap/merchantregistration`
2. Redirect merchant to `return-uri` with token
3. Merchant registers/authenticates with Canada Post
4. Canada Post redirects back to your `return-uri` with GET query parameters
5. Check `registration-status`:
   - `SUCCESS` — proceed to next step
   - `CANCELLED` — merchant cancelled
   - `BAD_REQUEST`, `UNEXPECTED`, `ERROR`, `UNAUTHORIZED`, `SERVICE_UNAVAILABLE` — handle error
6. Call `Get Merchant Registration Info` to retrieve API keys
7. **Store the merchant API key (username and password) on your server securely**
8. The token-id is no longer valid after this step
9. Test credentials with a non-billable call (e.g. Get Rates or Get Customer Information)
10. Pass the merchant's outgoing HTTPS requests through your server

## Registration Parameters

### Request (Get Merchant Registration Token)

| Field | Required | Description |
|-------|----------|-------------|
| return-uri | Mandatory | Callback URL to your system |
| token-id | Mandatory | Refer to the interested user |
| platform-id | Mandatory | Your customer/platform number |
| last-name | Optional | |
| first-name | Optional | |
| address-line-1 | Optional | |
| province-state | Optional | |
| postal-zip-code | Optional | |
| city | Optional | |

## Making API Calls on Behalf of Merchants

### REST calls
Place the `platform-id` element at the top level of each request (same level as locale or mailed-by).

### REST calls on behalf of merchants
Every time you make a REST call on behalf of a merchant, include `Platform-id` in the HTTP headers.

**IMPORTANT:** The URL must include the merchant's customer number AND your platform-id appended with a hyphen:
```
POST https://soa-gw.canadapost.ca/rs/1111111-1234567/1111111/shipment
                                        ↑ merchant  ↑ platform  ↑ merchant
```

Failure to include platform-id in the mailed-by customer number will result in an authentication error (AA02).

## Available Services for Platforms

### Shipping (Contract)
- Create Shipment
- Get Groups
- Get Shipment
- Get Shipment Details
- Get Shipment Price
- Get Shipments
- Void Shipment

### Manifest
- Transmit Shipments
- Get Manifest
- Get Manifests
- Get Manifest Details

### Non-Contract Shipping
- Create Non-Contract Shipment
- Get Non-Contract Shipment Receipt
- Get Non-Contract Shipment Details
- Get Non-Contract Shipments
- Get Non-Contract Shipment

### Returns
- Create Authorized Returns
- Create Open Return Template
- Get/Delete Open Return Template(s)

### Customer Information
- Get Customer Information
- Get MOBO Customer Information

## Dimensions

Dimensions (length, width, height) provide merchants with more accurate shipping costs. **If dimensions are not passed to the Canada Post API, the merchant may be subject to additional charges above the quoted price** based on weight alone. This occurs in cases of large box sizes with light contents.

## Platform Error Codes

| Code | Description | Meaning |
|------|-------------|---------|
| AA02 | Username/password don't match endpoint | Dev key on production or vice versa |
| AA055 | Platform ID not specified | platform-id header is empty or not in URL |
| AA06 | Platform not authorized | Merchant revoked permission or platform-id is incorrect |
| AA07 | Registration request pending | Canada Post has not yet approved your platform application |
| AA08 | Only authorized platforms can access registration services | Apply to become a platform first |
| AA09 | Key type not valid for platform-id | Merchant key must not have platform-id set |
| AA010 | Incorrectly configured platform | platform-id in header and URL disagree |
