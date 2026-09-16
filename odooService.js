const xmlrpc = require('xmlrpc');

// Konfigurasi Akun Odoo (Gunakan Environment Variables)
const ODOO_URL = process.env.ODOO_URL || 'https://zahasky-test-staging-37965509.dev.odoo.com';
const ODOO_DB = process.env.ODOO_DB || 'zahasky-test-staging-37965509';
const ODOO_USERNAME = process.env.ODOO_USERNAME || 'nabilahdyna@gmail.com';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD; 

// Parse URL untuk XML-RPC Client
const urlParts = new URL(ODOO_URL);
const isHttps = urlParts.protocol === 'https:';
const host = urlParts.hostname;
const port = urlParts.port || (isHttps ? 443 : 80);

const createClient = (path) => {
    return isHttps 
        ? xmlrpc.createSecureClient({ host, port, path })
        : xmlrpc.createClient({ host, port, path });
};

// 1. Helper Authenticate ke Odoo
async function authenticate() {
    return new Promise((resolve, reject) => {
        const commonClient = createClient('/xmlrpc/2/common');
        commonClient.methodCall('authenticate', [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}], (error, uid) => {
            if (error) return reject(error);
            if (!uid) return reject(new Error("Login Odoo Gagal: Username/Password Salah"));
            resolve(uid);
        });
    });
}

// Helper Internal untuk Fetch Data dengan fallback field aman jika custom field gagal
function executeSearchRead(objectClient, uid, model, domain, fields) {
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
            model, 'search_read',
            domain,
            { fields: fields, limit: 100 }
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result || []);
        });
    });
}

// Helper Internal untuk generic execute_kw
function executeKw(objectClient, uid, model, method, args, kwargs = {}) {
    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
            model, method,
            args, kwargs
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// 2. Mengambil Daftar Produk (Dilengkapi Fallback Field Murni)
async function getProducts() {
    try {
        const uid = await authenticate();
        const objectClient = createClient('/xmlrpc/2/object');
        console.log(`✓ Berhasil terkoneksi ke Odoo. User ID: ${uid}`);

        const fullFields = [
            'name', 'list_price', 'categ_id', 'image_128',
            'x_product_description', 'x_digital_file_url', 
            'x_product_type', 'x_series', 'x_designer_name', 
            'x_designer_role', 'x_file_format', 'x_file_size'
        ];

        const basicFields = ['name', 'list_price', 'categ_id', 'image_128'];

        try {
            // Coba ambil dengan semua custom fields
            return await executeSearchRead(objectClient, uid, 'product.template', [[]], fullFields);
        } catch (customErr) {
            console.warn("⚠️ Custom fields bermasalah/belum dibuat di Odoo. Fallback ke field standar Odoo.");
            // Jika ada custom field yang invalid di Odoo, ambil field dasar agar katalog tidak crash 500
            return await executeSearchRead(objectClient, uid, 'product.template', [[]], basicFields);
        }
    } catch (error) {
        console.error("Odoo Service Error (getProducts):", error);
        throw error;
    }
}

// 3. Mengambil Detail 1 Produk
async function getProductById(productId) {
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');
    const pId = parseInt(productId);

    const fullFields = [
        'name', 'list_price', 'categ_id', 'image_128',
        'x_product_description', 'x_digital_file_url', 
        'x_product_type', 'x_series', 'x_designer_name', 
        'x_designer_role', 'x_file_format', 'x_file_size'
    ];

    const basicFields = ['name', 'list_price', 'categ_id', 'image_128'];

    try {
        const products = await executeSearchRead(objectClient, uid, 'product.template', [[['id', '=', pId]]], fullFields);
        if (!products || products.length === 0) throw new Error('Produk tidak ditemukan');
        return products[0];
    } catch (err) {
        const products = await executeSearchRead(objectClient, uid, 'product.template', [[['id', '=', pId]]], basicFields);
        if (!products || products.length === 0) throw new Error('Produk tidak ditemukan');
        return products[0];
    }
}

// 4. Membuat Sales Order (Quotation)
async function createSalesOrder(partnerId, items, clientRef) {
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');

    return new Promise(async (resolve, reject) => {
        try {
            const itemList = Array.isArray(items) ? items : [items];
            const orderLines = [];

            for (const item of itemList) {
                const pId = parseInt(item.id || item.productId || 1);
                
                const variantIds = await new Promise((res, rej) => {
                    objectClient.methodCall('execute_kw', [
                        ODOO_DB, uid, ODOO_PASSWORD,
                        'product.product', 'search',
                        [[['product_tmpl_id', '=', pId]]]
                    ], (err, ids) => err ? rej(err) : res(ids));
                }).catch(() => []);

                const realProductId = (variantIds && variantIds.length > 0) ? variantIds[0] : pId;

                orderLines.push([0, 0, {
                    'product_id': realProductId,
                    'name': item.name || item.productName || 'Produk Digital',
                    'price_unit': parseFloat(item.price || 0),
                    'product_uom_qty': parseInt(item.quantity || 1)
                }]);
            }

            objectClient.methodCall('execute_kw', [
                ODOO_DB, uid, ODOO_PASSWORD,
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
                    ODOO_DB, uid, ODOO_PASSWORD,
                    'sale.order', 'create',
                    [orderData]
                ], (createErr, orderId) => {
                    if (createErr) return reject(createErr);
                    console.log(`✓ [Odoo] Quotation (${clientRef}) berhasil dibuat dengan ID #${orderId}`);
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
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
            'sale.order', 'action_confirm',
            [[parseInt(orderId)]]
        ], (err, result) => {
            if (err) return reject(err);
            console.log(`✓ [Odoo] Order ID #${orderId} dikonfirmasi!`);
            resolve(result);
        });
    });
}

// 5b. Mengonfirmasi Quotation via Reference ID
async function confirmSalesOrderByRef(clientRef) {
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
            'sale.order', 'search',
            [[['client_order_ref', '=', clientRef]]]
        ], async (err, orderIds) => {
            if (err) return reject(err);
            
            let targetOrderId = (orderIds && orderIds.length > 0) ? orderIds[0] : null;

            if (!targetOrderId && !isNaN(clientRef)) {
                targetOrderId = parseInt(clientRef);
            }

            if (!targetOrderId) {
                console.warn(`⚠️ [Odoo] Quotation Ref ${clientRef} tidak ditemukan.`);
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
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
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

// 7. Mengambil Link Google Drive dari Order ID / Reference ID
async function getDigitalUrlByOrderId(orderId) {
    const uid = await authenticate();
    const objectClient = createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
        let searchDomain = [[]];
        if (!isNaN(orderId)) {
            searchDomain = [[['id', '=', parseInt(orderId)]]];
        } else {
            searchDomain = [[['client_order_ref', '=', String(orderId)]]];
        }

        objectClient.methodCall('execute_kw', [
            ODOO_DB, uid, ODOO_PASSWORD,
            'sale.order', 'search_read',
            searchDomain,
            { fields: ['order_line', 'state'] }
        ], (err, orders) => {
            if (err || !orders || orders.length === 0) {
                return reject(err || new Error('Order tidak ditemukan di Odoo'));
            }

            const orderState = orders[0].state;
            if (!orders[0].order_line || orders[0].order_line.length === 0) {
                return resolve({ productId: null, productName: '', driveLink: null, orderState });
            }

            const lineId = orders[0].order_line[0];

            objectClient.methodCall('execute_kw', [
                ODOO_DB, uid, ODOO_PASSWORD,
                'sale.order.line', 'read',
                [[lineId]],
                { fields: ['product_id'] }
            ], (lineErr, lines) => {
                if (lineErr || !lines || lines.length === 0) return reject(lineErr);
                const variantId = lines[0].product_id[0];

                objectClient.methodCall('execute_kw', [
                    ODOO_DB, uid, ODOO_PASSWORD,
                    'product.product', 'read',
                    [[variantId]],
                    { fields: ['product_tmpl_id'] }
                ], (vErr, variants) => {
                    if (vErr || !variants) return reject(vErr);
                    const templateId = variants[0].product_tmpl_id[0];

                    objectClient.methodCall('execute_kw', [
                        ODOO_DB, uid, ODOO_PASSWORD,
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

// 8. Ambil Daftar Sales Order dari Odoo Berdasarkan Email Customer
async function getOrdersByCustomerEmail(customerEmail) {
    try {
        if (!customerEmail) return [];

        const uid = await authenticate();
        const objectClient = createClient('/xmlrpc/2/object');

        // A. Cari Partner IDs berdasarkan Email
        const partnerIds = await executeKw(
            objectClient, uid,
            'res.partner', 'search',
            [[['email', '=', customerEmail]]]
        ).catch(() => []);

        // Buat Domain Pencarian
        let domain = [];
        if (partnerIds && partnerIds.length > 0) {
            domain = ['|', ['partner_id', 'in', partnerIds], ['client_order_ref', 'ilike', customerEmail]];
        } else {
            domain = [['client_order_ref', 'ilike', customerEmail]];
        }

        // B. Search Read Sale Orders
        const orders = await executeSearchRead(
            objectClient, uid,
            'sale.order',
            [domain],
            ['id', 'name', 'client_order_ref', 'state', 'amount_total', 'date_order', 'order_line']
        );

        if (!orders || orders.length === 0) {
            return [];
        }

        // C. Map Detail Items & Link Drive
        const formattedOrders = await Promise.all(orders.map(async (ord) => {
            let items = [];
            if (ord.order_line && ord.order_line.length > 0) {
                const lines = await executeSearchRead(
                    objectClient, uid,
                    'sale.order.line',
                    [[['id', 'in', ord.order_line]]],
                    ['product_id', 'name', 'product_uom_qty', 'price_unit']
                ).catch(() => []);

                items = lines.map(line => {
                    const pId = Array.isArray(line.product_id) ? line.product_id[0] : 0;
                    const pName = Array.isArray(line.product_id) ? line.product_id[1] : line.name;
                    return {
                        id: pId,
                        name: pName,
                        quantity: line.product_uom_qty || 1,
                        price: line.price_unit || 0,
                        image_url: `/api/products/${pId}/image`
                    };
                });
            }

            const isPaid = ['sale', 'done'].includes(ord.state);
            let driveLink = null;

            if (isPaid) {
                try {
                    const digitalInfo = await getDigitalUrlByOrderId(ord.client_order_ref || ord.id);
                    driveLink = digitalInfo ? digitalInfo.driveLink : null;
                } catch {
                    driveLink = null;
                }
            }

            return {
                order_id: ord.client_order_ref || ord.name,
                odoo_name: ord.name,
                status: isPaid ? 'PAID' : 'PENDING',
                orderState: ord.state,
                total: ord.amount_total,
                subtotal: ord.amount_total,
                date: ord.date_order,
                payment_method: 'Xendit',
                driveLink: driveLink,
                items: items
            };
        }));

        return formattedOrders;

    } catch (error) {
        console.error("❌ Error di getOrdersByCustomerEmail:", error.message);
        return [];
    }
}

module.exports = { 
    getProducts, 
    getProductById, 
    createSalesOrder, 
    confirmSalesOrder, 
    confirmSalesOrderByRef,
    getDigitalFileUrl, 
    getDigitalUrlByOrderId,
    getOrdersByCustomerEmail 
};