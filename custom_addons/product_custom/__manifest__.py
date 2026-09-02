# -*- coding: utf-8 -*-
{
    'name': 'Product Custom Fields Zahasky',
    'version': '1.0',
    'summary': 'Custom fields for product template Zahasky',
    'description': """
        Modul custom untuk mendaftarkan field-field custom pada product.template
        agar tersimpan permanen di database dan dapat diakses via API / XML-RPC.
    """,
    'category': 'Sales/Product',
    'author': 'Zahasky / Dananjaya Design',
    'depends': ['product'],
    'data': [
        'views/product_template_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
