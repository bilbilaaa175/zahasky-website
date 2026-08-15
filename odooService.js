const xmlrpc = require('xmlrpc');

// Konfigurasi Akun Odoo yang sudah terbukti sukses di Postman tadi
const config = {
    url: process.env.ODOO_URL,
    db: process.env.ODOO_DB, 
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD
};

// Menghubungkan client Node.js ke alamat API Odoo
const commonClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
const objectClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

// 1. Fungsi internal untuk login (mendapatkan User ID secara otomatis)
function getUserId() {
    return new Promise((resolve, reject) => {
        commonClient.methodCall('authenticate', [config.db, config.username, config.password, {}], (err, uid) => {
            if (err) return reject(err);
            if (!uid) return reject(new Error("Gagal login, periksa username/password!"));
            resolve(uid);
        });
    });
}

// 2. Fungsi utama untuk mengambil daftar produk beserta Custom Field dari Odoo
async function getProducts() {
    try {
        const uid = await getUserId();
        console.log(`✓ Berhasil terkoneksi ke Odoo. Menggunakan User ID: ${uid}`);

        return new Promise((resolve, reject) => {
            objectClient.methodCall('execute_kw', [
                config.db,
                uid,
                config.password,
                'product.template',
                'search_read',
                [[]],
                { 
                    // TAMBAHAN: Masukkan semua field kustom yang baru kamu buat di Odoo
                    fields: [
                        'name', 
                        'list_price', 
                        'categ_id',
                        'image_128',
                        'x_product_description',
                        'x_digital_file_url', 
                        'x_product_type', 
                        'x_series', 
                        'x_designer_name', 
                        'x_designer_role', 
                        'x_file_format', 
                        'x_file_size'
                    ], 
                    limit: 100 
                }
            ], (err, products) => {
                if (err) return reject(err);
                resolve(products);
            });
        });
    } catch (error) {
        throw error;
    }
}

// 3. FUNGSI BARU: Mengambil Detail 1 Produk berdasarkan Product ID
async function getProductById(productId) {
    const uid = await getUserId();

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db,
            uid,
            config.password,
            'product.template',
            'search_read',
            [[['id', '=', parseInt(productId)]]],
            { 
                fields: [
                    'name', 
                    'list_price', 
                    'categ_id',
                    'image_128',
                    'x_product_description',
                    'x_digital_file_url', 
                    'x_product_type', 
                    'x_series', 
                    'x_designer_name', 
                    'x_designer_role', 
                    'x_file_format', 
                    'x_file_size'
                ] 
            }
        ], (err, products) => {
            if (err) return reject(err);
            if (!products || products.length === 0) return reject(new Error('Produk tidak ditemukan'));
            resolve(products[0]);
        });
    });
}

// 4. Fungsi untuk membuat Sales Order (Quotation) baru di Odoo
async function createSalesOrder(partnerId, items, clientRef) {
    const uid = await getUserId();
    
    return new Promise(async (resolve, reject) => {
        try {
            // Biar fleksibel jika items berupa single item { productId, productName, price } atau array of items
            const itemList = Array.isArray(items) ? items : [items];
            const orderLines = [];

            for (const item of itemList) {
                const pId = parseInt(item.id || item.productId || 1);
                
                // Cari product.product variant ID dari product_tmpl_id
                const variantIds = await new Promise((res, rej) => {
                    objectClient.methodCall('execute_kw', [
                        config.db, uid, config.password,
                        'product.product', 'search',
                        [[['product_tmpl_id', '=', pId]]]
                    ], (err, ids) => err ? rej(err) : res(ids));
                }).catch(() => []);

                const realProductId = (variantIds && variantIds.length > 0) ? variantIds[0] : pId;

                orderLines.push([0, 0, {
                    'product_id': realProductId,
                    'name': item.name || item.productName || 'Produk Zahasky',
                    'price_unit': parseFloat(item.price || 0),
                    'product_uom_qty': parseInt(item.quantity || 1)
                }]);
            }

            // Ambil default values sale.order
            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order', 'default_get',
                [['pricelist_id', 'warehouse_id', 'team_id']]
            ], (defaultErr, defaultValues) => {
                if (defaultErr) defaultValues = {};

                const orderData = {
                    ...defaultValues,
                    'partner_id': partnerId || 1,
                    'client_order_ref': clientRef || '', // SIMPAN REFERENCE ID (ZHK-...)
                    'order_line': orderLines
                };

                objectClient.methodCall('execute_kw', [
                    config.db, uid, config.password,
                    'sale.order', 'create',
                    [orderData]
                ], (createErr, orderId) => {
                    if (createErr) return reject(createErr);
                    console.log(`✓ [Odoo] Quotation (${clientRef}) berhasil dibuat dengan ID Odoo #${orderId}`);
                    resolve(orderId);
                });
            });
        } catch (err) {
            reject(err);
        }
    });
}

// 5. Fungsi Mengonfirmasi Quotation menjadi Sales Order Terbayar
async function confirmSalesOrder(orderId) {
    const uid = await getUserId();

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db,
            uid,
            config.password,
            'sale.order',
            'action_confirm',
            [[parseInt(orderId)]]
        ], (err, result) => {
            if (err) {
                console.error(`✗ Gagal mengonfirmasi Order ID ${orderId} di Odoo:`, err);
                return reject(err);
            }
            console.log(`✓ [Odoo] Order ID ${orderId} berhasil otomatis dikonfirmasi menjadi Sales Order!`);
            resolve(result);
        });
    });
}

// 5b. Fungsi Mengonfirmasi Quotation di Odoo berdasarkan Reference ID (client_order_ref ZHK-...)
async function confirmSalesOrderByRef(clientRef) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'sale.order', 'search',
            [[['client_order_ref', '=', clientRef]]]
        ], async (err, orderIds) => {
            if (err) return reject(err);
            
            let targetOrderId = (orderIds && orderIds.length > 0) ? orderIds[0] : null;

            // Jika tidak ketemu via client_order_ref, coba cari via numeric ID jika clientRef berupa angka
            if (!targetOrderId && !isNaN(clientRef)) {
                targetOrderId = parseInt(clientRef);
            }

            if (!targetOrderId) {
                console.warn(`⚠️ [Odoo] Quotation dengan reference ID ${clientRef} tidak ditemukan di Odoo.`);
                return resolve(null);
            }

            try {
                const res = await confirmSalesOrder(targetOrderId);
                resolve(res);
            } catch (confErr) {
                reject(confErr);
            }
        });
    });
}

// 6. Fungsi Mengambil Link Google Drive Produk
async function getDigitalFileUrl(productId) {
    const uid = await getUserId();

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db,
            uid,
            config.password,
            'product.template',
            'search_read',
            [[['id', '=', parseInt(productId)]]],
            { fields: ['name', 'x_digital_file_url'] }
        ], (err, products) => {
            if (err) return reject(err);
            if (!products || products.length === 0) return reject(new Error('Produk tidak ditemukan'));
            resolve(products[0].x_digital_file_url || null);
        });
    });
}

// 7. Fungsi Ambil Link Google Drive Langsung dari Sales Order ID
async function getDigitalUrlByOrderId(orderId) {
    const uid = await getUserId();

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'sale.order', 'read',
            [[parseInt(orderId)]],
            { fields: ['order_line'] }
        ], (err, orders) => {
            if (err) return reject(err);
            if (!orders || orders.length === 0 || orders[0].order_line.length === 0) {
                return reject(new Error('Sales Order tidak ditemukan atau tidak memiliki produk'));
            }

            const lineId = orders[0].order_line[0];

            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order.line', 'read',
                [[lineId]],
                { fields: ['product_id'] }
            ], (lineErr, lines) => {
                if (lineErr) return reject(lineErr);
                if (!lines || lines.length === 0) return reject(new Error('Order line tidak ditemukan'));

                const variantId = lines[0].product_id[0];

                objectClient.methodCall('execute_kw', [
                    config.db, uid, config.password,
                    'product.product', 'read',
                    [[variantId]],
                    { fields: ['product_tmpl_id'] }
                ], (variantErr, variants) => {
                    if (variantErr) return reject(variantErr);
                    if (!variants || variants.length === 0) return reject(new Error('Varian produk tidak ditemukan'));

                    const templateId = variants[0].product_tmpl_id[0];

                    objectClient.methodCall('execute_kw', [
                        config.db, uid, config.password,
                        'product.template', 'read',
                        [[templateId]],
                        { fields: ['x_digital_file_url'] }
                    ], (prodErr, templates) => {
                        if (prodErr) return reject(prodErr);
                        if (!templates || templates.length === 0) return reject(new Error('Template Produk tidak ditemukan'));

                        resolve({
                            productId: templateId,
                            driveLink: templates[0].x_digital_file_url || null
                        });
                    });
                });
            });
        });
    });
}

/**
 * Mengambil Link Google Drive (x_digital_file_url) dari Odoo berdasarkan Sales Order ID
 */
async function getDigitalUrlByOrderId(orderId) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        // 1. Ambil Sale Order
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'sale.order', 'read',
            [[parseInt(orderId)]],
            { fields: ['order_line', 'state'] }
        ], (err, orders) => {
            if (err || !orders || orders.length === 0) return reject(err || new Error('Order tidak ditemukan'));
            const orderState = orders[0].state; // 'draft', 'sale', 'done'
            const lineId = orders[0].order_line[0];
            // 2. Ambil Product Variant dari Order Line
            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order.line', 'read',
                [[lineId]],
                { fields: ['product_id'] }
            ], (lineErr, lines) => {
                if (lineErr || !lines || lines.length === 0) return reject(lineErr);
                const variantId = lines[0].product_id[0];
                // 3. Ambil Product Template ID
                objectClient.methodCall('execute_kw', [
                    config.db, uid, config.password,
                    'product.product', 'read',
                    [[variantId]],
                    { fields: ['product_tmpl_id'] }
                ], (vErr, variants) => {
                    if (vErr || !variants) return reject(vErr);
                    const templateId = variants[0].product_tmpl_id[0];
                    // 4. Ambil Custom Field x_digital_file_url dari product.template
                    objectClient.methodCall('execute_kw', [
                        config.db, uid, config.password,
                        'product.template', 'read',
                        [[templateId]],
                        { fields: ['name', 'x_digital_file_url', 'x_product_type'] }
                    ], (pErr, templates) => {
                        if (pErr || !templates) return reject(pErr);
                        resolve({
                            productId: templateId,
                            productName: templates[0].name,
                            driveLink: templates[0].x_digital_file_url || null,
                            orderState: orderState
                        });
                    });
                });
            });
        });
    });
}

// TAMBAHAN: Ekspor getProductById agar bisa dipanggil di app.js
module.exports = { 
    getProducts, 
    getProductById, 
    createSalesOrder, 
    confirmSalesOrder, 
    confirmSalesOrderByRef,
    getDigitalFileUrl, 
    getDigitalUrlByOrderId 
};