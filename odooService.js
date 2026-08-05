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
async function createSalesOrder(partnerId, productId, productName, price) {
    const uid = await getUserId();
    
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'product.product',
            'search',
            [[['product_tmpl_id', '=', parseInt(productId)]]]
        ], (variantErr, variantIds) => {
            if (variantErr) return reject(variantErr);

            const realProductId = (variantIds && variantIds.length > 0) ? variantIds[0] : parseInt(productId);

            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order', 'default_get',
                [['pricelist_id', 'warehouse_id', 'team_id']]
            ], (defaultErr, defaultValues) => {
                if (defaultErr) return reject(defaultErr);

                const orderData = {
                    ...defaultValues,
                    'partner_id': partnerId || 1, 
                    'order_line': [
                        [0, 0, {
                            'product_id': realProductId,
                            'name': productName,
                            'price_unit': parseFloat(price),
                            'product_uom_qty': 1,
                        }]
                    ]
                };

                objectClient.methodCall('execute_kw', [
                    config.db, uid, config.password,
                    'sale.order', 'create',
                    [orderData]
                ], (createErr, orderId) => {
                    if (createErr) return reject(createErr);
                    resolve(orderId);
                });
            });
        });
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
            [[orderId]]
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

// TAMBAHAN: Ekspor getProductById agar bisa dipanggil di app.js
module.exports = { 
    getProducts, 
    getProductById, 
    createSalesOrder, 
    confirmSalesOrder, 
    getDigitalFileUrl, 
    getDigitalUrlByOrderId 
};