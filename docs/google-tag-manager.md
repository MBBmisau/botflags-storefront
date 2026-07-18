# Botflags Google Tag Manager setup

The storefront pushes consent-gated events to Google Tag Manager container `GTM-KRGW7HJ7`. The container must
forward them to Google Analytics 4 tag ID `G-1400JF2PQP`.

Do not deploy the GTM storefront transport until the container configuration below is published. An empty container
would load successfully but would not forward any analytics events.

## Variables

Create these Data Layer Variables using Data Layer Version 2:

| GTM variable name   | Data layer variable name |
| ------------------- | ------------------------ |
| `DLV - ecommerce`   | `ecommerce`              |
| `DLV - debug_mode`  | `debug_mode`             |
| `DLV - page_path`   | `page_path`              |
| `DLV - page_title`  | `page_title`             |
| `DLV - search_term` | `search_term`            |
| `DLV - method`      | `method`                 |

## Google tag

Create `Google Tag - Botflags GA4`:

- Tag ID: `G-1400JF2PQP`
- Trigger: `Initialization - All Pages`
- Configuration parameters:
  - `send_page_view`: `false`
  - `allow_google_signals`: `false`
  - `allow_ad_personalization_signals`: `false`

The storefront sends sanitized manual page views, so automatic page views must stay disabled.

## Custom Event triggers

Create these triggers:

| Trigger               | Event expression                                                                                                                                                                        | Regex |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `CE - Ecommerce`      | `^(view_item_list\|select_item\|view_item\|add_to_cart\|remove_from_cart\|view_cart\|begin_checkout\|add_shipping_info\|add_payment_info\|purchase\|view_promotion\|select_promotion)$` | Yes   |
| `CE - Page View`      | `page_view`                                                                                                                                                                             | No    |
| `CE - Search`         | `search`                                                                                                                                                                                | No    |
| `CE - Authentication` | `^(login\|sign_up)$`                                                                                                                                                                    | Yes   |

## GA4 event tags

Create four Google Analytics: GA4 Event tags, each referencing `Google Tag - Botflags GA4`:

1. `GA4 Event - Ecommerce`
   - Event name: built-in `{{Event}}`
   - Enable sending ecommerce data from the Data Layer.
   - Event parameter: `debug_mode` = `{{DLV - debug_mode}}`
   - Trigger: `CE - Ecommerce`
2. `GA4 Event - Page View`
   - Event name: `page_view`
   - Event parameters: `page_path`, `page_title`, and `debug_mode` from their matching Data Layer Variables.
   - Trigger: `CE - Page View`
3. `GA4 Event - Search`
   - Event name: `search`
   - Event parameters: `search_term` and `debug_mode` from their matching Data Layer Variables.
   - Trigger: `CE - Search`
4. `GA4 Event - Authentication`
   - Event name: built-in `{{Event}}`
   - Event parameters: `method` and `debug_mode` from their matching Data Layer Variables.
   - Trigger: `CE - Authentication`

For every GA4 event tag, set Additional Consent Checks to require `analytics_storage`. Enable Consent Overview in
Container Settings and confirm all GA4 tags appear under Consent Configured before publishing.

## Preview and publish gate

1. Enter GTM Preview mode and connect to the protected storefront.
2. Reject analytics and confirm no GTM container or GA4 event tag fires.
3. Accept analytics and confirm `Google Tag - Botflags GA4` initializes once.
4. Walk the complete shopping and Paystack test funnel.
5. Confirm every custom event activates exactly one matching GA4 event tag.
6. Publish the container with a descriptive version name.
7. In GA4 DebugView, confirm NGN values, populated `items`, and exactly one `purchase` per order.

Use `?debug_mode=true` on storefront URLs to add `debug_mode: true` to every event. In browser developer tools,
successful GA4 delivery appears as an HTTP `204` request to `google-analytics.com/g/collect` with
`tid=G-1400JF2PQP`.
