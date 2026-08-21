// Load environment variables dari .env paling awal
require('dotenv').config();

const path = require('path');
const express = require('express');
// Menggunakan cara import modular sesuai dengan SDK Xendit versi terbaru
const { Xendit } = require('xendit-node'); 

// TAMBAHAN: Mengimpor getProductById dari odooService
const { 
    getProducts, 
    getProductById, 
    createSalesOrder, 
    confirmSalesOrder, 
    confirmSalesOrderByRef,
    getDigitalFileUrl, 
    getDigitalUrlByOrderId 
} = require('./odooService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Menyajikan frontend skeleton (public/index.html, assets, dll)
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Xendit menggunakan SDK versi terbaru
const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY
});

// Mengambil modul Invoice dari instance xenditClient
const { Invoice } = xenditClient;

// =========================================================================
// HELPER BARU: Mengubah Base64 panjang menjadi URL file .png yang rapi
// =========================================================================

// 1. TAMBAHKAN MAPPING ROLE DI SINI (Di atas fungsi formatProductData)
const ROLE_MAP = {
  'product_designer': '3D Product Designer',
  'industrial_designer': 'Industrial Designer',
  'graphic_designer': 'Graphic Designer'
};

function formatProductData(req, product) {
    if (!product) return null;

    const host = req.get('host');
    const protocol = req.protocol;
    
    // 2. PROSES TRANSLASI ROLE DESAINER
    const rawRole = product.x_designer_role || '';
    const formattedRole = ROLE_MAP[rawRole] || rawRole;

    const formatted = { 
        ...product,
        x_designer_role: formattedRole // Override dengan label nama rapi
    };

    // Hapus string Base64 yang panjang
    delete formatted.image_128;

    // Arahkan langsung ke endpoint /image tanpa embel-embel nama file
    formatted.image_url = `${protocol}://${host}/api/products/${product.id}/image`;

    return formatted;
}

// =========================================================================
// Endpoint 1: Ambil Semua Produk dari Odoo
// =========================================================================
app.get('/api/products', async (req, res) => {
    try {
        const odooData = await getProducts();
        // Memformat seluruh list produk
        const formattedProducts = odooData.map(p => formatProductData(req, p));
        res.json({ success: true, products: formattedProducts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// Endpoint Kategori Khusus (Catalog, Package, Publicity)
// =========================================================================

// Helper fungsi filter kategori (case-insensitive & aman dari error null)
function filterByCategory(products, targetCategory) {
    return products.filter(p => {
        // Cek dari categ_id bawaan Odoo (misal: [13, "Package"])
        const categName = Array.isArray(p.categ_id) ? p.categ_id[1] : '';
        // Cek dari custom field x_product_type jika ada
        const customType = p.x_product_type || '';

        return categName.toLowerCase().includes(targetCategory) || 
               customType.toLowerCase().includes(targetCategory);
    });
}

// 1. ENDPOINT HANYA UNTUK CATALOG
app.get('/api/catalog', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const catalogOnly = filterByCategory(allProducts, 'catalog')
            .map(p => formatProductData(req, p));

        res.json({ success: true, products: catalogOnly });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. ENDPOINT HANYA UNTUK PACKAGE
app.get('/api/package', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const packageOnly = filterByCategory(allProducts, 'package')
            .map(p => formatProductData(req, p));

        res.json({ success: true, products: packageOnly });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. ENDPOINT HANYA UNTUK PUBLICITY
app.get('/api/publicity', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const publicityOnly = filterByCategory(allProducts, 'publicity')
            .map(p => formatProductData(req, p));

        res.json({ success: true, products: publicityOnly });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// Endpoint Detail 1 Produk Berdasarkan ID
// =========================================================================
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        const formattedProduct = formatProductData(req, product);
        res.json({ success: true, product: formattedProduct });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

// =========================================================================
// ENDPOINT GAMBAR BARU: Menyajikan File Gambar (.png) Asli
// =========================================================================
app.get('/api/products/:id/image', async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product || !product.image_128) {
            return res.status(404).send('Gambar tidak ditemukan');
        }

        const imgBuffer = Buffer.from(product.image_128, 'base64');
        
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imgBuffer.length
        });
        res.end(imgBuffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// =========================================================================
// Endpoint 1: Processes Checkout (Odoo Quotation + Xendit Invoice Direct Bank)
// =========================================================================
app.post('/api/checkout', async (req, res) => {
    try {
        const { orderId, amount, customerEmail, customerName, items, description, bankCode } = req.body; 

        const externalId = orderId || `ZHK-${Date.now()}`;
        const totalAmount = parseFloat(amount || 0);

        // A. Buat Quotation (sale.order) di Odoo
        try {
            const odooOrderId = await createSalesOrder(1, items, externalId);
            console.log(`✓ [Odoo] Quotation (${externalId}) sukses dibuat dengan ID: #${odooOrderId}`);
        } catch (odooErr) {
            console.warn(`⚠️ [Odoo] Gagal membuat Quotation: ${odooErr.message}`);
        }

        // B. Mapping filter payment_methods Xendit Invoice
        let paymentMethodsFilter = undefined;
        if (bankCode && bankCode !== 'QRIS') {
            paymentMethodsFilter = [bankCode.toUpperCase()]; // Contoh: ['BNI'], ['BCA'], ['MANDIRI']
        } else if (bankCode === 'QRIS') {
            paymentMethodsFilter = ['QR_CODE'];
        }

        // C. Buat Invoice di Xendit (v2)
        const invoiceData = {
            externalId: externalId,
            amount: totalAmount,
            payerEmail: customerEmail || 'customer@zahasky.com',
            description: description || `Pembayaran Pesanan Zahasky (${externalId})`,
            invoiceDuration: '86400', // 24 jam
            successRedirectUrl: `${req.protocol}://${req.get('host')}/profile.html?tab=orders&status=success`,
            items: Array.isArray(items) ? items.map(item => ({
                name: item.name || 'Produk Zahasky',
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1),
                category: item.page_type || 'Product'
            })) : []
        };

        if (paymentMethodsFilter) {
            invoiceData.paymentMethods = paymentMethodsFilter;
        }

        const Invoice = await Invoice.createInvoice({ data: invoiceData });
        const invoiceUrl = Invoice.invoiceUrl || Invoice.invoice_url;

        res.json({
            success: true,
            orderId: externalId,
            invoiceUrl: invoiceUrl
        });

    } catch (error) {
        console.error("Detail Error Invoice Xendit:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =========================================================================
// Endpoint: E-Wallet Charge — DANA, OVO, GoPay, ShopeePay
// =========================================================================
app.post('/api/payment/ewallet', async (req, res) => {
  try {
    const { orderId, amount, ewalletType } = req.body;

    // Gunakan 'Invoice' (bukan xenditInvoice)
    const response = await Invoice.createInvoice({
      data: {
        externalId: orderId,
        amount: Number(amount),
        paymentMethods: [ewalletType.toUpperCase()], // Memastikan format uppercase (misal: 'DANA', 'SHOPEEPAY')
        currency: 'IDR'
      }
    });

    // Mengambil URL pengalihan invoice asli dari Xendit
    const checkoutUrl = response.invoiceUrl || response.invoice_url;

    return res.json({
      success: true,
      checkoutUrl: checkoutUrl
    });

  } catch (error) {
    console.error('Xendit E-Wallet Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal terhubung ke Xendit'
    });
  }
});

// =========================================================================
// Endpoint 3: Webhook Xendit (Menerima Notifikasi Bayar Otomatis)
// Mendukung /api/xendit/webhook dan /api/webhook/xendit
// Endpoint Webhook Xendit (Menerima Notifikasi Bayar Otomatis)
// =========================================================================
const handleXenditWebhook = async (req, res) => {
    try {
        const xenditTokenHeader = req.headers['x-callback-token'];

        // 1. Verifikasi Token Keamanan (Diperbaiki agar header kosong tidak lolos)
        if (process.env.XENDIT_WEBHOOK_TOKEN && xenditTokenHeader !== process.env.XENDIT_WEBHOOK_TOKEN) {
            console.warn("⚠️ [SECURITY ALERT] Webhook ditolak! Verification Token tidak cocok.");
            return res.status(403).json({ success: false, message: "Invalid Verification Token" });
        }

        // 2. Baca Data Callback dari Xendit
        const callbackData = req.body;
        const externalId = callbackData.external_id || callbackData.externalId || callbackData.reference_id;
        
        // Ambil status dari berbagai jenis payload Xendit (Invoice, E-Wallet, VA)
        const rawStatus = (callbackData.status || callbackData.paid_status || callbackData.event || '').toUpperCase();

        console.log(`\n🔔 [Webhook Xendit] Notifikasi masuk untuk Reference: ${externalId} | Status Raw: ${rawStatus || 'PAYMENT_EVENT'}`);

        // 3. Validasi Pembayaran Lunas
        // Catatan: Callback VA Xendit tidak punya field status, keberadaan external_id di event VA = LUNAS.
        const isVAPayment = callbackData.callback_virtual_account_id || callbackData.account_number;
        const isPaidStatus = isVAPayment || ['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED', 'INVOICE.PAID', 'VIRTUAL_ACCOUNT.PAID'].some(s => rawStatus.includes(s));

        if (isPaidStatus && externalId) {
            console.log(`✓ [Webhook] Pembayaran LUNAS (${externalId}). Mengonfirmasi Quotation di Odoo...`);
            
            try {
                // Pastikan nama fungsi ini sama dengan di odooService.js (confirmSalesOrderByRef atau confirmOdooOrder)
                if (typeof confirmSalesOrderByRef === 'function') {
                    await confirmSalesOrderByRef(externalId);
                } else if (typeof confirmOdooOrder === 'function') {
                    await confirmOdooOrder(externalId);
                }
                console.log(`🎉 [Odoo Delivery] Quotation (${externalId}) sukses dikonfirmasi di Odoo!`);
            } catch (odooConfirmErr) {
                console.error(`⚠️ [Odoo Confirm Error]: ${odooConfirmErr.message}`);
            }
        }

        return res.status(200).json({ success: true, message: "Webhook processed successfully" });

    } catch (error) {
        console.error("❌ [Webhook Error]:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

app.post('/api/xendit/webhook', handleXenditWebhook);
app.post('/api/webhook/xendit', handleXenditWebhook);

// =========================================================================
// Endpoint: E-Wallet Charge — DANA, OVO, GoPay, ShopeePay
// =========================================================================
app.post('/api/payment/ewallet', async (req, res) => {
  try {
    const { orderId, amount, ewalletType } = req.body;

    // Gunakan 'Invoice' (bukan xenditInvoice)
    const response = await Invoice.createInvoice({
      data: {
        externalId: orderId,
        amount: Number(amount),
        paymentMethods: [ewalletType.toUpperCase()], // Memastikan format uppercase (misal: 'DANA', 'SHOPEEPAY')
        currency: 'IDR'
      }
    });

    // Mengambil URL pengalihan invoice asli dari Xendit
    const checkoutUrl = response.invoiceUrl || response.invoice_url;

    return res.json({
      success: true,
      checkoutUrl: checkoutUrl
    });

  } catch (error) {
    console.error('Xendit E-Wallet Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal terhubung ke Xendit'
    });
  }
});

// 1. ENDPOINT: Create Virtual Account (Transfer Bank)
app.post('/api/payment/va', async (req, res) => {
    try {
        const { orderId, amount, bankCode, customerName } = req.body;
        
        const response = await fetch('https://api.xendit.co/callback_virtual_accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                external_id: orderId,
                bank_code: bankCode.toUpperCase(),
                name: customerName || 'Customer Zahasky',
                expected_amount: amount,
                is_closed: true,
                expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
        });
        const vaData = await response.json();
        
        if (!response.ok) {
            throw new Error(vaData.message || vaData.error_code || 'Gagal membuat Virtual Account');
        }

        res.json({
            success: true,
            orderId: orderId,
            bank: vaData.bank_code,
            vaNumber: vaData.account_number,
            amount: vaData.expected_amount,
            expirationDate: vaData.expiration_date,
            status: 'PENDING'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. ENDPOINT: Create E-Wallet Charge
app.post('/api/payment/ewallet', async (req, res) => {
    try {
        const { orderId, amount, ewalletType, phone } = req.body;
        const response = await fetch('https://api.xendit.co/ewallets/charges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                reference_id: orderId,
                currency: 'IDR',
                amount: amount,
                checkout_method: 'ONE_TIME_PAYMENT',
                channel_code: `ID_${ewalletType.toUpperCase()}`,
                channel_properties: {
                    mobile_number: phone || '081234567890',
                    success_redirect_url: `${req.protocol}://${req.get('host')}/profile.html?tab=orders&status=success`
                }
            })
        });
        const ewalletData = await response.json();
        
        // Pengecekan Error jika response Xendit gagal
        if (!response.ok) {
            throw new Error(ewalletData.message || ewalletData.error_code || 'Gagal membuat E-Wallet Charge');
        }
        
        const actions = ewalletData.actions || {};
        const checkoutUrl = actions.desktop_web_checkout_url || actions.mobile_web_checkout_url || actions.qr_checkout_string;
        
        res.json({
            success: true,
            orderId: orderId,
            checkoutUrl: checkoutUrl,
            status: 'PENDING'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. ENDPOINT: Polling Cek Status Pembayaran (Untuk QRIS & VA)
app.get('/api/payment/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const digitalInfo = await getDigitalUrlByOrderId(orderId);
        const isPaid = digitalInfo && (digitalInfo.orderState === 'sale' || digitalInfo.orderState === 'done');

        res.json({
            success: true,
            orderId: orderId,
            status: isPaid ? 'PAID' : 'PENDING',
            orderState: digitalInfo ? digitalInfo.orderState : 'draft',
            driveLink: isPaid ? digitalInfo.driveLink : null
        });
    } catch (error) {
        console.warn(`⚠️ [Status Check Warn]: ${error.message}`);
        res.status(200).json({ 
            success: false, 
            status: 'PENDING', 
            driveLink: null,
            message: error.message 
        });
    }
});
// =========================================================================
// Menjalankan Server Middleware Node.js
// =========================================================================
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});