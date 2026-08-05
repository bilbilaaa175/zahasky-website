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
function formatProductData(req, product) {
    if (!product) return null;

    const host = req.get('host');
    const protocol = req.protocol;
    
    const formatted = { ...product };

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

// 1. Endpoint Catalog
app.get('/api/catalog', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const catalogProducts = allProducts
            .filter(p => 
                (p.categ_id && p.categ_id[1].toLowerCase().includes('catalog')) || 
                p.x_product_type === 'catalog'
            )
            .map(p => formatProductData(req, p)); // Bersihkan Base64 -> image_url

        res.json({ success: true, products: catalogProducts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Endpoint Package
app.get('/api/package', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const packageProducts = allProducts
            .filter(p => 
                (p.categ_id && p.categ_id[1].toLowerCase().includes('package')) || 
                p.x_product_type === 'package'
            )
            .map(p => formatProductData(req, p)); // Bersihkan Base64 -> image_url

        res.json({ success: true, products: packageProducts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Endpoint Publicity
app.get('/api/publicity', async (req, res) => {
    try {
        const allProducts = await getProducts();
        const publicityProducts = allProducts
            .filter(p => 
                (p.categ_id && p.categ_id[1].toLowerCase().includes('publicity')) || 
                p.x_product_type === 'publicity'
            )
            .map(p => formatProductData(req, p)); // Bersihkan Base64 -> image_url

        res.json({ success: true, products: publicityProducts });
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
// Endpoint 2: Proses Checkout (Buat SO di Odoo + Buat Invoice di Xendit)
// =========================================================================
app.post('/api/checkout', async (req, res) => {
    try {
        const { productId, productName, price, customerEmail } = req.body; 

        // 1. Buat data Sales Order di Odoo dengan Product ID asli
        const odooOrderId = await createSalesOrder(1, productId, productName, price);
        console.log(`✓ Sales Order sukses dibuat di Odoo dengan ID: ${odooOrderId}`);

        // 2. Buat Invoice / Link Pembayaran di Xendit
        const xenditInvoice = await Invoice.createInvoice({
            data: {
                externalId: `odoo-order-${odooOrderId}`,
                amount: price,
                payerEmail: customerEmail,
                description: `Pembayaran untuk ${productName} (Odoo SO #${odooOrderId})`,
                invoiceDuration: '86400',
                items: [
                    {
                        name: productName,
                        price: price,
                        quantity: 1,
                        category: 'Digital Product',
                        referenceId: String(productId) 
                    }
                ]
            }
        });

        res.json({
            success: true,
            message: "Order berhasil dibuat!",
            orderId: odooOrderId,
            paymentUrl: xenditInvoice.invoiceUrl
        });

    } catch (error) {
        console.error("Detail Error:", error);
        res.status(500).json({ success: false, message: "Checkout gagal", error: error.message });
    }
});

// =========================================================================
// Endpoint 3: Webhook Xendit (Menerima Notifikasi Bayar Otomatis)
// =========================================================================
app.post('/api/webhook/xendit', async (req, res) => {
    try {
        // 1. Verifikasi Verification Token dari Header HTTP Xendit
        const xenditTokenHeader = req.headers['x-callback-token'];

        if (xenditTokenHeader !== process.env.XENDIT_WEBHOOK_TOKEN) {
            console.warn("⚠️ [SECURITY ALERT] Webhook ditolak! Verification Token tidak cocok.");
            return res.status(403).json({ success: false, message: "Invalid Verification Token" });
        }

        // 2. Baca Data dari Xendit
        const callbackData = req.body;
        const externalId = callbackData.external_id || callbackData.externalId;
        const status = callbackData.status || callbackData.paid_status;

        console.log(`[Webhook] Notifikasi masuk dari Xendit untuk ID: ${externalId}`);

        // 3. Validasi apakah status pembayaran adalah PAID
        if (status === 'PAID' || status === 'COMPLETED' || status === 'SETTLED') {
            if (externalId && externalId.includes('odoo-order-')) {
                const odooOrderId = parseInt(externalId.split('-').pop());

                console.log(`[Webhook] Pembayaran LUNAS. Memproses konfirmasi untuk Odoo Order ID: ${odooOrderId}`);
                
                // A. Ubah status Quotation -> Sales Order di Odoo
                await confirmSalesOrder(odooOrderId);
                console.log(`✓ [Webhook] Odoo Order ID ${odooOrderId} sukses diperbarui secara otomatis.`);

                // B. Ambil Link Google Drive berdasarkan Order ID
                try {
                    const result = await getDigitalUrlByOrderId(odooOrderId);

                    console.log(`\n🎉 [DIGITAL DELIVERY SUCCESS]`);
                    console.log(`📦 Produk ID: ${result.productId}`);
                    console.log(`📧 Customer: ${callbackData.payer_email || callbackData.payerEmail || 'Customer'}`);
                    console.log(`🔗 Link Download (Google Drive): ${result.driveLink}`);
                    console.log(`--------------------------------------------------\n`);

                } catch (digitalErr) {
                    console.error("⚠️ Gagal mengambil digital link:", digitalErr.message);
                }
            }
        }

        // Respon 200 OK cepat ke Xendit
        return res.status(200).json({ success: true, message: "Webhook processed successfully" });

    } catch (error) {
        console.error("❌ [Webhook Error]:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// Menjalankan Server Middleware Node.js
// =========================================================================
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});