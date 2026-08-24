// Load environment variables dari .env paling awal
require('dotenv').config();

const path = require('path');
const express = require('express');
// Menggunakan cara import modular sesuai dengan SDK Xendit versi terbaru
const { Xendit } = require('xendit-node'); 

// Mengimpor modul dari odooService
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
// HELPER: Mengubah Base64 panjang menjadi URL file .png yang rapi
// =========================================================================

const ROLE_MAP = {
  'product_designer': '3D Product Designer',
  'industrial_designer': 'Industrial Designer',
  'graphic_designer': 'Graphic Designer'
};

function formatProductData(req, product) {
    if (!product) return null;

    const host = req.get('host');
    const protocol = req.protocol;
    
    const rawRole = product.x_designer_role || '';
    const formattedRole = ROLE_MAP[rawRole] || rawRole;

    const formatted = { 
        ...product,
        x_designer_role: formattedRole
    };

    delete formatted.image_128;
    formatted.image_url = `${protocol}://${host}/api/products/${product.id}/image`;

    return formatted;
}

// =========================================================================
// Endpoint 1: Ambil Semua Produk dari Odoo
// =========================================================================
app.get('/api/products', async (req, res) => {
    try {
        const odooData = await getProducts();
        const formattedProducts = odooData.map(p => formatProductData(req, p));
        res.json({ success: true, products: formattedProducts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// Endpoint Kategori Khusus (Catalog, Package, Publicity)
// =========================================================================

function filterByCategory(products, targetCategory) {
    return products.filter(p => {
        const categName = Array.isArray(p.categ_id) ? p.categ_id[1] : '';
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
// ENDPOINT GAMBAR: Menyajikan File Gambar (.png) Asli
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
// Endpoint 2: Proses Checkout (Buat Quotation di Odoo + Invoice di Xendit)
// =========================================================================
app.post('/api/checkout', async (req, res) => {
    try {
        const { orderId, amount, customerEmail, customerName, items, description, bankCode } = req.body; 

        const externalId = orderId || `ZHK-${Date.now()}`;
        const totalAmount = parseFloat(amount || 0);

        // A. Buat Quotation di Odoo
        try {
            const odooOrderId = await createSalesOrder(1, items, externalId);
            console.log(`✓ [Odoo] Quotation (${externalId}) sukses dibuat di Odoo dengan Order ID: #${odooOrderId}`);
        } catch (odooErr) {
            console.warn(`⚠️ [Odoo] Gagal membuat Quotation di Odoo: ${odooErr.message}`);
        }

        // B. Mapping filter paymentMethods Xendit Invoice
        let paymentMethodsFilter = undefined;
        if (bankCode) {
            const code = bankCode.toUpperCase();
            if (code === 'QRIS') {
                paymentMethodsFilter = ['QR_CODE'];
            } else {
                paymentMethodsFilter = [code]; // misal: ['BNI'], ['BCA'], ['MANDIRI']
            }
        }

        // C. Buat Invoice di Xendit
        const invoiceData = {
            externalId: externalId,
            amount: totalAmount,
            payerEmail: customerEmail || 'customer@zahasky.com',
            description: description || `Pembayaran Pesanan Zahasky (${externalId})`,
            invoiceDuration: '86400',
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

        const xenditInvoice = await Invoice.createInvoice({ data: invoiceData });
        const invoiceUrl = xenditInvoice.invoiceUrl || xenditInvoice.invoice_url;
        console.log(`✓ Invoice Xendit berhasil dibuat untuk ${externalId}: ${invoiceUrl}`);

        res.json({
            success: true,
            message: "Invoice Xendit & Quotation Odoo berhasil dibuat!",
            orderId: externalId,
            invoiceUrl: invoiceUrl
        });

    } catch (error) {
        console.error("Detail Error Invoice Xendit:", error);
        res.status(500).json({ success: false, message: "Gagal membuat Invoice Xendit", error: error.message });
    }
});

// =========================================================================
// Endpoint 3: Webhook Xendit
// =========================================================================
const handleXenditWebhook = async (req, res) => {
    try {
        const xenditTokenHeader = req.headers['x-callback-token'];

        if (process.env.XENDIT_WEBHOOK_TOKEN && xenditTokenHeader && xenditTokenHeader !== process.env.XENDIT_WEBHOOK_TOKEN) {
            console.warn("⚠️ [SECURITY ALERT] Webhook ditolak! Verification Token tidak cocok.");
            return res.status(403).json({ success: false, message: "Invalid Verification Token" });
        }

        const callbackData = req.body;
        const externalId = callbackData.external_id || callbackData.externalId || callbackData.reference_id;
        const status = (callbackData.status || callbackData.paid_status || callbackData.event || '').toUpperCase();

        console.log(`\n🔔 [Webhook Xendit] Notifikasi masuk untuk Reference: ${externalId} | Status: ${status}`);

        const isPaidStatus = ['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED', 'INVOICE.PAID', 'VIRTUAL_ACCOUNT.PAID'].some(s => status.includes(s));

        if (isPaidStatus && externalId) {
            console.log(`✓ [Webhook] Pembayaran LUNAS (${externalId}). Mengonfirmasi Quotation di Odoo...`);
            
            try {
                await confirmSalesOrderByRef(externalId);
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

// 1. ENDPOINT: Create Virtual Account
app.post('/api/payment/va', async (req, res) => {
    try {
        const { orderId, amount, bankCode, customerName, customerEmail } = req.body;
        
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
            throw new Error(vaData.message || 'Gagal membuat Virtual Account');
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

// 2. ENDPOINT: Create E-Wallet Invoice / Charge
app.post('/api/payment/ewallet', async (req, res) => {
    try {
        const { orderId, amount, ewalletType, items, customerEmail, phone } = req.body;
        const externalId = orderId || `ZHK-${Date.now()}`;
        const totalAmount = parseFloat(amount || 0);

        // A. Buat Quotation di Odoo terlebih dahulu
        try {
            const odooOrderId = await createSalesOrder(1, items || [], externalId);
            console.log(`✓ [Odoo] Quotation (${externalId}) sukses dibuat di Odoo dengan Order ID: #${odooOrderId}`);
        } catch (odooErr) {
            console.warn(`⚠️ [Odoo] Gagal membuat Quotation untuk e-wallet: ${odooErr.message}`);
        }

        // B. Mapping filter paymentMethods Xendit untuk E-Wallet
        let ewalletMethod = (ewalletType || '').toUpperCase();
        if (ewalletMethod === 'GOPAY') {
            ewalletMethod = 'QRIS';
        }

        const invoiceData = {
            externalId: externalId,
            amount: totalAmount,
            payerEmail: customerEmail || 'customer@zahasky.com',
            description: `Pembayaran E-Wallet Zahasky (${externalId})`,
            invoiceDuration: '86400',
            successRedirectUrl: `${req.protocol}://${req.get('host')}/profile.html?tab=orders&status=success`,
            paymentMethods: [ewalletMethod],
            items: Array.isArray(items) ? items.map(item => ({
                name: item.name || 'Produk Zahasky',
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1),
                category: item.page_type || 'Product'
            })) : []
        };

        const createdInvoice = await Invoice.createInvoice({ data: invoiceData });
        const invoiceUrl = createdInvoice.invoiceUrl || createdInvoice.invoice_url;
        console.log(`✓ Invoice E-Wallet (${ewalletMethod}) berhasil dibuat untuk ${externalId}: ${invoiceUrl}`);

        res.json({
            success: true,
            orderId: externalId,
            checkoutUrl: invoiceUrl,
            invoiceUrl: invoiceUrl,
            status: 'PENDING'
        });
    } catch (error) {
        console.error('E-Wallet Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. ENDPOINT: Polling Cek Status Pembayaran & Ambil Link Drive (DIPERBAIKI)
app.get('/api/payment/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const digitalInfo = await getDigitalUrlByOrderId(orderId);
        const isPaid = digitalInfo && (digitalInfo.orderState === 'sale' || digitalInfo.orderState === 'done');
        
        console.log(`[Status Cek] Order ID: ${orderId} | State Odoo: ${digitalInfo?.orderState} | Link Drive: ${digitalInfo?.driveLink}`);

        res.json({
            success: true,
            orderId: orderId,
            status: isPaid ? 'PAID' : 'PENDING',
            orderState: digitalInfo ? digitalInfo.orderState : 'draft',
            driveLink: isPaid && digitalInfo ? digitalInfo.driveLink : null
        });
    } catch (error) {
        console.error("⚠️ [Payment Status Error]:", error.message);
        res.status(500).json({ success: false, status: 'PENDING', driveLink: null, error: error.message });
    }
});

// 4. ENDPOINT BARU: Khusus Ambil Link Google Drive
app.get('/api/orders/:orderId/digital-link', async (req, res) => {
    try {
        const { orderId } = req.params;
        const digitalInfo = await getDigitalUrlByOrderId(orderId);

        res.json({
            success: true,
            orderId: orderId,
            orderState: digitalInfo.orderState,
            productName: digitalInfo.productName,
            driveLink: digitalInfo.driveLink
        });
    } catch (error) {
        console.error("❌ [Digital Link Error]:", error.message);
        res.status(500).json({ success: false, message: error.message, driveLink: null });
    }
});

// =========================================================================
// Menjalankan Server Middleware Node.js
// =========================================================================
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});