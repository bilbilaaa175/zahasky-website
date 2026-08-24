const xmlrpc = require('xmlrpc');

// Konfigurasi Akun Odoo
const config = {
    url: process.env.ODOO_URL,
    db: process.env.ODOO_DB, 
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD
};

const commonClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
const objectClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

// 1. Fungsi internal untuk login
function getUserId() {
    return new Promise((resolve, reject) => {
        commonClient.methodCall('authenticate', [config.db, config.username, config.password, {}], (err, uid) => {
            if (err) return reject(err);
            if (!uid) return reject(new Error("Gagal login, periksa username/password!"));
            resolve(uid);
        });
    });
}

// 2. Mengambil daftar produk
async function getProducts() {
    try {
        const uid = await getUserId();
        return new Promise((resolve, reject) => {
            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'product.template', 'search_read',
                [[]],
                { 
                    fields: [
                        'name', 'list_price', 'categ_id', 'image_128',
                        'x_product_description', 'x_digital_file_url', 
                        'x_product_type', 'x_series', 'x_designer_name', 
                        'x_designer_role', 'x_file_format', 'x_file_size'
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

// 3. Mengambil Detail 1 Produk
async function getProductById(productId) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'product.template', 'search_read',
            [[['id', '=', parseInt(productId)]]],
            { 
                fields: [
                    'name', 'list_price', 'categ_id', 'image_128',
                    'x_product_description', 'x_digital_file_url', 
                    'x_product_type', 'x_series', 'x_designer_name', 
                    'x_designer_role', 'x_file_format', 'x_file_size'
                ] 
            }
        ], (err, products) => {
            if (err) return reject(err);
            if (!products || products.length === 0) return reject(new Error('Produk tidak ditemukan'));
            resolve(products[0]);
        });
    });
}

// 4. Membuat Sales Order (Quotation)
async function createSalesOrder(partnerId, items, clientRef) {
    const uid = await getUserId();
    return new Promise(async (resolve, reject) => {
        try {
            const itemList = Array.isArray(items) ? items : [items];
            const orderLines = [];

            for (const item of itemList) {
                const pId = parseInt(item.id || item.productId || 1);
                
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

            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order', 'default_get',
                [['pricelist_id', 'warehouse_id', 'team_id']]
            ], (defaultErr, defaultValues) => {
                if (defaultErr) defaultValues = {};

                const orderData = {
                    ...defaultValues,
                    'partner_id': partnerId || 1,
                    'client_order_ref': clientRef || '',
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

// 5. Mengonfirmasi Quotation via ID
async function confirmSalesOrder(orderId) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'sale.order', 'action_confirm',
            [[parseInt(orderId)]]
        ], (err, result) => {
            if (err) {
                console.error(`✗ Gagal mengonfirmasi Order ID ${orderId} di Odoo:`, err);
                return reject(err);
            }
            console.log(`✓ [Odoo] Order ID ${orderId} berhasil dikonfirmasi!`);
            resolve(result);
        });
    });
}

// 5b. Mengonfirmasi Quotation via Reference ID
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

// 6. Mengambil Link Google Drive dari Product ID
async function getDigitalFileUrl(productId) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'product.template', 'search_read',
            [[['id', '=', parseInt(productId)]]],
            { fields: ['name', 'x_digital_file_url'] }
        ], (err, products) => {
            if (err) return reject(err);
            if (!products || products.length === 0) return reject(new Error('Produk tidak ditemukan'));
            resolve(products[0].x_digital_file_url || null);
        });
    });
}

// 7. Mengambil Link Google Drive dari Sales Order ID / Client Reference (SUDAH DIPERBAIKI)
async function getDigitalUrlByOrderId(orderId) {
    const uid = await getUserId();
    return new Promise((resolve, reject) => {
        
        // Pencarian fleksibel: Jika orderId berupa ID angka atau Reference String (ZHK-...)
        let searchDomain = [[]];
        if (!isNaN(orderId)) {
            searchDomain = [[['id', '=', parseInt(orderId)]]];
        } else {
            searchDomain = [[['client_order_ref', '=', String(orderId)]]];
        }

        objectClient.methodCall('execute_kw', [
            config.db, uid, config.password,
            'sale.order', 'search_read',
            searchDomain,
            { fields: ['order_line', 'state'] }
        ], (err, orders) => {
            if (err || !orders || orders.length === 0) {
                return reject(err || new Error('Order tidak ditemukan di Odoo'));
            }

            const orderState = orders[0].state; // 'draft', 'sale', 'done'
            if (!orders[0].order_line || orders[0].order_line.length === 0) {
                return resolve({ productId: null, productName: '', driveLink: null, orderState });
            }

            const lineId = orders[0].order_line[0];

            // Read Order Line
            objectClient.methodCall('execute_kw', [
                config.db, uid, config.password,
                'sale.order.line', 'read',
                [[lineId]],
                { fields: ['product_id'] }
            ], (lineErr, lines) => {
                if (lineErr || !lines || lines.length === 0) return reject(lineErr);
                const variantId = lines[0].product_id[0];

                // Read Product Variant
                objectClient.methodCall('execute_kw', [
                    config.db, uid, config.password,
                    'product.product', 'read',
                    [[variantId]],
                    { fields: ['product_tmpl_id'] }
                ], (vErr, variants) => {
                    if (vErr || !variants) return reject(vErr);
                    const templateId = variants[0].product_tmpl_id[0];

                    // Read Product Template untuk ambil Link Drive
                    objectClient.methodCall('execute_kw', [
                        config.db, uid, config.password,
                        'product.template', 'read',
                        [[templateId]],
                        { fields: ['name', 'x_digital_file_url'] }
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

module.exports = { 
    getProducts, 
    getProductById, 
    createSalesOrder, 
    confirmSalesOrder, 
    confirmSalesOrderByRef,
    getDigitalFileUrl, 
    getDigitalUrlByOrderId 
};