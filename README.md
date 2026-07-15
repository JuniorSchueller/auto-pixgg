# ⚡ Auto PixGG

[![Lib version](https://img.shields.io/github/package-json/v/JuniorSchueller/auto-pixgg?color=blue)](https://github.com/JuniorSchueller/auto-pixgg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Auto PixGG** is a lightweight JavaScript/TypeScript library designed to simplify PixGG payment integration and validation. Perfect for simple e-commerces, SaaS platforms, and indie hackers who want to automate their Pix flow without headache.

---

## 💸 Are there any costs?

No! **Auto PixGG** is completely free and open-source. The only costs you will encounter are the standard transaction rates from PixGG itself. You can check their official pricing in the [PixGG Terms of Service](https://pixgg.com/termos-de-uso).

---

## 🚀 Quick Start

### 1. Installation

Install the package via npm:

```bash
npm install JuniorSchueller/auto-pixgg@latest
```

### 2. Import the Library

```javascript
import { Client } from 'auto-pixgg';
```

### 3. Initialize the Client

Initialize the client using your PixGG credentials.

> ⚠️ **Security Tip:** Never hardcode your credentials. Always use environment variables (like `process.env.PIXGG_EMAIL`) to keep your account safe!

```javascript
const client = new Client({ email: 'your@email.com', password: 'your_password' });
```

---

## 🛠️ Usage Examples

Once the client is configured, you can manage your statistics and payments with ease.

```javascript
async function handlePayments() {
  try {
    // 1. Get account balance and pending status
    const statistics = await client.statistics();
    console.log('Stats:', statistics);

    // 2. List all Pix payments in your account
    const pixPayments = await client.payments.list();
    console.log('All Payments:', pixPayments);

    // 3. Create a new Pix payment (Value, Metadata String)
    const metadata = JSON.stringify({ productId: 'abc', customerId: 'xyz' });
    const newPayment = await client.payments.create(5.00, metadata);
    console.log(`Payload created! Copy and Paste URL: ${newPayment.url}`);

    // 4. Check the status of a specific payment by ID
    const paymentStatus = await client.payments.check('transaction_id_here');
    if (paymentStatus.confirmed) {
      console.log('Payment approved! Access granted.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
```

---

## 📊 API Reference & Responses

### 1. Statistics (`client.statistics()`)

Retrieves the financial status of your PixGG account.

**Response Example:**

```json
{
  "remaining": 150.50,
  "pending": 25.00
}
```

| Field | Type | Description |
| --- | --- | --- |
| `remaining` | `Float` | The current available balance in your account. |
| `pending` | `Float` | Balance waiting to be cleared/transferred to your bank account. |

---

### 2. Payments

#### 📂 List (`client.payments.list()`)

Returns an array of all recent payment requests.

**Response Example:**

```json
[
  {
    "id": 1234567,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "approvedAt": "2026-01-01T00:05:00.000Z",
    "data": "{\"productId\": \"abc\"}",
    "amount": 6.5,
    "author": "Customer Name"
  }
]
```

#### ➕ Create (`client.payments.create(value, data)`)

Generates a new Pix transaction.

**Response Example:**

```json
{
  "id": "AbC0eF",
  "url": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `String` | Unique transaction ID. |
| `url` | `String` | The "Copia e Cola" Pix payment URL. |

#### 🔍 Check (`client.payments.check(id)`)

Validates the current status of a specific transaction.

**Response Example:**

```json
{
  "confirmed": true,
  "status": "APPROVED",
  "data": {
    "id": 1234567,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "approvedAt": "2026-01-01T00:05:00.000Z",
    "data": "{\"productId\": \"abc\"}",
    "amount": 6.5,
    "author": "Customer Name"
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `confirmed` | `Boolean` | `true` if the payment was successfully processed. |
| `status` | `String` | The current state of the transaction (e.g., *PENDING*, *APPROVED*). |
| `data` | `Object` | Full transaction details (contains `id`, `createdAt`, `approvedAt`, `data`, `amount` and `author`). |

---

## 📝 License & Author

Developed with ❤️ by [JuniorSchueller](https://github.com/JuniorSchueller).

This project is licensed under the [MIT License](LICENSE). Feel free to fork, contribute, and use it in your personal or commercial projects!
